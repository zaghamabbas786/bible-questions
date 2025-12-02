import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const { location, region } = await request.json()

    if (!location || !region) {
      return NextResponse.json(
        { error: 'Location and region are required' },
        { status: 400 }
      )
    }

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `A historically accurate, high-resolution geographical map of the Middle East focusing on the region of ${region} during the biblical era. The map displays realistic terrain, mountains, and rivers with high cartographic detail. A clear, single red pin indicates the location of ${location}. Professional educational style, high resolution, neutral colors.`,
      config: {
        numberOfImages: 1,
        aspectRatio: '21:9',
      },
    })

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes
    if (base64ImageBytes) {
      return NextResponse.json({ 
        imageUrl: `data:image/png;base64,${base64ImageBytes}` 
      })
    }
    
    return NextResponse.json({ imageUrl: null })

  } catch (error) {
    console.error("Map API Error:", error)
    return NextResponse.json(
      { error: "Failed to generate map" },
      { status: 500 }
    )
  }
}

