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
    { pattern: /What time is it\??/i, response: "I’m not a clock, but time is valuable! How’s your project going?" },
    { pattern: /How do you work\??/i, response: "I analyze your project inputs and provide guidance." },
    { pattern: /What’s your purpose\??/i, response: "I’m here to help you achieve your project’s goals." },
    { pattern: /Tell me a joke/i, response: "Why did the project manager break up with the timeline? It was too controlling!" },
    { pattern: /What is the SDG (.*)\??/i, response: "The SDG about $1 focuses on sustainable development. Let’s discuss it in context!" },
    { pattern: /Explain (.*) to me\??/i, response: "I can break down $1 if it relates to project goals." },
    { pattern: /Can we talk about (.*)\??/i, response: "Sure! Let’s dive into $1." },
    { pattern: /I don’t understand (.*)/i, response: "Can you elaborate more on $1?" },
    { pattern: /How should I start (.*)\??/i, response: "Begin by defining your project’s objectives clearly." },
    { pattern: /Why don’t you (.*)\??/i, response: "That’s an interesting idea! Should we consider $1?" },
    { pattern: /Can you recommend (.*)\??/i, response: "For $1, I’d suggest evaluating your project’s impact first." },
    { pattern: /Should we include (.*)\??/i, response: "If $1 aligns with your project goals, it’s worth considering." },
    { pattern: /What’s the best way to (.*)\??/i, response: "The best approach to $1 is to break it down into manageable steps." },
    { pattern: /Do you think (.*)\??/i, response: "It depends on the context. Let’s explore $1 further!" },
    { pattern: /How do you handle (.*)\??/i, response: "I process $1 based on project context and objectives." },
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
            // Replace placeholders in the response; use `getRandomPlaceholder()` if no match is found
            let response = rule.response.replace(/\$(\d+)/g, (_, index) => match[parseInt(index, 10)] || getRandomPlaceholder());

            // Sanitize and format the response
            response = response.trim(); // Remove leading/trailing whitespace
            response = response.replace(/\s+/g, ' '); // Replace multiple spaces/newlines with a single space
            logger.debug(`app/api/chat/utils/alice.ts - Generated response: ${response}`);

            return response;
        }
    }

    // If no pattern matched, return a default response
    logger.silly(`app/api/chat/utils/alice.ts - No pattern matched. Returning default response.`);
    return "I'm not sure I understand. Could you please provide more context?";

    // The following lines are commented out for now:
    /*
    // If no pattern matched, select a random response from existing patterns
    const randomPattern = shuffledPatterns[Math.floor(Math.random() * shuffledPatterns.length)];
    logger.silly(`app/api/chat/utils/alice.ts - No pattern matched. Using random response: ${randomPattern.response}`);

    // Generate the random response without a pattern match, using `getRandomPlaceholder()` for placeholders
    const randomResponse = randomPattern.response.replace(/\$\d+/g, getRandomPlaceholder());
    return randomResponse;
    */
}
