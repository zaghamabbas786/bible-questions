// Google Analytics utility functions
// These functions safely handle cases where GA might not be loaded

declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void
  }
}

/**
 * Track a page view
 * @param url - The URL of the page
 * @param title - Optional page title
 */
export function trackPageView(url: string, title?: string) {
  if (typeof window === 'undefined' || !window.gtag) {
    return
  }

  window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || '', {
    page_path: url,
    page_title: title,
  })
}

/**
 * Track a custom event
 * @param eventName - Name of the event
 * @param eventParams - Additional event parameters
 */
export function trackEvent(
  eventName: string,
  eventParams?: {
    event_category?: string
    event_label?: string
    value?: number
    [key: string]: any
  }
) {
  if (typeof window === 'undefined' || !window.gtag) {
    return
  }

  window.gtag('event', eventName, eventParams)
}

/**
 * Track a search query
 * @param query - The search query
 */
export function trackSearch(query: string) {
  trackEvent('search', {
    event_category: 'engagement',
    event_label: query,
    search_term: query,
  })
}

/**
 * Track when a user views a search result
 * @param query - The search query
 */
export function trackSearchResultView(query: string) {
  trackEvent('view_search_result', {
    event_category: 'engagement',
    event_label: query,
    search_term: query,
  })
}

/**
 * Track when a user clicks on a similar topic
 * @param topic - The similar topic query
 */
export function trackSimilarTopicClick(topic: string) {
  trackEvent('click_similar_topic', {
    event_category: 'navigation',
    event_label: topic,
  })
}

