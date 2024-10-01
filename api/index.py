# api/index.py

"""
Title: Impact: Accelerating Progress Towards Global Goals with AI-Powered Insights

[Full description as provided]
"""

# Step 1: Import necessary modules from FastAPI and other libraries
from fastapi import FastAPI, Query
from typing import List, Dict
import pandas as pd
import numpy as np
import re
from sentence_transformers import SentenceTransformer, util
import torch
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import warnings
import os
import pickle
from api.sdg_utils import compute_sdg_tags  # Import the utility function
from api.model import load_model  # Import the model loading function

# Import the semantic_search function from search.py
from api.search import semantic_search
# Import the load_dataset function from data_loader.py
from api.data_loader import load_dataset
from api.logger import logger  # Import the logger

# Step 1.1: Suppress `FutureWarning` in transformers and torch libraries
logger.info("Step 1.1: Suppressing `FutureWarning` in transformers and torch libraries.")
warnings.filterwarnings("ignore", category=FutureWarning, module="transformers.tokenization_utils_base")
warnings.filterwarnings("ignore", category=FutureWarning, message=".*torch.load.*", module="torch.storage")

# Step 2: Create a FastAPI app instance
logger.info("Step 2: Creating a FastAPI app instance with customized documentation paths.")
app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

# Step 3: Enable CORS middleware to handle cross-origin requests
logger.info("Step 3: Enabling CORS middleware to allow cross-origin requests from any origin.")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Step 4: Load the TEDx Dataset with caching mechanism using data_loader.py
file_path = "./api/data/github-mauropelucchi-tedx_dataset-update_2024-details.csv"
cache_file_path = "./api/cache/tedx_dataset.pkl"
data = load_dataset(file_path, cache_file_path)

# Step 5: Load the Sentence-BERT model for Semantic Search
logger.info("Step 5: Loading the Sentence-BERT model for semantic search.")
model = load_model('paraphrase-MiniLM-L6-v2')

# Step 6: Define the Initial SDG Keywords for All 17 SDGs
logger.info("Step 6: Importing the predefined list of SDG keywords for all 17 SDGs.")
from api.sdg_keywords import sdg_keywords

# Step 7: Precompute or Load Cached SDG Keyword Embeddings
logger.info("Step 7: Precomputing or loading cached SDG keyword embeddings.")
sdg_embeddings_cache = "./api/cache/sdg_embeddings.pkl"
sdg_names = list(sdg_keywords.keys())
sdg_keyword_list = [" ".join(keywords) for keywords in sdg_keywords.values()]

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
    try:
        sdg_embeddings = model.encode(sdg_keyword_list, convert_to_tensor=True)
        with open(sdg_embeddings_cache, 'wb') as cache_file:
            pickle.dump(sdg_embeddings, cache_file)
        logger.info("SDG keyword embeddings encoded and cached successfully.")
    except Exception as e:
        logger.error(f"Error encoding SDG keywords: {e}")
        sdg_embeddings = None

# Step 8: Precompute or Load Cached SDG Tags for Each TEDx Talk
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
            description_vectors = model.encode(descriptions, convert_to_tensor=True, batch_size=32)
            cosine_similarities = util.pytorch_cos_sim(description_vectors, sdg_embeddings)

            # Compute SDG tags using the utility function
            data['sdg_tags'] = compute_sdg_tags(cosine_similarities, sdg_names)

            with open(sdg_tags_cache, 'wb') as cache_file:
                pickle.dump(data['sdg_tags'], cache_file)
            logger.info("SDG tags computed and cached successfully.")
        except Exception as e:
            logger.error(f"Step 8.3: Error computing SDG tags: {e}")

# Step 9: Precompute or Load Cached Embeddings for Each Description
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
    if model and not data.empty and 'description' in data.columns:
        try:
            data['description_vector'] = data['description'].apply(
                lambda x: model.encode(str(x), clean_up_tokenization_spaces=True, convert_to_tensor=True).tolist()
            )
            with open(description_embeddings_cache, 'wb') as cache_file:
                pickle.dump(data['description_vector'], cache_file)
            logger.info("Description embeddings encoded and cached successfully.")
        except Exception as e:
            logger.error(f"Step 9.3: Error encoding descriptions: {e}")

# Step 10: Semantic Search Function is now in search.py

# Step 11: Define a "Hello World" Endpoint for Testing
logger.info("Step 11: Defining a 'Hello World' endpoint.")
@app.get("/api/py/helloFastApi")
async def hello_fast_api():
    return {"message": "Hello from FastAPI"}

# Step 12: Create a Search Endpoint for TEDx Talks Using Asynchronous Search
logger.info("Step 12: Creating a Search endpoint for TEDx talks.")
@app.get("/api/py/search")
async def search(query: str = Query(..., min_length=1)) -> List[Dict]:
    try:
        return await semantic_search(query, data, model, sdg_embeddings)
    except Exception as e:
        logger.error(f"Error in search endpoint: {e}")
        return [{"error": str(e)}]
