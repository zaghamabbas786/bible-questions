import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })

/**
 * Generate Biblical Questions using Gemini
 * Returns a list of unique biblical questions
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { count = 10 } = await request.json()

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
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      )
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
      // Fallback parsing
      questions = text
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 10)
        .slice(0, count)
    }

    return NextResponse.json({ 
      success: true, 
      questions: questions.slice(0, count),
      count: questions.length 
    })

  } catch (error: any) {
    console.error('Question generation error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to generate questions' },
      { status: 500 }
    )
  }
}

