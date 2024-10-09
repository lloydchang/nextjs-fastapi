# File: app/api/chat/utils/stream_parser.py

import asyncio
import json
import logging
import re
from typing import AsyncIterator, Optional

# Configure the logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.ERROR)  # Adjust the logging level as needed
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)


async def parse_stream(
    reader: AsyncIterator[bytes],
    done_signal: str = 'done'
) -> str:
    """
    Parses an asynchronous byte stream and returns the accumulated result.
    Handles cases where multiple JSON objects might be in the same chunk.

    Args:
        reader (AsyncIterator[bytes]): The async iterator yielding byte chunks to parse.
        done_signal (str, optional): The key in the parsed chunk that indicates the stream is done.
                                      Defaults to 'done'.

    Returns:
        str: The final accumulated response.
    """
    buffer = ""
    response = ""
    done = False

    # Regular expression to find boundaries between JSON objects
    boundary_pattern = re.compile(r'}\s*{')

    async for chunk in reader:
        if done:
            break

        # Decode the incoming bytes to a string using UTF-8
        try:
            decoded_chunk = chunk.decode('utf-8')
        except UnicodeDecodeError as e:
            logger.error(f"Error decoding chunk: {e}")
            continue

        buffer += decoded_chunk

        while True:
            # Search for the boundary between JSON objects
            match = boundary_pattern.search(buffer)
            if not match:
                break

            boundary_index = match.start() + 1  # Position after the first '}'

            # Extract the complete JSON object up to the boundary
            complete_json = buffer[:boundary_index]
            buffer = buffer[boundary_index:]  # Remove the parsed object from the buffer

            try:
                parsed = json.loads(complete_json)
                response += parsed.get('response', '')
                done = parsed.get(done_signal, False)
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing JSON object: {complete_json}. Error: {e}")

        # Optionally, you can add logic to handle very large buffers or other edge cases

    # Handle any remaining buffer content that wasn't split correctly
    if buffer.strip():
        try:
            parsed = json.loads(buffer)
            response += parsed.get('response', '')
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing remaining buffer: \"{buffer}\". Error: {e}")

    return response.strip()


# Example usage
# This is a mock example demonstrating how you might use the `parse_stream` function.
# In a real scenario, `reader` would be an asynchronous byte stream, such as one obtained
# from an HTTP response using libraries like `aiohttp`.

async def mock_reader() -> AsyncIterator[bytes]:
    """A mock async generator that yields byte chunks."""
    chunks = [
        b'{"response": "Hello", "done": false}{"response": " World", "done": false}',
        b'{"response": "!", "done": true}'
    ]
    for chunk in chunks:
        await asyncio.sleep(0.1)  # Simulate asynchronous data arrival
        yield chunk

async def main():
    accumulated_response = await parse_stream(mock_reader())
    print(f"Accumulated Response: '{accumulated_response}'")

if __name__ == "__main__":
    asyncio.run(main())
