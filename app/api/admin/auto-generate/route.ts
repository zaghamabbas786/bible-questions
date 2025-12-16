import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase-server'
import { generateUniqueSlug } from '@/lib/slugify'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })

/**
 * Check if user has admin access
 */
async function checkAdminAccess(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false

  const user = await currentUser()
  if (!user) return false

  const userEmail = user.emailAddresses.find(
    email => email.id === user.primaryEmailAddressId
  )?.emailAddress

  const allowedEmails = (process.env.ALLOWED_ADMIN_EMAILS || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0)

  return userEmail ? allowedEmails.includes(userEmail.toLowerCase()) : false
}

/**
 * Auto-generate Biblical Q&A
 * This endpoint handles the automatic generation process
 * It generates questions, checks for duplicates, answers them, and saves to database
 */

// In-memory state (in production, use Redis or database)
// Export so stats API can access it
export let isGenerating = false
export let generationController: AbortController | null = null

// Helper to update state
export function setGenerating(value: boolean) {
  isGenerating = value
}

export function getGeneratingState() {
  return isGenerating
}

export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const hasAccess = await checkAdminAccess()
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()

    if (action === 'start') {
      if (isGenerating) {
        return NextResponse.json({ error: 'Generation already running' }, { status: 400 })
      }

      // Check daily limit
      const supabase = await createClient()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { count: todayCount } = await supabase
        .from('searches')
        .select('*', { count: 'exact', head: true })
        .not('result', 'is', null)
        .gte('created_at', today.toISOString())

      const DAILY_LIMIT = 500
      const remaining = DAILY_LIMIT - (todayCount || 0)

      if (remaining <= 0) {
        return NextResponse.json({ 
          error: 'Daily limit reached',
          todayCount,
          limit: DAILY_LIMIT 
        }, { status: 400 })
      }

      // Start generation in background
      setGenerating(true)
      generationController = new AbortController()
      
      // Run generation asynchronously
      runGeneration(userId, remaining).catch(err => {
        console.error('Generation failed:', err)
        isGenerating = false
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Generation started',
        remaining 
      })

    } else if (action === 'stop') {
      if (!isGenerating) {
        return NextResponse.json({ error: 'No generation running' }, { status: 400 })
      }

      setGenerating(false)
      generationController?.abort()
      generationController = null

      return NextResponse.json({ 
        success: true, 
        message: 'Generation stopped' 
      })

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Auto-generate error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to process request' },
      { status: 500 }
    )
  }
}

/**
 * Background generation process
 * Generates questions, checks duplicates, answers them, and saves to DB
 */
async function runGeneration(userId: string, maxCount: number) {
  console.log(`Starting generation for ${maxCount} questions - Parallel mode (3 at a time)`)
  
  let generated = 0
  const batchSize = 10 // Generate 10 questions per batch
  const parallelCount = 3 // Process 3 questions in parallel
  let retryCount = 0
  const maxRetries = 3

  while (isGenerating && generated < maxCount) {
    try {
      // Step 1: Generate batch of questions
      console.log(`[Batch ${Math.floor(generated / batchSize) + 1}] Generating ${batchSize} questions...`)
      
      const questions = await generateBiblicalQuestions(batchSize)
      
      if (!questions || questions.length === 0) {
        console.error('Failed to generate questions batch')
        retryCount++
        
        if (retryCount >= maxRetries) {
          console.error('Max retries reached, stopping generation')
          setGenerating(false)
          break
        }
        
        // Exponential backoff: wait longer each retry
        const waitTime = Math.min(60000, 10000 * Math.pow(2, retryCount))
        console.log(`Retrying in ${waitTime / 1000} seconds...`)
        await sleep(waitTime)
        continue
      }
      
      // Reset retry count on success
      retryCount = 0
      console.log(`✅ Generated ${questions.length} questions`)
      
      // Step 2: Process questions in parallel chunks (3 at a time)
      for (let i = 0; i < questions.length; i += parallelCount) {
        if (!isGenerating || generated >= maxCount) break
        
        // Get next 3 questions to process in parallel
        const chunk = questions.slice(i, i + parallelCount)
        console.log(`\n🔄 Processing ${chunk.length} questions in parallel...`)
        
        // Process all questions in this chunk simultaneously
        const results = await Promise.allSettled(
          chunk.map(question => processQuestion(question, userId, generated))
        )
        
        // Count successful saves
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.success) {
            generated++
            console.log(`✅ [${generated}/${maxCount}] ${result.value.message}`)
          } else if (result.status === 'fulfilled' && result.value.skipped) {
            console.log(`⏭️  ${result.value.message}`)
          } else if (result.status === 'rejected') {
            console.error(`❌ Error processing question: ${result.reason}`)
          }
        })
        
        // Small delay between parallel chunks (2 seconds)
        if (isGenerating && generated < maxCount && i + parallelCount < questions.length) {
          console.log(`⏳ Waiting 2 seconds before next parallel chunk...`)
          await sleep(2000)
        }
      }

      // Wait 10 seconds between batches
      if (isGenerating && generated < maxCount) {
        console.log(`\n⏸️  Batch complete. Waiting 10 seconds before next batch...\n`)
        await sleep(10000)
      }

    } catch (error) {
      console.error('Batch generation error:', error)
      await sleep(5000)
    }
  }

  setGenerating(false)
  console.log(`\n🎉 Generation complete. Generated ${generated} questions.`)
}

