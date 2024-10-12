// File: app/api/chat/utils/maskUtils.ts

import logger from 'app/api/chat/utils/logger';

/**
 * Masks sensitive headers such as Authorization or API keys.
 * @param headers - The original headers object.
 * @returns {Record<string, string>} - The masked headers object.
 */
export function maskHeaders(headers: Record<string, string>): Record<string, string> {
  logger.silly(`app/api/chat/utils/maskUtils.ts - Original headers: ${JSON.stringify(headers)}`);

  const maskedHeaders = { ...headers }; // Copy the headers

  // Mask Authorization header if present
  if (maskedHeaders['Authorization']) {
    maskedHeaders['Authorization'] = maskString(maskedHeaders['Authorization'], 4); // Mask most of the token
    logger.silly(`app/api/chat/utils/maskUtils.ts - Masked Authorization header`);
  }

  // Add logic to mask other sensitive headers as needed
  // For example: API keys, session tokens, etc.
  if (maskedHeaders['X-API-Key']) {
    maskedHeaders['X-API-Key'] = maskString(maskedHeaders['X-API-Key'], 4);
    logger.silly(`app/api/chat/utils/maskUtils.ts - Masked X-API-Key header`);
  }

  logger.silly(`app/api/chat/utils/maskUtils.ts - Masked headers: ${JSON.stringify(maskedHeaders)}`);
  return maskedHeaders;
}

/**
 * Masks the Account ID in the API endpoint URL.
 * @param url - The original endpoint URL.
 * @returns {string} - The masked endpoint URL.
 */
export function maskAccountIdInUrl(url: string): string {
  logger.silly(`app/api/chat/utils/maskUtils.ts - Original URL: ${url}`);

  // Extract the Account ID or sensitive segment using regex
  const accountIdMatch = url.match(/(accounts|users)\/([^/]+)\//);
  if (accountIdMatch && accountIdMatch[2]) {
    const sensitiveId = accountIdMatch[2];
    const maskedId = maskString(sensitiveId, 4);
    const maskedUrl = url.replace(sensitiveId, maskedId);
    logger.silly(`app/api/chat/utils/maskUtils.ts - Masked URL: ${maskedUrl}`);
    return maskedUrl;
  }

  logger.silly(`app/api/chat/utils/maskUtils.ts - No sensitive segment found in URL, returning original.`);
  return url; // Return original URL if no sensitive segment is found
}

/**
 * Masks a given string by revealing only the first `visibleChars` characters and replacing the rest with asterisks.
 * @param str - The original string to mask.
 * @param visibleChars - Number of characters to keep visible from the start.
 * @returns {string} - The masked string.
 */
export function maskString(str: string, visibleChars: number): string {
  logger.silly(`app/api/chat/utils/maskUtils.ts - Original string to mask: ${str}`);
  
  let maskedStr;
  if (str.length <= visibleChars) {
    maskedStr = '*'.repeat(str.length);
  } else {
    maskedStr = `${str.substring(0, visibleChars)}***`;
  }

  logger.silly(`app/api/chat/utils/maskUtils.ts - Masked string: ${maskedStr}`);
  return maskedStr;
}
