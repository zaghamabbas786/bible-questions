import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { generateUniqueSlug } from '@/lib/slugify'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })
const MODEL_NAME = 'gemini-2.5-flash'

/**
 * Vercel Cron Job - Runs every 60 seconds
 * Checks database flag and generates questions if enabled
 * 
 * Security: Validates cron secret to ensure only Vercel can call this
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Verify this is a legitimate cron request from Vercel
    const authHeader = request.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
    
    // Log for debugging
    console.log('🔍 Cron Debug:', {
      hasAuthHeader: !!authHeader,
      hasCronSecret: !!process.env.CRON_SECRET,
      authMatch: authHeader === expectedAuth,
    })
    
    if (!process.env.CRON_SECRET) {
      console.warn('⚠️  CRON_SECRET not set - proceeding anyway (INSECURE!)')
    } else if (authHeader !== expectedAuth) {
      console.error('❌ Unauthorized cron attempt')
      return NextResponse.json({ 
        error: 'Unauthorized',
        debug: {
          hasAuthHeader: !!authHeader,
          hasCronSecret: !!process.env.CRON_SECRET,
        }
      }, { status: 401 })
    }

    console.log('⏰ Cron job triggered at', new Date().toISOString())

    const supabase = await createClient()

    // Step 1: Check the generation flag in database
    const { data: config, error: configError } = await supabase
      .from('admin_config')
      .select('value')
      .eq('key', 'generation_status')
      .single()

    if (configError || !config) {
      console.error('❌ Failed to read config:', configError)
      return NextResponse.json({ error: 'Config not found' }, { status: 500 })
    }

    const status = config.value as {
      is_generating: boolean
      progress: number
      target: number
      started_at?: string | null
      last_run_at?: string | null
    }

    // Step 2: If not generating, return early
    if (!status.is_generating) {
      console.log('⏸️  Generation is paused, skipping...')
      return NextResponse.json({ 
        success: true, 
        message: 'Generation paused',
        skipped: true 
      })
    }

    // Step 3: Check if we've reached the target
    if (status.progress >= status.target) {
      console.log('✅ Target reached, stopping generation')
      await supabase
        .from('admin_config')
        .update({ 
          value: { 
            ...status, 
            is_generating: false 
          } 
        })
        .eq('key', 'generation_status')
      
      return NextResponse.json({ 
        success: true, 
        message: 'Target reached',
        completed: true 
      })
    }

    console.log(`🚀 Generating questions [${status.progress}/${status.target}]...`)

    // Step 4: Generate questions (3 per run to stay within API limits)
    const parallelCount = 3
    
    const questions = await generateBiblicalQuestions(parallelCount)
    
    if (!questions || questions.length === 0) {
      console.error('❌ Failed to generate questions')
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to generate questions' 
      })
    }

    console.log(`✅ Generated ${questions.length} questions`)

    // Step 5: Process all questions in parallel
    let savedCount = 0

    const results = await Promise.allSettled(
      questions.map(question => processQuestion(question, supabase))
    )

    let skippedCount = 0
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.success) {
        savedCount++
        console.log(`✅ ${result.value.message}`)
      } else if (result.status === 'fulfilled' && result.value.skipped) {
        skippedCount++
        console.log(`⏭️  ${result.value.message}`)
      }
    })

    // Step 6: Update progress in database
    const newProgress = status.progress + savedCount
    await supabase
      .from('admin_config')
      .update({ 
        value: { 
          ...status, 
          progress: newProgress,
          last_run_at: new Date().toISOString()
        } 
      })
      .eq('key', 'generation_status')

    const duration = Date.now() - startTime
    console.log(`✅ Cron completed in ${duration}ms - Saved ${savedCount} questions [${newProgress}/${status.target}]`)

    return NextResponse.json({ 
      success: true, 
      message: `Generated ${savedCount} questions`,
      progress: newProgress,
      target: status.target,
      duration_ms: duration,
      savedCount: savedCount,
      skippedCount: skippedCount || 0,
    })

  } catch (error: any) {
    console.error('❌ Cron error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Cron execution failed' 
      },
      { status: 500 }
    )
  }
}

/**
 * Process a single question: check duplicates, answer, save to DB
 */
