# fastapi/main.py

"""
Title: Combined API for TEDx SDG Search and Transcript Fetching

This main application combines the semantic search module (`fastapi/search.py`) and the transcript fetching module (`fastapi/transcript.py`) into a single FastAPI application. Each module is defined as a sub-application and mounted under different URL paths.

- Semantic Search (SDG-Aligned TEDx Talks): Accessible at `/fastapi/search/`
- Transcript Fetching: Accessible at `/fastapi/transcript/`
"""

from fastapi import FastAPI
from api.search import app as search_app  # Import the semantic search sub-application
from api.transcript import app as transcript_app  # Import the transcript sub-application

# Create the main FastAPI application instance
app = FastAPI(
    title="Combined API for TEDx SDG Search and Transcript Fetching",
    description="This API combines semantic search and transcript fetching into a single interface.",
    version="1.0.0"
)

# Mount Sub-Applications to Specific Paths
app.mount("/fastapi/search", search_app)  # Mount the semantic search app under /fastappi/search
app.mount("/fastapi/transcript", transcript_app)  # Mount the transcript app under /fastapi/transcript

# Root Endpoint for Testing the Main Application
@app.get("/")
async def root():
    return {"message": "Welcome to the Combined API for TEDx and SDGs!"}
