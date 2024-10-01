# api/index.py

"""
Title: Impact: Accelerating Progress Towards Global Goals with AI-Powered Insights
"""

# Step 1: Import necessary modules from FastAPI and other libraries
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from api.search import initialize_model, load_datasets, semantic_search
import asyncio
import warnings

# Step 1.1: Suppress `FutureWarning` in transformers and torch libraries
warnings.filterwarnings("ignore", category=FutureWarning, module="transformers.tokenization_utils_base")
warnings.filterwarnings("ignore", category=FutureWarning, message=".*torch.load.*", module="torch.storage")

# Step 2: Create a FastAPI app instance
app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

# Step 3: Enable CORS middleware to handle cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Step 4: Initialize the Model and Datasets
data, model = load_datasets()
sdg_embeddings = initialize_model(model)

# Step 5: Define a "Hello World" Endpoint for Testing
@app.get("/api/py/helloFastApi")
async def hello_fast_api():
    return {"message": "Hello from FastAPI"}

# Step 6: Create a Search Endpoint for TEDx Talks Using Asynchronous Search
@app.get("/api/py/search")
async def search(query: str = Query(..., min_length=1)):
    try:
        return await semantic_search(query, data, model, sdg_embeddings)
    except Exception as e:
        return [{"error": str(e)}]
