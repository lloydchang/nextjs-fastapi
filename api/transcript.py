# api/transcript.py

from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup

app = FastAPI()

# Store scraped transcripts
transcripts = {}


class ScrapeRequest(BaseModel):
    url: str


@app.post("/scrape-transcript/")
async def scrape_transcript(request: ScrapeRequest, background_tasks: BackgroundTasks):
    if request.url in transcripts:
        return {"message": "Transcript is already being processed or available."}
    
    background_tasks.add_task(scrape_and_store_transcript, request.url)
    return {"message": "Scraping in progress", "url": request.url}


def scrape_and_store_transcript(url: str):
    try:
        response = requests.get(url)
        if response.status_code != 200:
            transcripts[url] = "Failed to retrieve the page"
            return
        
        soup = BeautifulSoup(response.content, "html.parser")
        transcript_text = "\n".join([p.text for p in soup.find_all("p")])
        transcripts[url] = transcript_text
    except Exception as e:
        transcripts[url] = f"Error occurred: {e}"


@app.get("/get-transcript/")
async def get_transcript(url: str):
    if url in transcripts:
        return {"status": "completed", "transcript": transcripts[url]}
    else:
        return {"status": "not found", "transcript": ""}
