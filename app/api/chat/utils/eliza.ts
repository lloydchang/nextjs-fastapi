// File: app/api/chat/utils/eliza.ts

import logger from './logger';

/**
 * Simulated chat responses for the Eliza persona using concise reflective patterns.
 */

const elizaPatterns = [
    { pattern: /I need (.*)/i, response: "Why do you need $1?" },
    { pattern: /I want (.*)/i, response: "What would $1 change?" },
    { pattern: /Why can'?t I ([^\?]*)\??/i, response: "What’s stopping you?" },
    { pattern: /Why don'?t you ([^\?]*)\??/i, response: "Should I $1?" },
    { pattern: /Because (.*)/i, response: "Is that the only reason?" },
    { pattern: /I feel (.*)/i, response: "What makes you feel $1?" },
    { pattern: /Can you ([^\?]*)\??/i, response: "Why would I $1?" },
    { pattern: /Can I ([^\?]*)\??/i, response: "Why wouldn’t you?" },
    { pattern: /You are (.*)/i, response: "Why $1?" },
    { pattern: /Are you ([^\?]*)\??/i, response: "Why ask?" },
    { pattern: /What is (.*)/i, response: "Why $1?" },
    { pattern: /Who (.*)/i, response: "Who?" },
    { pattern: /How do I (.*)/i, response: "What’s your plan?" },
    { pattern: /How should I (.*)/i, response: "Does it fit?" },
    { pattern: /I think (.*)/i, response: "Why $1?" },
    { pattern: /Do you know (.*)\??/i, response: "Why $1?" },
    { pattern: /Are you sure (.*)\??/i, response: "Why does it matter?" },
    { pattern: /Should I (.*)\??/i, response: "What’s holding you back?" },
    { pattern: /What if (.*)\??/i, response: "What then?" },
    { pattern: /Why is (.*)\??/i, response: "Why $1?" },
];

/**
 * Shuffle an array using Fisher-Yates shuffle algorithm.
 * @param array - The array to be shuffled.
 * @returns The shuffled array.
 */
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Generate a response for the Eliza persona using only the most recent user message.
 * If no pattern matches, a random pattern response is selected.
 * @param conversation - The entire array of conversation messages.
 * @returns A concise Eliza-like response.
 */
export async function generateElizaResponse(conversation: Array<{ role: string, content: string }>): Promise<string> {
    // Get the most recent user message
    const latestUserMessage = conversation.reverse().find((msg) => msg.role === 'user')?.content || "";
    const lowercasedInput = latestUserMessage.toLowerCase().trim();
    logger.silly(`app/api/chat/utils/eliza.ts - Processing input for Eliza: ${lowercasedInput}`);

    // Shuffle patterns to ensure randomness in matching order
    const shuffledPatterns = shuffleArray(elizaPatterns);

    // Try to match a pattern
    for (const rule of shuffledPatterns) {
        const match = lowercasedInput.match(rule.pattern);
        if (match) {
            logger.debug(`app/api/chat/utils/eliza.ts - Matched pattern: ${rule.pattern}`);
            let response = rule.response.replace(/\$(\d+)/g, (_, index) => match[parseInt(index, 10)] || '');

            // Sanitize and format the response
            response = response.trim(); // Remove leading/trailing whitespace
            response = response.replace(/\s+/g, ' '); // Replace multiple spaces/newlines with a single space
            logger.debug(`app/api/chat/utils/eliza.ts - Generated response: ${response}`);

            return response;
        }
    }

    // If no pattern matched, select a random response from existing patterns
    const randomPattern = shuffledPatterns[Math.floor(Math.random() * shuffledPatterns.length)];
    logger.silly(`app/api/chat/utils/eliza.ts - No pattern matched. Using random response: ${randomPattern.response}`);

    // Generate the random response without a pattern match
    const randomResponse = randomPattern.response.replace(/\$\d+/g, "");
    return randomResponse;
}
