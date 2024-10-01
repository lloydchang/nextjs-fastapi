# api/transcript.py

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict
import requests
from bs4 import BeautifulSoup
import os
import pickle
from api.cache_manager import load_cache, save_cache
from api.logger import logger

router = APIRouter()

# Define the path for the transcripts cache
TRANSCRIPTS_CACHE_PATH = "./api/cache/transcripts.pkl"

# Load existing transcripts from cache or initialize an empty dictionary
transcripts: Dict[str, str] = load_cache(TRANSCRIPTS_CACHE_PATH) or {}

class ScrapeRequest(BaseModel):
    url: HttpUrl

@router.post("/scrape-transcript/")
async def scrape_transcript(request: ScrapeRequest, background_tasks: BackgroundTasks):
    url = request.url
    if str(url) in transcripts:
        logger.info(f"Transcript for URL '{url}' is already available or being processed.")
        return {"message": "Transcript is already being processed or available.", "url": str(url)}
    
    logger.info(f"Initiating transcript scraping for URL: {url}")
    background_tasks.add_task(scrape_and_store_transcript, str(url))
    return {"message": "Scraping in progress", "url": str(url)}

def scrape_and_store_transcript(url: str):
    logger.info(f"Scraping transcript from URL: {url}")
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
        if response.status_code != 200:
            transcripts[url] = f"Failed to retrieve the page. Status code: {response.status_code}"
            logger.error(f"Failed to retrieve page. Status code: {response.status_code} for URL: {url}")
            save_cache(transcripts, TRANSCRIPTS_CACHE_PATH)
            return
        
        soup = BeautifulSoup(response.content, "html.parser")
        
        # Attempt to find transcript elements; adjust selectors as needed based on actual TED.com structure
        # Example selectors; may need to be updated
        transcript_sections = soup.find_all("div", class_="Grid__cell flx-s:1 p-r:4")
        
        if not transcript_sections:
            transcripts[url] = "Transcript section not found."
            logger.error(f"Transcript section not found for URL: {url}")
            save_cache(transcripts, TRANSCRIPTS_CACHE_PATH)
            return
        
        # Extract text from all <p> tags within the transcript sections
        transcript_text = "\n".join([p.get_text(strip=True) for p in transcript_sections if p.get_text(strip=True)])
        
        if not transcript_text:
            transcripts[url] = "Transcript text is empty."
            logger.error(f"Transcript text is empty for URL: {url}")
        else:
            transcripts[url] = transcript_text
            logger.info(f"Transcript scraped and stored for URL: {url}")
        
    except Exception as e:
        transcripts[url] = f"Error occurred: {str(e)}"
        logger.error(f"Error scraping transcript for URL '{url}': {e}")
    
    # Save the updated transcripts to cache
    save_cache(transcripts, TRANSCRIPTS_CACHE_PATH)

class TranscriptResponse(BaseModel):
    status: str
    transcript: Optional[str] = None
    message: Optional[str] = None

@router.get("/get-transcript/", response_model=TranscriptResponse)
async def get_transcript(url: HttpUrl):
    url_str = str(url)
    if url_str in transcripts:
        transcript = transcripts[url_str]
        if transcript.startswith("Error occurred") or transcript.endswith("not found.") or transcript.startswith("Failed"):
            logger.warning(f"Transcript retrieval status for URL '{url}': {transcript}")
            return {"status": "error", "message": transcript}
        else:
            logger.info(f"Transcript retrieved successfully for URL: {url}")
            return {"status": "completed", "transcript": transcript}
    else:
        logger.info(f"Transcript not found for URL: {url}")
        return {"status": "not found", "transcript": None}
