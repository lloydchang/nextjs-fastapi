# api/index.py

"""
Title: Impact: Accelerating Progress Towards Global Goals with AI-Powered Insights
"""

# Step 1: Import necessary modules from FastAPI and other libraries
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import warnings
import pickle
import os
from sentence_transformers import SentenceTransformer, util
from typing import List, Dict
import torch
import asyncio
from api.sdg_utils import compute_sdg_tags  # Import the new utility function

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

# Step 4: Load the TEDx Dataset with caching mechanism
file_path = "./api/data/github-mauropelucchi-tedx_dataset-update_2024-details.csv"
cache_file_path = "./api/cache/tedx_dataset.pkl"
data = pd.DataFrame()

if os.path.exists(cache_file_path):
    with open(cache_file_path, 'rb') as cache_file:
        data = pickle.load(cache_file)
else:
    try:
        data = pd.read_csv(file_path)
        with open(cache_file_path, 'wb') as cache_file:
            pickle.dump(data, cache_file)
    except Exception as e:
        print(f"Error loading dataset: {e}")

# Step 5: Load the Sentence-BERT model for Semantic Search
model = None
sdg_embeddings = None

try:
    model = SentenceTransformer('paraphrase-MiniLM-L6-v2')
    from api.sdg_keywords import sdg_keywords

    # Precompute or Load Cached SDG Keyword Embeddings
    sdg_embeddings_cache = "./api/cache/sdg_embeddings.pkl"
    sdg_keyword_list = [" ".join(keywords) for keywords in sdg_keywords.values()]

    if os.path.exists(sdg_embeddings_cache):
        with open(sdg_embeddings_cache, 'rb') as cache_file:
            sdg_embeddings = pickle.load(cache_file)
    else:
        sdg_embeddings = model.encode(sdg_keyword_list, convert_to_tensor=True)
        with open(sdg_embeddings_cache, 'wb') as cache_file:
            pickle.dump(sdg_embeddings, cache_file)
except Exception as e:
    print(f"Error initializing Sentence-BERT model: {e}")

# Step 6: Define a "Hello World" Endpoint for Testing
@app.get("/api/py/helloFastApi")
async def hello_fast_api():
    return {"message": "Hello from FastAPI"}

# Step 7: Compute or Load Cached SDG Tags Using External Utility
sdg_tags_cache = "./api/cache/sdg_tags.pkl"

if os.path.exists(sdg_tags_cache):
    with open(sdg_tags_cache, 'rb') as cache_file:
        data['sdg_tags'] = pickle.load(cache_file)
else:
    if not data.empty and 'description' in data.columns:
        descriptions = data['description'].tolist()
        description_vectors = model.encode(descriptions, convert_to_tensor=True, batch_size=32)
        cosine_similarities = util.pytorch_cos_sim(description_vectors, sdg_embeddings)

        # Use the new utility function to compute SDG tags
        data['sdg_tags'] = compute_sdg_tags(cosine_similarities, sdg_names)

        with open(sdg_tags_cache, 'wb') as cache_file:
            pickle.dump(data['sdg_tags'], cache_file)

# Other code sections remain unchanged...
