import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, Type } from '@google/genai'
import { StudyResponse } from '@/types'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set in environment variables')
      return NextResponse.json(
        { error: 'Gemini API key is not configured. Please add GEMINI_API_KEY to your environment variables.' },
        { status: 500 }
      )
    }

    // Initialize AI client inside the handler (not at module level)
    // This prevents errors if env vars are missing during module load
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    // Check database first - if result exists, return it immediately
    // If database check fails, continue to Gemini API (don't block search)
    try {
      const supabase = await createClient()
      const { data: existingResult, error: dbError } = await supabase
        .from('searches')
        .select('result')
        .eq('query', query)
        .not('result', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // If database query succeeded and result exists, return it
      if (!dbError && existingResult && existingResult.result) {
        return NextResponse.json(existingResult.result as StudyResponse)
      }
      // If database error, log it but continue to Gemini API
      if (dbError) {
        console.error('Database check error (continuing to Gemini):', dbError)
      }
    } catch (dbCheckError) {
      // Database check failed - log and continue to Gemini API
      console.error('Database check exception (continuing to Gemini):', dbCheckError)
    }

    // Result not in database - call Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isRelevant: { type: Type.BOOLEAN },
            refusalMessage: { type: Type.STRING },
            content: {
              type: Type.OBJECT,
              properties: {
                literalAnswer: { type: Type.STRING, description: "A detailed, thorough, educational breakdown of the answer (2-3 paragraphs)." },
                keyTerms: {
                  type: Type.ARRAY,
                  description: "Key people or terms found inside the literalAnswer to be highlighted.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: { type: Type.STRING, description: "The exact word/phrase from literalAnswer." },
                      definition: { type: Type.STRING, description: "A simple hover definition." }
                    },
                    required: ["term", "definition"]
                  }
                },
                searchTopic: { type: Type.STRING, description: "Optimized keyword string for finding external articles." },
                geographicalAnchor: {
                  type: Type.OBJECT,
                  description: "The primary location associated with the topic for mapping purposes.",
                  properties: {
                    location: { type: Type.STRING, description: "Specific city or site. Default to 'Israel' if unknown." },
                    region: { type: Type.STRING, description: "Broader ancient region. Default to 'The Holy Land' if unknown." }
                  },
                  required: ["location", "region"]
                },
                interlinear: {
                  type: Type.OBJECT,
                  description: "Mandatory for verse queries. The word-for-word breakdown.",
                  properties: {
                    reference: { type: Type.STRING },
                    language: { type: Type.STRING, enum: ["Hebrew", "Greek", "Aramaic"] },
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
                        required: ["original", "transliteration", "english", "partOfSpeech"]
                      }
                    }
                  },
                  required: ["reference", "language", "words"]
                },
                scriptureReferences: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      reference: { type: Type.STRING },
                      text: { type: Type.STRING, description: "The full text of the verse from the WEB (World English Bible)." }
                    },
                    required: ["reference", "text"]
                  }
                },
                historicalContext: { type: Type.STRING, description: "Archaeological context, description of the era/times, and cultural background." },
                originalLanguageAnalysis: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      word: { type: Type.STRING },
                      original: { type: Type.STRING },
                      transliteration: { type: Type.STRING },
                      language: { type: Type.STRING, enum: ["Hebrew", "Greek", "Aramaic"] },
                      definition: { type: Type.STRING },
                      usage: { type: Type.STRING }
                    },
                    required: ["word", "original", "transliteration", "language", "definition", "usage"]
                  }
                },
                theologicalInsight: { type: Type.STRING },
                commentarySynthesis: {
                  type: Type.ARRAY,
                  description: "A list of distinct insights from specific commentators.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      source: { type: Type.STRING, description: "Name of the commentator (e.g. Rashi, Henry)." },
                      text: { type: Type.STRING, description: "The specific insight or commentary." },
                      tradition: { type: Type.STRING, enum: ["Jewish", "Christian", "Historical"], description: "The religious tradition of the commentator." }
                    },
                    required: ["source", "text", "tradition"]
                  }
                },
                biblicalBookFrequency: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      book: { type: Type.STRING, description: "Name of the Bible book (e.g. Psalms, Romans)" },
                      count: { type: Type.NUMBER, description: "Estimated number of occurrences or frequency score" }
                    },
                    required: ["book", "count"]
                  }
                }
              },
              required: ["literalAnswer", "searchTopic", "geographicalAnchor", "scriptureReferences", "historicalContext", "originalLanguageAnalysis", "theologicalInsight", "commentarySynthesis", "biblicalBookFrequency"]
            }
          },
          required: ["isRelevant"]
        }
      }
    })

    // Check for errors in the response first (using type assertion for error checking)
    const responseAny = response as any
    if (responseAny.error) {
      console.error('Gemini API error:', responseAny.error)
      throw new Error(`Gemini API error: ${responseAny.error.message || JSON.stringify(responseAny.error)}`)
    }

    // Check for blocked or filtered content
    if (response.candidates && response.candidates[0]?.finishReason) {
      const finishReason = response.candidates[0].finishReason
      if (finishReason === 'SAFETY' || finishReason === 'RECITATION' || finishReason === 'OTHER') {
        console.error('Gemini content blocked. Finish reason:', finishReason)

        // Create error with finishReason attached for catch block to detect
        const error: any = new Error('Content was blocked by Gemini safety filters.')
        error.finishReason = finishReason

        // Provide user-friendly error message
        if (finishReason === 'RECITATION') {
          error.message = 'The search query may have triggered content filters. Please try rephrasing your question or be more specific about what you want to learn.'
        } else if (finishReason === 'SAFETY') {
          error.message = 'The content was filtered for safety reasons. Please try a different question.'
        }

        throw error
      }
    }

    // Check for response text - handle different response structures
    let responseText: string | null = null

    if (response.text) {
      responseText = response.text
    } else if (response.candidates && response.candidates[0]?.content?.parts) {
      // Try alternative response structure
      const parts = response.candidates[0].content.parts
      responseText = parts.find((part: any) => part.text)?.text || null
    } else if (response.candidates && (response.candidates[0] as any)?.text) {
      responseText = (response.candidates[0] as any).text
    }

    if (!responseText) {
      // Log the actual response structure for debugging
      console.error('Gemini response structure:', JSON.stringify(response, null, 2))
      throw new Error("No text response received from Gemini. The API may have returned an error or empty response.")
    }

    try {
      const data = JSON.parse(responseText) as StudyResponse
      return NextResponse.json(data)
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError)
      console.error('Response text:', responseText)
      throw new Error("Invalid JSON response from Gemini. The API may have returned an error.")
    }

  } catch (error: any) {
    console.error("Search API Error:", error)

    // Check if it's a RECITATION or SAFETY block - provide helpful guidance
    const finishReason = error?.finishReason
    if (finishReason === 'RECITATION') {
      return NextResponse.json(
        {
          error: "The search query triggered content filters. This can happen with certain biblical queries. Please try rephrasing your question or being more specific about what you want to learn.",
          finishReason: 'RECITATION',
          suggestion: "Try asking about concepts, themes, or historical context rather than requesting full verse quotations."
        },
        { status: 400 }
      )
    }

    if (finishReason === 'SAFETY') {
      return NextResponse.json(
        {
          error: "The content was filtered for safety reasons. Please try a different question.",
          finishReason: 'SAFETY'
        },
        { status: 400 }
      )
    }

    // Return more specific error message if available
    const errorMessage = error?.message || "Failed to process search"
    const statusCode = error?.status || 500

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

