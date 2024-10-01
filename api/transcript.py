# api/transcript.py

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import Dict
import requests
from bs4 import BeautifulSoup
from api.cache_manager import load_cache, save_cache
from api.logger import logger

transcript_router = APIRouter(prefix="/api/py", tags=["Transcript"])

# Define the path for storing transcripts
transcript_cache_path = "./api/cache/transcripts.pkl"

# Load existing transcripts from cache
transcripts: Dict[str, str] = load_cache(transcript_cache_path) or {}

class ScrapeRequest(BaseModel):
    url: HttpUrl

@transcript_router.post("/scrape-transcript/", summary="Scrape and store transcript from a TEDx talk URL.")
async def scrape_transcript(request: ScrapeRequest, background_tasks: BackgroundTasks):
    """
    Initiates the scraping of a transcript from the provided TEDx talk URL.
    
    - **url**: The URL of the TEDx talk from which to scrape the transcript.
    """
    url = request.url
    if url in transcripts:
        existing_transcript = transcripts[url]
        if existing_transcript.startswith("Error"):
            return {"message": "Previous scraping attempt failed. You can retry.", "url": url}
        return {"message": "Transcript is already available.", "url": url}
    
    background_tasks.add_task(scrape_and_store_transcript, url)
    return {"message": "Scraping in progress.", "url": url}

def scrape_and_store_transcript(url: str):
    """
    Scrapes the transcript from the given TEDx talk URL and stores it in the transcripts dictionary.
    """
    logger.info(f"Starting transcript scraping for URL: {url}")
    try:
        # Fetch the transcript page
        response = requests.get(url)
        if response.status_code != 200:
            error_msg = f"Failed to retrieve the page. Status code: {response.status_code}"
            transcripts[url] = f"Error: {error_msg}"
            logger.error(error_msg)
            save_cache(transcripts, transcript_cache_path)
            return
        
        soup = BeautifulSoup(response.content, "html.parser")
        
        # TED.com structure might vary; adjust selectors accordingly
        # Attempting to find transcript sections
        transcript_sections = soup.find_all("div", class_="Grid__cell flx-s:1 flx-nw:1 p-r:4")
        transcript_text = ""
        for section in transcript_sections:
            paragraphs = section.find_all("p")
            for p in paragraphs:
                transcript_text += p.get_text(separator=" ", strip=True) + "\n"
        
        if not transcript_text.strip():
            raise ValueError("Transcript content not found in the page.")
        
        transcripts[url] = transcript_text.strip()
        logger.info(f"Transcript scraped successfully for URL: {url}")
    
    except Exception as e:
        error_msg = f"Error occurred while scraping transcript: {str(e)}"
        transcripts[url] = f"Error: {error_msg}"
        logger.error(error_msg)
    
    finally:
        # Save the updated transcripts to cache
        save_cache(transcripts, transcript_cache_path)

@transcript_router.get("/get-transcript/", summary="Retrieve the transcript for a given TEDx talk URL.")
async def get_transcript(url: HttpUrl):
    """
    Retrieves the transcript for the provided TEDx talk URL.
    
    - **url**: The URL of the TEDx talk whose transcript is to be retrieved.
    """
    if url not in transcripts:
        raise HTTPException(status_code=404, detail="Transcript not found for the provided URL.")
    
    transcript = transcripts[url]
    if transcript.startswith("Error"):
        return {"status": "error", "message": transcript}
    
    return {"status": "completed", "transcript": transcript}
