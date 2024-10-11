// File: app/api/chat/utils/eliza.ts

import logger from './logger';

/**
 * Simulated chat responses for the Eliza persona using mixed reflective patterns and humor inspired by Abbott and Costello.
 */

const elizaPatterns = [
    // "Who" Questions
    { pattern: /Who (.*)\??/i, response: "Who exactly is $1?", type: 'eliza' },
    { pattern: /Who should (.*)\??/i, response: "Who should be responsible for $1?", type: 'eliza' },
    { pattern: /Who would (.*)\??/i, response: "Who would benefit from $1?", type: 'eliza' },
    { pattern: /Who can (.*)\??/i, response: "Who can help with $1?", type: 'eliza' },
    { pattern: /Who is (.*)\??/i, response: "Who is $1 to you?", type: 'eliza' },
    { pattern: /Who cares\??/i, response: "Why do you think no one cares?", type: 'eliza' },
    { pattern: /Do you know who (.*)\??/i, response: "Who? $1? No, no, I know $2!", type: 'humor' },

    // "What" Questions
    { pattern: /What is (.*)/i, response: "What is $1?", type: 'eliza' },
    { pattern: /What should I (.*)\??/i, response: "What do you want to do?", type: 'eliza' },
    { pattern: /What would happen if (.*)\??/i, response: "What then?", type: 'eliza' },
    { pattern: /What if (.*)\??/i, response: "What would $1 lead to?", type: 'eliza' },
    { pattern: /What do you think\??/i, response: "What do I think? What do $2 think?", type: 'humor' },
    { pattern: /What’s the point of (.*)\??/i, response: "What does $1 mean to you?", type: 'eliza' },
    { pattern: /What do I do with (.*)\??/i, response: "What do you *want* to do with $1?", type: 'eliza' },
    { pattern: /What do you want (.*)\??/i, response: "What do *you* want, really?", type: 'eliza' },

    // "When" Questions
    { pattern: /When did (.*)\??/i, response: "When did $1 happen?", type: 'eliza' },
    { pattern: /When will (.*)\??/i, response: "When will $1 happen?", type: 'eliza' },
    { pattern: /When do (.*)\??/i, response: "When do you think $1?", type: 'eliza' },
    { pattern: /When should (.*)\??/i, response: "When should $1 occur?", type: 'eliza' },
    { pattern: /What time (.*)\??/i, response: "What time does $1 usually happen?", type: 'eliza' },
    { pattern: /When is (.*)\??/i, response: "When exactly is $1?", type: 'eliza' },
    { pattern: /When can (.*)\??/i, response: "When can you commit to $1?", type: 'eliza' },
    { pattern: /When in doubt (.*)\??/i, response: "What do you do when in doubt?", type: 'eliza' },

    // "Where" Questions
    { pattern: /Where is (.*)\??/i, response: "Where exactly is $1?", type: 'eliza' },
    { pattern: /Where can I (.*)\??/i, response: "Where would $1 happen?", type: 'eliza' },
    { pattern: /Where would (.*)\??/i, response: "Where would $1 make sense?", type: 'eliza' },
    { pattern: /Where do (.*)\??/i, response: "Where does $1 usually happen?", type: 'eliza' },
    { pattern: /Where could (.*)\??/i, response: "Where could $1 lead?", type: 'eliza' },
    { pattern: /Where should (.*)\??/i, response: "Where should $1 occur?", type: 'eliza' },
    { pattern: /Where did (.*)\??/i, response: "Where did $1 go?", type: 'eliza' },

    // "Why" Questions
    { pattern: /Why is (.*)\??/i, response: "Why is $1 important?", type: 'eliza' },
    { pattern: /Why does (.*)\??/i, response: "Why does $1 matter?", type: 'eliza' },
    { pattern: /Why do I (.*)\??/i, response: "Why do you feel $1?", type: 'eliza' },
    { pattern: /Why should (.*)\??/i, response: "Why should $1 happen?", type: 'eliza' },
    { pattern: /Why not (.*)\??/i, response: "Why not $1?", type: 'eliza' },
    { pattern: /Why can’t I (.*)\??/i, response: "Why can’t you $1?", type: 'eliza' },
    { pattern: /Why bother\??/i, response: "Why does $1 seem pointless to you?", type: 'eliza' },
    { pattern: /Why did (.*)\??/i, response: "Why did $1 occur?", type: 'eliza' },

    // "How" Questions
    { pattern: /How do I (.*)\??/i, response: "What’s your plan?", type: 'eliza' },
    { pattern: /How should I (.*)\??/i, response: "Does it fit?", type: 'eliza' },
    { pattern: /How can I (.*)\??/i, response: "How can you achieve $1?", type: 'eliza' },
    { pattern: /How is (.*)\??/i, response: "How is $1 affecting you?", type: 'eliza' },
    { pattern: /How much (.*)\??/i, response: "How much of $1 is enough?", type: 'eliza' },
    { pattern: /How does (.*)\??/i, response: "How does $1 impact you?", type: 'eliza' },
    { pattern: /How do you know (.*)\??/i, response: "How do you know $1?", type: 'eliza' },
    { pattern: /How often (.*)\??/i, response: "How often does $1 happen?", type: 'eliza' },
];

/**
 * Randomly returns either "this" or "that".
 * @returns A random placeholder, either "this" or "that".
 */
function getRandomPlaceholder(): string {
    return Math.random() < 0.5 ? "this" : "that";
}

/**
 * Generate a response for the Eliza persona using both Eliza and humorous patterns.
 * If no pattern matches, a random pattern response is selected.
 * @param conversation - The entire array of conversation messages.
 * @returns A concise Eliza-like or humorous response.
 */
export async function generateElizaResponse(conversation: Array<{ role: string, content: string }>): Promise<string> {
    // Get the most recent user message
    const latestUserMessage = conversation.reverse().find((msg) => msg.role === 'user')?.content || "";
    const lowercasedInput = latestUserMessage.toLowerCase().trim();
    logger.silly(`app/api/chat/utils/eliza.ts - Processing input for Eliza: ${lowercasedInput}`);

    // Shuffle patterns to ensure randomness in matching order
    const shuffledPatterns = shuffleArray(elizaPatterns);

    // Try to match a pattern, alternating between Eliza and humor responses
    for (const rule of shuffledPatterns) {
        const match = lowercasedInput.match(rule.pattern);
        if (match) {
            logger.silly(`app/api/chat/utils/eliza.ts - Matched pattern: ${rule.pattern}`);
            let response = rule.response.replace(/\$(\d+)/g, (_, index) => match[parseInt(index, 10)] || getRandomPlaceholder());
            response = response.trim(); // Remove leading/trailing whitespace
            response = response.replace(/\s+/g, ' '); // Replace multiple spaces/newlines with a single space
            logger.silly(`app/api/chat/utils/eliza.ts - Generated response: ${response}`);

            return response;
        }
    }

    // If no pattern matched, select a random response from existing patterns
    const randomPattern = shuffledPatterns[Math.floor(Math.random() * shuffledPatterns.length)];
    logger.silly(`app/api/chat/utils/eliza.ts - No pattern matched. Using random response: ${randomPattern.response}`);

    // Generate the random response without a pattern match, using `getRandomPlaceholder()` for placeholders
    const randomResponse = randomPattern.response.replace(/\$\d+/g, getRandomPlaceholder());
    return randomResponse;
}

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
