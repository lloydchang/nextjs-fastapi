# api/index.py

"""
Title: Impact: Accelerating Progress Towards Global Goals with AI-Powered Insights

[Full description as provided earlier]
"""

# Import necessary modules from FastAPI and other libraries
from fastapi import FastAPI, Query
from typing import List, Dict
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer, util
import torch
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import warnings
import os
import pickle

# Import custom modules
from api.search import semantic_search
from api.transcript import router as transcript_router  # Import transcript router
from api.data_loader import load_dataset
from api.embedding_utils import encode_descriptions, encode_sdg_keywords
from api.sdg_manager import get_sdg_keywords
from api.sdg_utils import compute_sdg_tags
from api.model import load_model
from api.logger import logger
from api.cache_manager import save_cache

# Suppress FutureWarnings from transformers and torch libraries
logger.info("Step 1.1: Suppressing `FutureWarning` in transformers and torch libraries.")
warnings.filterwarnings("ignore", category=FutureWarning, module="transformers.tokenization_utils_base")
warnings.filterwarnings("ignore", category=FutureWarning, message=".*torch.load.*", module="torch.storage")

# Create a FastAPI app instance with customized documentation paths
logger.info("Step 2: Creating a FastAPI app instance with customized documentation paths.")
app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

# Enable CORS middleware to handle cross-origin requests
logger.info("Step 3: Enabling CORS middleware to allow cross-origin requests from any origin.")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the transcript router
app.include_router(transcript_router, prefix="/api/py", tags=["Transcript"])

# Load the TEDx Dataset with caching mechanism using data_loader.py
file_path = "./api/data/github-mauropelucchi-tedx_dataset-update_2024-details.csv"
cache_file_path = "./api/cache/tedx_dataset.pkl"
data = load_dataset(file_path, cache_file_path)

# Load the Sentence-BERT model for Semantic Search using model.py
logger.info("Step 5: Loading the Sentence-BERT model for semantic search.")
model = load_model('paraphrase-MiniLM-L6-v2')

# Define the Initial SDG Keywords for All 17 SDGs using sdg_manager.py
logger.info("Step 6: Importing the predefined list of SDG keywords for all 17 SDGs.")
sdg_keywords = get_sdg_keywords()
sdg_names = list(sdg_keywords.keys())
sdg_keyword_list = [" ".join(keywords) for keywords in sdg_keywords.values()]

# Precompute or Load Cached SDG Keyword Embeddings using cache_manager.py and embedding_utils.py
logger.info("Step 7: Precomputing or loading cached SDG keyword embeddings.")
sdg_embeddings_cache = "./api/cache/sdg_embeddings.pkl"

if os.path.exists(sdg_embeddings_cache):
    logger.info("Step 7.1: Loading cached SDG keyword embeddings.")
    try:
        with open(sdg_embeddings_cache, 'rb') as cache_file:
            sdg_embeddings = pickle.load(cache_file)
        logger.info("Cached SDG keyword embeddings loaded successfully.")
    except Exception as e:
        logger.error(f"Error loading cached SDG keyword embeddings: {e}")
        sdg_embeddings = None
else:
    logger.info("Step 7.2: Encoding SDG keywords as a matrix.")
    if model is not None:
        sdg_embeddings = encode_sdg_keywords(sdg_keyword_list, model)
        if sdg_embeddings is not None:
            try:
                with open(sdg_embeddings_cache, 'wb') as cache_file:
                    pickle.dump(sdg_embeddings, cache_file)
                logger.info("SDG keyword embeddings encoded and cached successfully.")
            except Exception as e:
                logger.error(f"Error saving SDG keyword embeddings to cache: {e}")
        else:
            logger.error("Failed to encode SDG keywords.")
    else:
        logger.error("Model is not available. Cannot encode SDG keywords.")
        sdg_embeddings = None

