# api/transcript_fetcher.py

from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup

app = FastAPI()

# To store the scraped transcripts
transcripts = {}


class ScrapeRequest(BaseModel):
    url: str


# Endpoint to scrape transcript from the provided URL
@app.post("/api/scrape-transcript/")
async def scrape_transcript(request: ScrapeRequest, background_tasks: BackgroundTasks):
    # Check if the URL is already being processed
    if request.url in transcripts:
        return {"message": "Transcript is already being processed or available."}
    
    # Add to the background tasks for async processing
    background_tasks.add_task(scrape_and_store_transcript, request.url)
    return {"message": "Scraping in progress", "url": request.url}


# Function to perform the scraping (runs in the background)
def scrape_and_store_transcript(url: str):
    try:
        # Perform the request to get the webpage
        response = requests.get(url)
        if response.status_code != 200:
            transcripts[url] = "Failed to retrieve the page"
            return
        
        # Parse the content with BeautifulSoup
        soup = BeautifulSoup(response.content, "html.parser")

        # For example, extracting text from <p> tags (customize as needed)
        transcript_text = "\n".join([p.text for p in soup.find_all("p")])

        # Store the result in the transcripts dictionary
        transcripts[url] = transcript_text
    except Exception as e:
        transcripts[url] = f"Error occurred: {e}"


# Endpoint for the frontend to check the status and retrieve the transcript
@app.get("/api/get-transcript/")
async def get_transcript(url: str):
    if url in transcripts:
        return {"status": "completed", "transcript": transcripts[url]}
    else:
        return {"status": "not found", "transcript": ""}

