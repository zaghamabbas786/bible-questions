import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { ExternalResource } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json()

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
      )
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find relevant study articles and commentary for: "${topic}". 
      
      STRICT SEARCH RULES:
      - You must ONLY search within these specific domains: chabad.org, ffoz.org (First Fruits of Zion), and sefaria.org.
      - Look for deep study articles, Torah portions, or messianic insights.
      - Return a list of the best links found.`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    })

    const resources: ExternalResource[] = []
    
    // Extract chunks from grounding metadata
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    
    if (chunks) {
      chunks.forEach(chunk => {
        if (chunk.web) {
          resources.push({
            title: chunk.web.title || "Study Resource",
            uri: chunk.web.uri || "#",
            siteTitle: new URL(chunk.web.uri || "http://unknown.com").hostname.replace('www.', '')
          })
        }
      })
    }

    // Filter for relevant domains to ensure quality (double check)
    const relevantDomains = ['chabad', 'ffoz', 'sefaria']
    const filtered = resources.filter(r => relevantDomains.some(d => r.siteTitle.includes(d)))
    
    // Return unique links
    const unique = Array.from(new Map(filtered.map(item => [item.uri, item])).values())
    return NextResponse.json(unique.slice(0, 6)) // Limit to 6 results

  } catch (error) {
    console.error("Resources API Error:", error)
    return NextResponse.json([])
  }
}