/**
 * Process a single question: check duplicates, answer, save to DB
 * Returns success status and message
 */
async function processQuestion(question: string, userId: string, currentCount: number) {
  try {
    const supabase = await createClient()
    
    // Check if question already exists
    const { data: existing } = await supabase
      .from('searches')
      .select('id')
      .ilike('query', question)
      .maybeSingle()

    if (existing) {
      return {
        success: false,
        skipped: true,
        message: `Skipping duplicate: ${question.substring(0, 60)}...`
      }
    }

    // Answer the question using Gemini
    console.log(`💬 [${currentCount + 1}] Answering: ${question.substring(0, 60)}...`)
    
    const result = await answerBiblicalQuestion(question)
    
    if (!result) {
      return {
        success: false,
        message: `Failed to answer: ${question.substring(0, 60)}...`
      }
    }

    // Generate unique slug
    const { data: existingSlugs } = await supabase
      .from('searches')
      .select('slug')
    
    const slugs = existingSlugs?.map(s => s.slug) || []
    const slug = generateUniqueSlug(question, slugs)

    // Save to database
    const { error: insertError } = await supabase
      .from('searches')
      .insert({
        query: question,
        slug,
        result,
        user_id: userId,
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      return {
        success: false,
        message: `Failed to save: ${insertError.message}`
      }
    }

    return {
      success: true,
      message: `Saved: ${question.substring(0, 50)}... → /question/${slug}`
    }

  } catch (error: any) {
    throw new Error(`Error processing "${question.substring(0, 40)}...": ${error?.message || 'Unknown error'}`)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generate biblical questions using Gemini
 */
async function generateBiblicalQuestions(count: number): Promise<string[]> {
  try {
    const prompt = `Generate ${count} unique, thoughtful biblical questions that people might ask about the Bible. 

Requirements:
- Questions should cover different topics (theology, history, characters, prophecy, wisdom, etc.)
- Mix of "who", "what", "where", "when", "why", and "how" questions
- Questions should be clear and specific
- Avoid yes/no questions
- Focus on questions that require detailed, educational answers
- Include both Old and New Testament topics

Format: Return ONLY a JSON array of questions, nothing else.

Example format:
["Who was Moses and what was his role in Israel?", "What is the significance of the Ark of the Covenant?", "Where did Jesus perform his first miracle?"]

Generate ${count} questions now:`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Use same model as main app (geminiService.ts)
      contents: prompt,
    })

    const text = response.text || ''
    
    if (!text) {
      console.error('No text in response')
      return []
    }

    // Parse the JSON response
    let questions: string[] = []
    try {
      // Try to extract JSON array from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0])
      } else {
        // Fallback: split by newlines and clean up
        questions = text
          .split('\n')
          .map(q => q.trim())
          .filter(q => q.length > 10 && !q.startsWith('{') && !q.startsWith('['))
          .map(q => q.replace(/^[0-9]+\.\s*/, '').replace(/^[\-\*]\s*/, '').replace(/^["']|["']$/g, ''))
          .filter(q => q.length > 0)
      }
    } catch (parseError) {
      console.error('Failed to parse questions:', parseError)
      questions = text
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 10)
        .slice(0, count)
    }

    return questions.slice(0, count)
  } catch (error: any) {
    console.error('Question generation error:', error)
    
    // Check if it's a rate limit error (429)
    if (error?.status === 429) {
      console.log('Rate limit hit, waiting before retry...')
      // Extract retry delay from error if available
      const retryDelay = error?.details?.find((d: any) => d['@type']?.includes('RetryInfo'))?.retryDelay
      if (retryDelay) {
        const seconds = parseInt(retryDelay.replace('s', ''))
        console.log(`API suggests waiting ${seconds} seconds`)
      }
    }
    
    return []
  }
}

/**
 * Answer a biblical question using Gemini (same as search API)
 */
async function answerBiblicalQuestion(question: string): Promise<any> {
  try {
    // Use the same prompt structure as your search API
    const prompt = `You are a biblical scholar. Provide a comprehensive study on: "${question}"

Please provide:
1. A detailed answer (2-3 paragraphs)
2. Key terms with definitions
3. Relevant scripture references with verses
4. Historical context
5. Theological insights

Return as JSON in this exact format:
{
  "isRelevant": true,
  "content": {
    "literalAnswer": "detailed answer here",
    "keyTerms": [{"term": "term", "definition": "definition"}],
    "scriptureReferences": [{"reference": "Genesis 1:1", "text": "verse text"}],
    "historicalContext": "context here",
    "theologicalInsight": "insight here",
    "searchTopic": "main topic"
  }
}`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Use same model as main app (geminiService.ts)
      contents: prompt,
    })

    const text = response.text || ''
    
    if (!text) {
      console.error('No text in response')
      return null
    }

    // Try to parse JSON from response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      // Fallback: create basic response
      return {
        isRelevant: true,
        content: {
          literalAnswer: text.substring(0, 500),
          keyTerms: [],
          scriptureReferences: [],
          historicalContext: text,
          theologicalInsight: '',
          searchTopic: question
        }
      }
    }
  } catch (error) {
    console.error('Answer generation error:', error)
    return null
  }
}

// Status endpoint
export async function GET() {
  // Check admin access
  const hasAccess = await checkAdminAccess()
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  return NextResponse.json({ 
    isGenerating,
    status: isGenerating ? 'running' : 'stopped'
  })
}

