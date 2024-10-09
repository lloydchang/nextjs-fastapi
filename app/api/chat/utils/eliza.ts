// File: app/api/chat/utils/eliza.ts

import logger from './logger';

/**
 * Simulated chat responses for the Eliza persona using concise reflective patterns.
 */

const elizaPatterns = [
    { pattern: /I need (.*)/i, response: "Why do you need $1?" },
    { pattern: /I want (.*)/i, response: "What would $1 change?" },
    { pattern: /Why can'?t I ([^\?]*)\??/i, response: "What’s stopping you?" },
    { pattern: /Why don'?t you ([^\?]*)\??/i, response: "Should I do $1?" },
    { pattern: /Because (.*)/i, response: "Is that the only reason?" },
    { pattern: /I feel (.*)/i, response: "What makes you feel $1?" },
    { pattern: /Can you ([^\?]*)\??/i, response: "Why would I try $1?" },
    { pattern: /Can I ([^\?]*)\??/i, response: "Why wouldn’t you?" },
    { pattern: /You are (.*)/i, response: "Who is $1?" },
    { pattern: /Are you ([^\?]*)\??/i, response: "Why ask?" },
    { pattern: /What is (.*)/i, response: "What is $1?" },
    { pattern: /Who (.*)/i, response: "Who?" },
    { pattern: /How do I (.*)/i, response: "What’s your plan?" },
    { pattern: /How should I (.*)/i, response: "Does it fit?" },
    { pattern: /I think (.*)/i, response: "When is $1?" },
    { pattern: /Do you know (.*)\??/i, response: "Where is $1?" },
    { pattern: /Are you sure (.*)\??/i, response: "Why does it matter?" },
    { pattern: /Should I (.*)\??/i, response: "What’s holding you back?" },
    { pattern: /What if (.*)\??/i, response: "What then?" },
    { pattern: /Why is (.*)\??/i, response: "How is $1?" },
    { pattern: /I am (.*)/i, response: "How long have you been feeling $1?" },
    { pattern: /I can't (.*)/i, response: "What would it take for you to approach $1?" },
    { pattern: /I don't (.*)/i, response: "What makes you resist $1?" },
    { pattern: /I always (.*)/i, response: "Why always $1?" },
    { pattern: /I never (.*)/i, response: "What would happen if you did?" },
    { pattern: /Do you (.*)\??/i, response: "Do I try $1? What do you think?" },
    { pattern: /I feel like (.*)/i, response: "Why do you feel like $1?" },
    { pattern: /Is it possible (.*)\??/i, response: "What makes you question it?" },
    { pattern: /Could I (.*)\??/i, response: "What would $1 achieve for you?" },
    { pattern: /Why do I (.*)\??/i, response: "What do you think?" },
    { pattern: /What should I (.*)\??/i, response: "What do you want to do?" },
    { pattern: /My (.*)/i, response: "Tell me more about $1." },
    { pattern: /Am I (.*)/i, response: "Do you believe you are $1?" },
    { pattern: /It seems like (.*)/i, response: "Why does it seem that $1?" },
    { pattern: /Everyone (.*)/i, response: "Are you sure everyone loves $1?" },
    { pattern: /No one (.*)/i, response: "How does that make you feel?" },
    { pattern: /People (.*)/i, response: "Who specifically?" },
    { pattern: /What do you think\??/i, response: "Why do you ask what I think?" },
    { pattern: /Why can’t you (.*)\??/i, response: "What’s preventing you from $1?" },
    { pattern: /Do you believe (.*)\??/i, response: "What does it mean if I believe $1?" },
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
 * Randomly returns either "this" or "that".
 * @returns A random placeholder, either "this" or "that".
 */
function getRandomPlaceholder(): string {
    return Math.random() < 0.5 ? "this" : "that";
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
            let response = rule.response.replace(/\$(\d+)/g, (_, index) => match[parseInt(index, 10)] || getRandomPlaceholder());
            response = response.trim(); // Remove leading/trailing whitespace
            response = response.replace(/\s+/g, ' '); // Replace multiple spaces/newlines with a single space
            logger.debug(`app/api/chat/utils/eliza.ts - Generated response: ${response}`);

            return response;
        }
    }

    // The following lines are commented out for now:
    /*
    // If no pattern matched, select a random response from existing patterns
    const randomPattern = shuffledPatterns[Math.floor(Math.random() * shuffledPatterns.length)];
    logger.silly(`app/api/chat/utils/eliza.ts - No pattern matched. Using random response: ${randomPattern.response}`);

    // Generate the random response without a pattern match, using `getRandomPlaceholder()` for placeholders
    const randomResponse = randomPattern.response.replace(/\$\d+/g, getRandomPlaceholder());
    return randomResponse;
    */

    // Default response if no conditions are met
    return "Can you tell me more about that?";
}
