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
        aspectRatio: '16:9',
      },
    })

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes
    if (base64ImageBytes) {
      return NextResponse.json({ 
        imageUrl: `data:image/png;base64,${base64ImageBytes}` 
      })
    }
    
    return NextResponse.json({ imageUrl: null })

  } catch (error: any) {
    console.error("Map API Error:", error)
    
    // Try to extract error details from ApiError structure
    // ApiError can have: error.error.message or error.message or error.toString()
    let errorMessage = 'Failed to generate map'
    let errorCode = 500
    
    // Check various error structures
    if (error?.error?.message) {
      errorMessage = error.error.message
      errorCode = error.error.code || error.status || 500
    } else if (error?.message) {
      errorMessage = error.message
      errorCode = error.status || error.code || 500
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    // Check if it's the billing error
    if (errorMessage.toLowerCase().includes('billed users') || 
        errorMessage.toLowerCase().includes('billing required')) {
      return NextResponse.json(
        { 
          error: "Map generation requires a billed Google Cloud account. The Imagen API is not available on free tier accounts.",
          requiresBilling: true
        },
        { status: 402 } // 402 Payment Required
      )
    }
    
    // Return the specific error with appropriate status code
    return NextResponse.json(
      { error: errorMessage },
      { status: errorCode }
    )
  }
}

