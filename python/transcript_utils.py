# python/transcript_utils.py

import requests
from bs4 import BeautifulSoup
from typing import Optional, Tuple
from python.logger import logger

# Define headers to simulate a browser request
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.ted.com/',
    'Connection': 'keep-alive',
}

def fetch_transcript(url: str) -> Tuple[Optional[str], str]:
    """
    Fetches the transcript from the given TED Talk URL.

    Args:
        url (str): The URL of the TED Talk transcript page.

    Returns:
        Tuple[Optional[str], str]: A tuple containing the transcript text (or None in case of failure) and a message.
    """
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code != 200:
            logger.error(f"Failed to retrieve page. Status code: {response.status_code} for URL: {url}")
            return None, f"Failed to retrieve the page. Status code: {response.status_code}"

        soup = BeautifulSoup(response.content, "html.parser")
        transcript_div = soup.find("div", class_="Grid__cell flx-s:1 p-r:4")  # Adjust based on actual HTML structure

        if not transcript_div:
            logger.error(f"Transcript section not found for URL: {url}")
            return None, "Transcript section not found."

        transcript_text = "\n".join([p.get_text(strip=True) for p in transcript_div.find_all("p")])
        
        if not transcript_text:
            logger.error(f"Transcript text is empty for URL: {url}")
            return None, "Transcript text is empty."
        
        return transcript_text, "Transcript fetched successfully."

    except Exception as e:
        logger.error(f"Error fetching transcript for URL '{url}': {e}")
        return None, f"Error occurred: {str(e)}"
