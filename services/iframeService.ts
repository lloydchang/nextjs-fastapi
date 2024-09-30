// services/iframeService.ts
export const sendCommandToIframe = async (
    input: string,
    context: string,
    onResponse: (generatedCode: string, newContext: string | null) => void
) => {
    const systemPrompt = `
    The following is the current state of the iframe:
    ${context}
    Based on this state, generate JavaScript code that not only interacts with the elements but also includes cursor movements.
    - Use \`moveCursorTo(x, y)\` to move the cursor to specific positions.
    - Use \`clickCursor()\` to simulate a click action.
    Ensure the cursor movements align with the DOM manipulations you perform.
    Return only the JavaScript code without explanations, using \`iframeRef\` for DOM access.`;

    const requestBody = {
        model: 'llama3.2',
        prompt: systemPrompt,
        temperature: 0.0,
        stream: true,
    };

    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status} - ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Failed to access the response body stream.');

        const decoder = new TextDecoder('utf-8');
        let done = false;
        let buffer = '';

        while (!done) {
            const { value, done: streamDone } = await reader.read();
            const chunk = decoder.decode(value, { stream: true });

            try {
                const parsed = JSON.parse(chunk);
                if (parsed.response) {
                    buffer += parsed.response;

                    if (/[^0-9]\.\s*$|[!?]\s*$/.test(buffer)) {
                        const completeSegment = buffer.trim();
                        buffer = ''; // Clear buffer for next segment
                        onResponse(completeSegment, parsed.context || null);
                    }
                }
                done = parsed.done || streamDone;
            } catch (e) {
                console.error('Error parsing chunk:', chunk, e);
            }
        }
    } catch (error) {
        console.error('Error sending command to iframe service:', error);
        throw error;
    }
};
