# api/transcript.py

from fastapi import APIRouter, HTTPException, Query, Response
import httpx  # Use httpx to simulate curl-like behavior
from api.logger import logger

router = APIRouter()

# Define headers to replicate the curl command's headers
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.ted.com/',
    'Connection': 'keep-alive',
}

@router.get("/transcript/")
async def proxy_transcript(url: str = Query(..., description="The URL of the TED Talk transcript to proxy")):
    """
    A proxy endpoint that uses `httpx` to simulate the behavior of a `curl` command.
    This returns the exact HTML content and headers, similar to a direct curl request.
    
    Args:
        url (str): The URL to be proxied.

    Returns:
        Response: A FastAPI response with the same content and headers as the original URL.
    """
    logger.info(f"Simulating curl request to URL: {url}")

    try:
        # Use httpx to fetch the content, simulating curl behavior
        async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True) as client:
            response = await client.get(url, timeout=10.0)

        # If the request was not successful, raise an exception
        if response.status_code != 200:
            logger.error(f"Failed to retrieve page. Status code: {response.status_code} for URL: {url}")
            raise HTTPException(status_code=response.status_code, detail=f"Failed to retrieve the page. Status code: {response.status_code}")

        # Reconstruct the headers to match `curl` output
        curl_headers = "\n".join(f"{key}: {value}" for key, value in response.headers.items())

        # Log the headers and return them as part of the response content for debugging
        logger.info(f"Response Headers: {curl_headers}")

        # Create a FastAPI response with the same content and headers as the original response
        return Response(
            content=response.content,  # Return the raw HTML content
            status_code=response.status_code,
            headers={k: v for k, v in response.headers.items() if k.lower() not in ["transfer-encoding", "content-length"]},  # Include relevant headers
            media_type="text/html"  # Set the media type explicitly
        )

    except httpx.RequestError as e:
        logger.error(f"Request to URL '{url}' failed: {e}")
        raise HTTPException(status_code=500, detail=f"Request failed: {e}")

    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")
