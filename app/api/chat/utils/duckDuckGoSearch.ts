// File: app/api/chat/utils/duckDuckGoSearch.ts

import logger from 'app/api/chat/utils/logger'; // Adjust the import path if necessary

interface DuckDuckGoRelatedTopic {
  Text: string;
  FirstURL: string;
  Icon: {
    URL: string;
  };
}

interface DuckDuckGoSearchResponse {
  RelatedTopics: DuckDuckGoRelatedTopic[];
}

/**
 * Performs a DuckDuckGo search and returns the top search results.
 * @param query - The search query to use.
 * @returns {Promise<string[]>} - A promise that resolves to an array of search result titles.
 */
export async function performInternetSearch(query: string): Promise<string[]> {
  try {
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
    
    logger.silly(`Performing DuckDuckGo search for: ${query}`);
    logger.silly(`Search URL: ${searchUrl}`);

    const response = await fetch(searchUrl);
    
    // Log HTTP response details
    logger.silly(`DuckDuckGo response status: ${response.status}`);

    // Log each header
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    logger.silly(`DuckDuckGo response headers: ${JSON.stringify(headers)}`);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Explicitly type the response as DuckDuckGoSearchResponse
    const searchData = await response.json() as DuckDuckGoSearchResponse;
    logger.silly(`DuckDuckGo response body: ${JSON.stringify(searchData)}`);

    if (searchData.RelatedTopics.length === 0) {
      logger.warn(`No related topics found for query: ${query}`);
      return [];
    }

    const results = searchData.RelatedTopics.map((result) => result.Text);
    logger.silly(`Search results: ${results.join(', ')}`);

    return results;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error performing internet search: ${error.message}`);
    } else {
      logger.error(`Unknown error occurred during internet search: ${String(error)}`);
    }
    return [];
  }
}
