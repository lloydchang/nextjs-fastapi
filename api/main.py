# main.py

"""
Title: Combined API for Semantic Search and Transcript Fetching

This main application combines the semantic search module (`api/index.py`) and the transcript fetching module (`api/transcript_fetcher.py`) into a single FastAPI application. Each module is defined as a sub-application and mounted under different URL paths.

- Semantic Search (SDG-Aligned TEDx Talks): Accessible at `/api/py/`
- Transcript Fetching: Accessible at `/api/transcripts/`

The combined application allows users to seamlessly search SDG-aligned TEDx talks and scrape transcripts from external sources using a unified interface.

"""

# Step 1: Import FastAPI and Sub-Applications
print("Step 1: Importing FastAPI and the sub-applications.")
from fastapi import FastAPI
from api.index import index_app  # Import the semantic search sub-application
from api.transcript_fetcher import transcript_app  # Import the transcript fetching sub-application

# Step 2: Create the Main FastAPI Application
print("Step 2: Creating the main FastAPI application instance.")
app = FastAPI(
    title="Combined API for TEDx SDG Search and Transcript Fetching",
    description="This API combines semantic search and transcript fetching into a single interface.",
    version="1.0.0"
)

# Step 3: Mount Sub-Applications to Specific Paths
print("Step 3: Mounting the sub-applications.")
app.mount("/api/py", index_app)  # Mount the semantic search app under /api/py
app.mount("/api/transcripts", transcript_app)  # Mount the transcript fetcher app under /api/transcripts

# Step 4: Root Endpoint for Testing the Main Application
print("Step 4: Defining a root endpoint for testing.")
@app.get("/")
async def root():
    return {"message": "Welcome to the Combined API for TEDx and SDGs!"}

