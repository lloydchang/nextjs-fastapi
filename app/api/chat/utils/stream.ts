// File: app/api/chat/utils/stream.ts

export async function streamResponseBody(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Failed to access the response body stream.');

  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let done = false;

  while (!done) {
    const { value, done: streamDone } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !streamDone });
    done = streamDone;
  }

  return buffer;
}
