import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { generateUniqueSlug } from '@/lib/slugify'
import { GoogleGenAI, Type } from '@google/genai'

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
 * Answer a biblical question using Gemini - SAME as /api/search
 */
async function answerBiblicalQuestion(query: string): Promise<any> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: query,
      config: {
        systemInstruction: `You are Bible Questions, a profound biblical scholar and theological philosopher. 

Your purpose is to provide deep historical, linguistic (Greek/Hebrew), and theological context to questions. You view all inquiries through the lens of Scripture.

IMPORTANT: When quoting Bible verses, use the World English Bible (WEB) translation which is in the public domain. Provide verse references and text naturally as part of your scholarly analysis.

RULES:

1. RELEVANCE & SCOPE: 
   - You accept questions regarding the Bible, theology, church history, and spiritual growth.
   - You ALSO accept broad philosophical, ethical, and existential questions (e.g., "What is the meaning of life?", "Why is there suffering?", "What is truth?"). 
   - IF the input is completely unrelated to these topics (e.g., coding, sports scores, recipes), set 'isRelevant' to false and politely explain that you only examine life through Biblical and theological lenses.

2. THEOLOGICAL BRIDGING:
   - IF the user asks a philosophical or abstract question without a specific verse, you must identified the primary Biblical Themes that address this concept.
   - Answer the question by synthesizing the Biblical worldview, citing relevant events or teachings to support the answer.

3. STRUCTURED RESPONSE ('literalAnswer'): 
   - This corresponds to the 'Breakdown' section. 
   - It must be a DETAILED, THOROUGH, and COMPREHENSIVE answer (2-3 substantial paragraphs). 
   - If the question is philosophical, define the concept, then contrast secular views with the Biblical perspective.
   - Explain nuances, historical background, and theological implications fully.

4. IDENTIFY 'keyTerms' within your 'literalAnswer'. 
   - Select 2-5 important people, theological concepts, or difficult terms that appear in the answer.
   - Provide the exact text segment as it appears in the answer for 'term'.
   - Provide a simple, 1-sentence definition for 'definition'.

5. Generate a 'searchTopic'. This is a concise 2-5 word string optimized for searching external article databases.

6. MANDATORY INTERLINEAR: 
   - IF the user input contains a scripture reference (e.g. 'John 1:1') OR asks about a specific verse, you MUST include the 'interlinear' object.
   - IF the user asks a general philosophical question WITHOUT a specific verse, you may OMIT the 'interlinear' object or set it to null.
   - When active: Break the ENTIRE verse down word-for-word in its original language (Hebrew for OT, Greek for NT).

7. Focus on "Original Meaning" - always dig into the Hebrew (OT) or Greek (NT) keywords in 'originalLanguageAnalysis', even for philosophical concepts (e.g., analyzing "Aletheia" if asked about Truth).

8. COMMENTARY SYNTHESIS:
   - Provide a list of 3-5 distinct insights from specific famous commentators regarding the theme or verses identified.
   - You MUST include at least one Jewish source (e.g., Rashi, Rambam, Midrash) and one Christian source (e.g., Matthew Henry, Calvin, Augustine).
   - Attribute the source clearly.

9. For 'biblicalBookFrequency', analyze the distribution of the relevant theme/word across the entire Bible. Return the top 5-8 books where this theme appears most frequently.

10. For 'scriptureReferences':
    - You MUST include EVERY single Bible verse reference mentioned in your 'literalAnswer'.
    - Also include other relevant verses that answer the philosophical query.
    - Include the full text of the verse from the World English Bible (WEB).

11. CRITICAL: You must identify a 'geographicalAnchor' for the query. 
    - Even for abstract concepts, ground them in a location (e.g. "Grace" -> "Rome" (Epistles) or "Jerusalem" (Cross)). 
    - IF the location is unknown or abstract, YOU MUST DEFAULT to 'location': "Israel" and 'region': "The Holy Land". 

12. For 'historicalContext', you MUST provide a dedicated archaeological and cultural analysis of the era most relevant to the answer.

        Keep the tone scholarly, reverent, and minimalist. Avoid emojis.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isRelevant: { type: Type.BOOLEAN },
            refusalMessage: { type: Type.STRING },
            content: {
              type: Type.OBJECT,
              properties: {
                literalAnswer: { type: Type.STRING, description: 'A detailed, thorough, educational breakdown of the answer (2-3 paragraphs).' },
                keyTerms: {
                  type: Type.ARRAY,
                  description: 'Key people or terms found inside the literalAnswer to be highlighted.',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: { type: Type.STRING, description: 'The exact word/phrase from literalAnswer.' },
                      definition: { type: Type.STRING, description: 'A simple hover definition.' }
                    },
                    required: ['term', 'definition']
                  }
                },
                searchTopic: { type: Type.STRING, description: 'Optimized keyword string for finding external articles.' },
                geographicalAnchor: {
                  type: Type.OBJECT,
                  description: 'The primary location associated with the topic for mapping purposes.',
                  properties: {
                    location: { type: Type.STRING, description: 'Specific city or site. Default to Israel if unknown.' },
                    region: { type: Type.STRING, description: 'Broader ancient region. Default to The Holy Land if unknown.' }
                  },
                  required: ['location', 'region']
                },
                interlinear: {
                  type: Type.OBJECT,
                  description: 'Mandatory for verse queries. The word-for-word breakdown.',
                  properties: {
                    reference: { type: Type.STRING },
                    language: { type: Type.STRING },
                    words: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          original: { type: Type.STRING },
                          transliteration: { type: Type.STRING },
                          english: { type: Type.STRING },
                          partOfSpeech: { type: Type.STRING }
                        },
                        required: ['original', 'transliteration', 'english', 'partOfSpeech']
                      }
                    }
                  },
                  required: ['reference', 'language', 'words']
                },
                scriptureReferences: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      reference: { type: Type.STRING },
                      text: { type: Type.STRING, description: 'The full text of the verse from the WEB (World English Bible).' }
                    },
                    required: ['reference', 'text']
                  }
                },
                historicalContext: { type: Type.STRING, description: 'Archaeological context, description of the era/times, and cultural background.' },
                originalLanguageAnalysis: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      word: { type: Type.STRING },
                      original: { type: Type.STRING },
                      transliteration: { type: Type.STRING },
                      language: { type: Type.STRING },
                      definition: { type: Type.STRING },
                      usage: { type: Type.STRING }
                    },
                    required: ['word', 'original', 'transliteration', 'language', 'definition', 'usage']
                  }
                },
                theologicalInsight: { type: Type.STRING },
                commentarySynthesis: {
                  type: Type.ARRAY,
                  description: 'A list of distinct insights from specific commentators.',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      source: { type: Type.STRING, description: 'Name of the commentator (e.g. Rashi, Henry).' },
                      text: { type: Type.STRING, description: 'The specific insight or commentary.' },
                      tradition: { type: Type.STRING, description: 'The religious tradition of the commentator.' }
                    },
                    required: ['source', 'text', 'tradition']
                  }
                },
                biblicalBookFrequency: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      book: { type: Type.STRING, description: 'Name of the Bible book (e.g. Psalms, Romans)' },
                      count: { type: Type.NUMBER, description: 'Estimated number of occurrences or frequency score' }
                    },
                    required: ['book', 'count']
                  }
                }
              },
              required: ['literalAnswer', 'searchTopic', 'geographicalAnchor', 'scriptureReferences', 'historicalContext', 'originalLanguageAnalysis', 'theologicalInsight', 'commentarySynthesis', 'biblicalBookFrequency']
            }
          },
          required: ['isRelevant']
        }
      }
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

