# api/main.py

"""
Title: Combined API for TEDx SDG Search and Transcript Fetching

This main application combines the semantic search module (`api/index.py`) and the transcript fetching module (`api/transcript_fetcher.py`) into a single FastAPI application. Each module is defined as a sub-application and mounted under different URL paths.

- Semantic Search (SDG-Aligned TEDx Talks): Accessible at `/api/py/`
- Transcript Fetching: Accessible at `/api/transcripts/`
"""

from fastapi import FastAPI
from api.index import app as index_app  # Import the semantic search sub-application
from api.transcript_fetcher import app as transcript_app  # Import the transcript fetching sub-application

# Create the main FastAPI application instance
app = FastAPI(
    title="Combined API for TEDx SDG Search and Transcript Fetching",
    description="This API combines semantic search and transcript fetching into a single interface.",
    version="1.0.0"
)

# Mount Sub-Applications to Specific Paths
app.mount("/api/py", index_app)  # Mount the semantic search app under /api/py
app.mount("/api/transcripts", transcript_app)  # Mount the transcript fetcher app under /api/transcripts

# Root Endpoint for Testing the Main Application
@app.get("/")
async def root():
    return {"message": "Welcome to the Combined API for TEDx and SDGs!"}
