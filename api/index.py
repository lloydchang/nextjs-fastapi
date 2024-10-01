# api/index.py

from fastapi import FastAPI
from search import app as search_app  # Import the semantic search sub-application
from transcript import app as transcript_app  # Import the transcript sub-application

# Create the main FastAPI application instance
app = FastAPI(
    title="Combined API for TEDx SDG Search and Transcript Fetching",
    description="This API combines semantic search and transcript fetching into a single interface.",
    version="1.0.0"
)

# Root Endpoint for Testing the Main Application
@app.get("/api/py/helloFastApi")  # No trailing slash here
async def hello_fast_api():
    return {"message": "Hello from FastAPI!"}

# Mount Sub-Applications to Specific Paths
app.mount("/api/py/search/", search_app)  # Correct mount path with trailing slash
app.mount("/api/py/transcript/", transcript_app)  # Correct mount path with trailing slash
