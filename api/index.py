"""
Title: Combined API for TEDx SDG Search and Transcript Fetching

This main application combines the semantic search module (`api/search.py`) and the transcript fetching module (`api/transcript.py`) into a single FastAPI application. Each module is defined as a sub-application and mounted under different URL paths.

- Semantic Search (SDG-Aligned TEDx Talks): Accessible at `/api/py/search/`
- Transcript Fetching: Accessible at `/api/py/transcript/`
"""

from fastapi import FastAPI
from transcript import app as transcript_app  # Import the transcript sub-application
from search import app as search_app  # Import the semantic search sub-application

# Create the main FastAPI application instance
app = FastAPI(
    title="Combined API for TEDx SDG Search and Transcript Fetching",
    description="This API combines semantic search and transcript fetching into a single interface.",
    version="1.0.0"
)

# Root Endpoint for Testing the Main Application
@app.get("/api/py/helloFastApi")  # Set the path under /api/py/
async def hello_fast_api():
    return {"message": "Hello from FastAPI!"}

# Mount Sub-Applications to Specific Paths
app.mount("/api/py/search", search_app)  # Mount the semantic search app under /api/py/search
app.mount("/api/py/transcript", transcript_app)  # Mount the transcript app under /api/py/transcript
