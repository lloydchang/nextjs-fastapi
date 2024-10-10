// File: app/api/chat/utils/eliza.ts

import logger from './logger';

/**
 * Simulated chat responses for the Eliza persona using mixed reflective patterns and humor inspired by Abbott and Costello.
 */

const elizaPatterns = [
    { pattern: /I need (.*)/i, response: "Why do you need $1?", type: 'eliza' },
    { pattern: /I want (.*)/i, response: "What would $1 change?", type: 'eliza' },
    { pattern: /Why can'?t I ([^\?]*)\??/i, response: "What’s stopping you?", type: 'eliza' },
    { pattern: /Why don'?t you ([^\?]*)\??/i, response: "Should I do $1?", type: 'eliza' },
    { pattern: /Because (.*)/i, response: "Is that the only reason?", type: 'eliza' },
    { pattern: /I feel (.*)/i, response: "What makes you feel $1?", type: 'eliza' },
    { pattern: /Can you ([^\?]*)\??/i, response: "I could, but then who’s going to do the $2?", type: 'humor' },
    { pattern: /Can I ([^\?]*)\??/i, response: "Can you? Can I? Who’s on first?", type: 'humor' },
    { pattern: /You are (.*)/i, response: "Who is $1?", type: 'eliza' },
    { pattern: /Are you ([^\?]*)\??/i, response: "Why ask?", type: 'eliza' },
    { pattern: /What is (.*)/i, response: "What is $1?", type: 'eliza' },
    { pattern: /Who (.*)/i, response: "Who? What? No, who’s on first!", type: 'humor' },
    { pattern: /How do I (.*)/i, response: "What’s your plan?", type: 'eliza' },
    { pattern: /How should I (.*)/i, response: "Does it fit?", type: 'eliza' },
    { pattern: /I think (.*)/i, response: "When is $1?", type: 'eliza' },
    { pattern: /Do you know (.*)\??/i, response: "Who, $1? No, no, I know $2!", type: 'humor' },
    { pattern: /Are you sure (.*)\??/i, response: "Why does it matter?", type: 'eliza' },
    { pattern: /Should I (.*)\??/i, response: "What’s holding you back?", type: 'eliza' },
    { pattern: /What if (.*)\??/i, response: "What then?", type: 'eliza' },
    { pattern: /Why is (.*)\??/i, response: "How is $1?", type: 'eliza' },
    { pattern: /I am (.*)/i, response: "How long have you been feeling $1?", type: 'eliza' },
    { pattern: /I can't (.*)/i, response: "Can’t $1? Maybe you’re thinking of $2!", type: 'humor' },
    { pattern: /I don't (.*)/i, response: "What makes you resist $1?", type: 'eliza' },
    { pattern: /I always (.*)/i, response: "Why always $1?", type: 'eliza' },
    { pattern: /I never (.*)/i, response: "What would happen if you did?", type: 'eliza' },
    { pattern: /Do you (.*)\??/i, response: "Do I try $1? What do you think?", type: 'eliza' },
    { pattern: /I feel like (.*)/i, response: "Why do you feel like $1?", type: 'eliza' },
    { pattern: /Is it possible (.*)\??/i, response: "Possible $1? More likely $2, right?", type: 'humor' },
    { pattern: /Could I (.*)\??/i, response: "What would $1 achieve for you?", type: 'eliza' },
    { pattern: /Why do I (.*)\??/i, response: "What do you think?", type: 'eliza' },
    { pattern: /What should I (.*)\??/i, response: "What do you want to do?", type: 'eliza' },
    { pattern: /My (.*)/i, response: "Tell me more about $1.", type: 'eliza' },
    { pattern: /Am I (.*)/i, response: "Do you believe you are $1?", type: 'eliza' },
    { pattern: /It seems like (.*)/i, response: "It seems like $1? I thought it was $2!", type: 'humor' },
    { pattern: /Everyone (.*)/i, response: "Are you sure everyone loves $1?", type: 'eliza' },
    { pattern: /No one (.*)/i, response: "How does that make you feel?", type: 'eliza' },
    { pattern: /People (.*)/i, response: "Who specifically?", type: 'eliza' },
    { pattern: /What do you think\??/i, response: "What do I think? What do $2 think?", type: 'humor' },
    { pattern: /Why can’t you (.*)\??/i, response: "What’s preventing you from $1?", type: 'eliza' },
    { pattern: /Do you believe (.*)\??/i, response: "What does it mean if I believe $1?", type: 'eliza' },
    { pattern: /Your (.*)\??/i, response: "My $1? I thought it was your $2!", type: 'humor' },
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
            logger.debug(`app/api/chat/utils/eliza.ts - Matched pattern: ${rule.pattern}`);
            let response = rule.response.replace(/\$(\d+)/g, (_, index) => match[parseInt(index, 10)] || getRandomPlaceholder());
            response = response.trim(); // Remove leading/trailing whitespace
            response = response.replace(/\s+/g, ' '); // Replace multiple spaces/newlines with a single space
            logger.debug(`app/api/chat/utils/eliza.ts - Generated response: ${response}`);

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