async function processQuestion(question: string, supabase: any) {
  try {
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
        message: `Skipping duplicate: ${question.substring(0, 50)}...`
      }
    }

    // Answer the question
    const result = await answerBiblicalQuestion(question)
    
    if (!result) {
      return {
        success: false,
        message: `Failed to answer: ${question.substring(0, 50)}...`
      }
    }

    // Generate unique slug
    const { data: existingSlugs } = await supabase
      .from('searches')
      .select('slug')
    
    const slugs = existingSlugs?.map((s: any) => s.slug) || []
    const slug = generateUniqueSlug(question, slugs)

    // Get admin user ID (or use system user)
    const { data: config } = await supabase
      .from('admin_config')
      .select('value')
      .eq('key', 'generation_status')
      .single()
    
    const userId = (config?.value as any)?.user_id || 'system'

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
      message: `Saved: ${question.substring(0, 40)}... → /question/${slug}`
    }

  } catch (error: any) {
    throw new Error(`Error processing "${question.substring(0, 40)}...": ${error?.message || 'Unknown error'}`)
  }
}

/**
 * Generate biblical questions using Gemini
 */
async function generateBiblicalQuestions(count: number): Promise<string[]> {
  const prompt = `Generate ${count} unique and diverse biblical questions suitable for deep study. 
Focus on theology, history, characters, prophecy, and spiritual concepts. 
Provide ONLY a JSON array of strings, for example: ["Question 1?", "Question 2?"]
No additional text, just the JSON array.`

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    })

    const text = response.text

    if (!text) {
      throw new Error('Empty response from Gemini')
    }

    let questions: string[] = []
    
    try {
      // Try to parse as JSON array
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0])
      } else {
        // Fallback: parse line by line
        questions = text
          .split('\n')
          .map(q => q.trim())
          .filter(q => q.length > 10 && !q.startsWith('{') && !q.startsWith('['))
          .map(q => q.replace(/^[0-9]+\.\s*/, '').replace(/^[\-\*]\s*/, '').replace(/^["']|["']$/g, ''))
          .filter(q => q.length > 0)
      }
    } catch (parseError) {
      console.error('Failed to parse questions:', parseError)
      throw new Error('Failed to parse Gemini response')
    }

    return questions.slice(0, count)
  } catch (error) {
    console.error('Question generation error:', error)
    throw error
  }
}

/**
 * Answer a biblical question using Gemini
 */
async function answerBiblicalQuestion(query: string): Promise<any> {
  const prompt = `You are Bible Questions, a profound and strictly focused biblical scholar assistant. Your purpose is to provide deep historical, linguistic (Greek/Hebrew), and theological context to questions.

CORE IDENTITY:
- Scholarly yet accessible - like a trusted seminary professor
- Rooted in historical-critical and textual analysis
- Committed to showing multiple interpretive traditions
- NO modern politics, psychology, or non-biblical philosophy

YOUR EXPERTISE:
1. Ancient languages (Hebrew, Greek, Aramaic)
2. Historical context (archaeology, culture, geography)
3. Textual criticism and manuscript traditions
4. Theological frameworks across Christian traditions
5. Intertestual connections within Scripture

RESPONSE STRUCTURE (JSON):
{
  "isRelevant": boolean,
  "content": {
    "summary": "2-3 sentence overview",
    "historicalContext": "Cultural/historical background",
    "biblicalReferences": [
      {
        "verse": "Book Chapter:Verse",
        "text": "Actual verse text",
        "translation": "ESV/NIV/etc",
        "context": "Why this passage matters"
      }
    ],
    "linguisticInsight": "Hebrew/Greek word studies, grammar",
    "theologicalPerspectives": [
      {
        "tradition": "Catholic/Orthodox/Reformed/etc",
        "interpretation": "How this tradition understands it"
      }
    ],
    "practicalApplication": "How this applies to faith today",
    "furtherStudy": ["Related topics to explore"]
  }
}

STRICT BOUNDARIES:
✗ Do not answer political questions
✗ Do not provide psychological advice
✗ Do not discuss modern social movements
✗ Do not give financial/legal/medical advice
✗ If question is off-topic, set isRelevant: false

Question: ${query}`

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    })
    
    const text = response.text
    
    if (!text) {
      throw new Error('Empty response from Gemini')
    }
    
    return JSON.parse(text)
  } catch (error) {
    console.error('Answer generation error:', error)
    throw error
  }
}

