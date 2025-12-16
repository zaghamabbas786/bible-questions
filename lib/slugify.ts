/**
 * Generate an SEO-friendly slug from a search query
 * Converts "tell me something about noah prophet" to "noah-prophet"
 * or "what is hell" to "what-is-hell"
 */
export function generateSlug(query: string): string {
  // Remove common question words and noise words
  const noiseWords = [
    'tell', 'me', 'something', 'about', 'can', 'you', 'please', 
    'what', 'is', 'are', 'who', 'where', 'when', 'why', 'how',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'
  ]
  
  let slug = query
    .toLowerCase()
    .trim()
    // Remove punctuation
    .replace(/[^\w\s-]/g, '')
    // Split into words
    .split(/\s+/)
    // Remove noise words only if the resulting slug would still have meaningful content
    .filter(word => {
      // Keep all words if the query is very short
      if (query.split(/\s+/).length <= 3) return true
      // Otherwise filter out noise words
      return !noiseWords.includes(word)
    })
    // Rejoin and replace spaces with hyphens
    .join('-')
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length to 60 characters for SEO
    .substring(0, 60)
    // Remove trailing hyphen if substring cut mid-word
    .replace(/-+$/g, '')

  // If slug is empty after filtering, use a simplified version
  if (!slug) {
    slug = query
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 60)
      .replace(/-+$/g, '')
  }
  
  return slug || 'search'
}

/**
 * Generate a unique slug by appending a random suffix if needed
 */
export function generateUniqueSlug(query: string, existingSlugs: string[] = []): string {
  let slug = generateSlug(query)
  
  // If slug already exists, append a number or short hash
  if (existingSlugs.includes(slug)) {
    const shortId = Math.random().toString(36).substring(2, 6)
    slug = `${slug}-${shortId}`
  }
  
  return slug
}

