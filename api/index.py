# api/index.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from search import app as search_app
from transcript import app as transcript_app

app = FastAPI(
    title="Combined API for TEDx SDG Search and Transcript Fetching",
    description="This API combines semantic search and transcript fetching into a single interface.",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/py/helloFastApi")
async def hello_fast_api():
    return {"message": "Hello from FastAPI!"}

app.mount("/api/py/search", search_app)
app.mount("/api/py/transcript", transcript_app)