# Precompute or Load Cached SDG Tags for Each TEDx Talk using sdg_utils.py
logger.info("Step 8: Precomputing or loading cached SDG tags for TEDx talks.")
sdg_tags_cache = "./api/cache/sdg_tags.pkl"

if os.path.exists(sdg_tags_cache):
    logger.info("Step 8.1: Loading cached SDG tags.")
    try:
        with open(sdg_tags_cache, 'rb') as cache_file:
            data['sdg_tags'] = pickle.load(cache_file)
        logger.info("Cached SDG tags loaded successfully.")
    except Exception as e:
        logger.error(f"Error loading cached SDG tags: {e}")
else:
    logger.info("Step 8.2: Computing SDG tags.")
    if not data.empty and 'description' in data.columns and sdg_embeddings is not None:
        try:
            descriptions = data['description'].tolist()
            description_vectors = encode_descriptions(descriptions, model)
            # Convert to torch tensors for cosine similarity computation
            description_vectors_tensor = torch.tensor(description_vectors)
            sdg_embeddings_tensor = torch.tensor(sdg_embeddings)
            cosine_similarities = util.pytorch_cos_sim(description_vectors_tensor, sdg_embeddings_tensor)

            # Compute SDG tags using the utility function
            data['sdg_tags'] = compute_sdg_tags(cosine_similarities, sdg_names)

            # Cache the computed SDG tags
            save_cache(data['sdg_tags'], sdg_tags_cache)
            logger.info("SDG tags computed and cached successfully.")
        except Exception as e:
            logger.error(f"Step 8.3: Error computing SDG tags: {e}")
    else:
        logger.error("Insufficient data or SDG embeddings to compute SDG tags.")

# Precompute or Load Cached Embeddings for Each Description using embedding_utils.py and cache_manager.py
logger.info("Step 9: Precomputing or loading cached embeddings for each description.")
description_embeddings_cache = "./api/cache/description_embeddings.pkl"

if os.path.exists(description_embeddings_cache):
    logger.info("Step 9.1: Loading cached description embeddings.")
    try:
        with open(description_embeddings_cache, 'rb') as cache_file:
            data['description_vector'] = pickle.load(cache_file)
        logger.info("Cached description embeddings loaded successfully.")
    except Exception as e:
        logger.error(f"Error loading cached description embeddings: {e}")
else:
    logger.info("Step 9.2: Encoding descriptions.")
    if model is not None and not data.empty and 'description' in data.columns:
        try:
            descriptions = data['description'].tolist()
            encoded_descriptions = encode_descriptions(descriptions, model)
            data['description_vector'] = encoded_descriptions
            # Cache the encoded descriptions
            save_cache(data['description_vector'], description_embeddings_cache)
            logger.info("Description embeddings encoded and cached successfully.")
        except Exception as e:
            logger.error(f"Step 9.3: Error encoding descriptions: {e}")
    else:
        logger.error("Model is not available or data is insufficient to encode descriptions.")

# Define a "Hello World" Endpoint for Testing
logger.info("Step 11: Defining a 'Hello World' endpoint.")
@app.get("/api/py/helloFastApi")
async def hello_fast_api():
    """
    A simple endpoint to verify that the API is working.
    """
    return {"message": "Hello from FastAPI"}

# Create a Search Endpoint for TEDx Talks Using Asynchronous Search
logger.info("Step 12: Creating a Search endpoint for TEDx talks.")
@app.get("/api/py/search")
async def search(query: str = Query(..., min_length=1)) -> List[Dict]:
    """
    Endpoint to perform semantic search on TEDx talks based on a query.
    
    Args:
        query (str): The search query provided by the user.
    
    Returns:
        List[Dict]: A list of TEDx talks matching the query with relevant metadata.
    """
    try:
        return await semantic_search(query, data, model, sdg_embeddings)
    except Exception as e:
        logger.error(f"Error in search endpoint: {e}")
        return [{"error": str(e)}]
