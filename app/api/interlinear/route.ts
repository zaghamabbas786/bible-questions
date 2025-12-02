import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, Type } from '@google/genai'
import { InterlinearData } from '@/types'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json()

    if (!reference || typeof reference !== 'string') {
      return NextResponse.json(
        { error: 'Reference is required' },
        { status: 400 }
      )
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Provide a strict, scholarly word-for-word interlinear analysis for the bible verse: ${reference}.
      
      Rules:
      - Language must be Hebrew (OT) or Greek (NT).
      - Break down every single word in the verse.
      - Provide accurate transliteration and English definition.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
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
        }
      }
    })

    if (!response.text) {
      throw new Error("No response for interlinear request.")
    }

    const data = JSON.parse(response.text) as InterlinearData
    return NextResponse.json(data)

  } catch (error) {
    console.error("Interlinear API Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch interlinear" },
      { status: 500 }
    )
  }
}

