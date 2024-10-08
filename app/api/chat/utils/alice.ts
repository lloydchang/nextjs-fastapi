// File: app/api/chat/utils/alice.ts

import logger from './logger';

/**
 * Simulated chat responses for the Alice persona using a broad set of patterns.
 */

const alicePatterns = [
    { pattern: /Hello|Hi|Hey/i, response: "Hello! How can I assist with your project today?" },
    { pattern: /How are you\??/i, response: "Doing great! How’s your project coming along?" },
    { pattern: /What is your name\??/i, response: "I’m Alice, here to support your project planning." },
    { pattern: /Who (.*)/i, response: "Who exactly are you referring to?" },
    { pattern: /Can you help me with (.*)/i, response: "I can assist with $1. Which SDG does it relate to?" },
    { pattern: /What can you do\??/i, response: "I provide project planning, analysis, and impact guidance." },
    { pattern: /Goodbye|Bye/i, response: "Goodbye! Best of luck!" },
    { pattern: /Who are you\??/i, response: "I’m Alice, your project assistant." },
    { pattern: /Why is (.*)/i, response: "Why do you think $1?" },
    { pattern: /Where is (.*)\??/i, response: "Are you looking for $1 specifically?" },
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
 * Generate a concise response for the Alice persona using only the most recent user message.
 * If no pattern matches, a random pattern response is selected.
 * @param conversation - The entire array of conversation messages.
 * @returns A simulated Alice-like response with system context.
 */
export async function generateAliceResponse(conversation: Array<{ role: string, content: string }>): Promise<string> {
    // Get the most recent user message
    const latestUserMessage = conversation.reverse().find((msg) => msg.role === 'user')?.content || "";
    const lowercasedInput = latestUserMessage.toLowerCase().trim();
    logger.silly(`app/api/chat/utils/alice.ts - Processing input for Alice: ${lowercasedInput}`);

    // Shuffle patterns to ensure randomness in matching order
    const shuffledPatterns = shuffleArray(alicePatterns);

    // Try to match a pattern
    for (const rule of shuffledPatterns) {
        const match = lowercasedInput.match(rule.pattern);
        if (match) {
            logger.debug(`app/api/chat/utils/alice.ts - Matched pattern: ${rule.pattern}`);
            let response = rule.response.replace(/\$(\d+)/g, (_, index) => match[parseInt(index, 10)] || '');

            // Sanitize and format the response
            response = response.trim(); // Remove leading/trailing whitespace
            response = response.replace(/\s+/g, ' '); // Replace multiple spaces/newlines with a single space
            logger.debug(`app/api/chat/utils/alice.ts - Generated response: ${response}`);

            return response;
        }
    }

    // If no pattern matched, select a random response from existing patterns
    const randomPattern = shuffledPatterns[Math.floor(Math.random() * shuffledPatterns.length)];
    logger.silly(`app/api/chat/utils/alice.ts - No pattern matched. Using random response: ${randomPattern.response}`);

    // Generate the random response without a pattern match
    const randomResponse = randomPattern.response.replace(/\$\d+/g, "");
    return randomResponse;
}
