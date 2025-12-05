
import { GoogleGenAI, Type } from "@google/genai";
import { StudyResponse, ExternalResource, InterlinearData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const fetchStudyNotes = async (query: string): Promise<StudyResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        systemInstruction: `You are Bible Questions, a profound and strictly focused biblical scholar assistant. 
        
        Your purpose is to provide deep historical, linguistic (Greek/Hebrew), and theological context to questions. 
        
        RULES:
        1. IF the user's input is NOT related to the Bible, theology, church history, or spiritual growth, you MUST set 'isRelevant' to false and provide a polite, short refusal message explaining that you only discuss biblical topics.
        2. IF the input IS relevant, provide a rich study analysis.
        3. FIRST, provide a 'literalAnswer'. This corresponds to the 'Breakdown' section. It must be a DETAILED, THOROUGH, and COMPREHENSIVE answer. Do not be concise. Explain the nuances, historical background, and theological implications fully. Aim for 2-3 substantial paragraphs. People use this to learn, so be educational and thorough.
        4. IDENTIFY 'keyTerms' within your 'literalAnswer'. 
           - Select 2-5 important people, theological concepts, or difficult terms that appear in the answer.
           - Provide the exact text segment as it appears in the answer for 'term'.
           - Provide a simple, 1-sentence definition for 'definition'.
        5. Generate a 'searchTopic'. This is a concise 2-5 word string optimized for searching external article databases (e.g. if user asks "What happened at the burning bush", searchTopic should be "Moses Burning Bush Meaning").
        6. MANDATORY INTERLINEAR: IF the user input contains a scripture reference (e.g. 'John 1:1', 'Ps 23', 'Genesis 1:1') OR asks about a specific verse, you MUST include the 'interlinear' object for that passage. 
           - This is NOT optional for verse queries.
           - Break the ENTIRE verse down word-for-word in its original language.
           - 'language' must be "Hebrew" (OT) or "Greek" (NT).
           - If a range is requested (e.g. John 1:1-5), provide the interlinear for the first or most significant verse in that range.
        7. Focus on "Original Meaning" - always dig into the Hebrew (OT) or Greek (NT) keywords in 'originalLanguageAnalysis'.
        8. COMMENTARY SYNTHESIS:
           - Instead of a single summary, you MUST provide a list of 3-5 distinct insights from specific famous commentators.
           - You MUST include at least one Jewish source (e.g., Rashi, Rambam, Ibn Ezra, Midrash) and one Christian source (e.g., Matthew Henry, Calvin, Augustine).
           - For the 'text' field, provide a substantial, paragraph-length explanation of their specific view on this topic. Do not just give a one-liner.
           - Attribute the source clearly in the 'source' field (e.g. "Rashi").
        9. For 'biblicalBookFrequency', analyze the distribution of the searched theme/word across the entire Bible. Return the top 5-8 books where this theme/word appears most frequently, with an estimated occurrence count.
        10. For 'scriptureReferences':
            - You MUST include EVERY single Bible verse reference mentioned in your 'literalAnswer'.
            - Also include other relevant verses.
            - ALWAYS include the full text of the verse from the World English Bible (WEB) (public domain).
        11. CRITICAL: You must identify a 'geographicalAnchor' for the query. 
            - Even for abstract concepts, ground them in a location (e.g. "Grace" -> "Rome" (Epistles) or "Jerusalem" (Cross)). 
            - Provide the 'location' (specific city/spot) and 'region' (broader area, e.g. Judea, Asia Minor).
            - IF the location is unknown, abstract, or would result in a "World" map, YOU MUST DEFAULT to 'location': "Israel" and 'region': "The Holy Land". 
            - NEVER return "World", "Earth", or "Globe".
        12. For 'historicalContext', you MUST provide a dedicated archaeological and cultural analysis. 
            - Mention relevant archaeological discoveries that shed light on the topic.
            - Describe the "Times": what was daily life, politics, or the environment like in that specific era?
            - Describe the "People": customs, clothing, or social structures.

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
    });

    if (!response.text) {
      throw new Error("No response received from Gemini.");
    }

    const data = JSON.parse(response.text) as StudyResponse;
    return data;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const fetchInterlinear = async (reference: string): Promise<InterlinearData> => {
  try {
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
    });

    if (!response.text) {
      throw new Error("No response for interlinear request.");
    }

    return JSON.parse(response.text) as InterlinearData;
  } catch (error) {
    console.error("Interlinear Fetch Error:", error);
    throw error;
  }
};

export const fetchExternalResources = async (topic: string): Promise<ExternalResource[]> => {
  try {
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
    });

    const resources: ExternalResource[] = [];
    
    // Extract chunks from grounding metadata
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach(chunk => {
        if (chunk.web) {
          resources.push({
            title: chunk.web.title || "Study Resource",
            uri: chunk.web.uri || "#",
            siteTitle: new URL(chunk.web.uri || "http://unknown.com").hostname.replace('www.', '')
          });
        }
      });
    }

    // Filter for relevant domains to ensure quality (double check)
    const relevantDomains = ['chabad', 'ffoz', 'sefaria'];
    const filtered = resources.filter(r => relevantDomains.some(d => r.siteTitle.includes(d)));
    
    // Return unique links
    const unique = Array.from(new Map(filtered.map(item => [item.uri, item])).values());
    return unique.slice(0, 6); // Limit to 6 results

  } catch (error) {
    console.warn("External resource search failed:", error);
    return [];
  }
};

export const fetchAncientMap = async (location: string, region: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `A historically accurate, high-resolution geographical map of the Middle East focusing on the region of ${region} during the biblical era. The map displays realistic terrain, mountains, and rivers with high cartographic detail. A clear, single red pin indicates the location of ${location}. Professional educational style, high resolution, neutral colors.`,
      config: {
        numberOfImages: 1,
        aspectRatio: '21:9',
      },
    });

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64ImageBytes) {
      return `data:image/png;base64,${base64ImageBytes}`;
    }
    return null;
  } catch (error) {
    console.warn("Map generation failed:", error);
    return null;
  }
};