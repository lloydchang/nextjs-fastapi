# api/index.py

"""
Title: Impact: Accelerating Progress Towards Global Goals with AI-Powered Insights
"""

# Import necessary modules from FastAPI and other libraries
from fastapi import FastAPI, Query
from typing import List, Dict
import os
import pickle
import warnings
import torch
from fastapi.middleware.cors import CORSMiddleware

# Import custom modules
from python.transcript import router as transcript_router
from python.logger import logger
from python.cache_manager import save_cache
from python.search import semantic_search
from python.data_loader import load_dataset
from python.embedding_utils import encode_descriptions, encode_sdg_keywords
from python.sdg_manager import get_sdg_keywords
from python.sdg_utils import compute_sdg_tags
from python.model import load_model

# Suppress FutureWarnings from transformers and torch libraries
logger.info("Step 1.1: Suppressing `FutureWarning` in transformers and torch libraries.")
warnings.filterwarnings("ignore", category=FutureWarning, module="transformers.tokenization_utils_base")
warnings.filterwarnings("ignore", category=FutureWarning, message=".*torch.load.*", module="torch.storage")

# Create a FastAPI app instance
app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

# Enable CORS middleware to handle cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the transcript router
app.include_router(transcript_router, prefix="/api/py", tags=["Transcript"])

# File paths for data and cache
file_path = "./python/data/github-mauropelucchi-tedx_dataset-update_2024-details.csv"
cache_file_path = "./python/cache/tedx_dataset.pkl"
sdg_embeddings_cache = "./python/cache/sdg_embeddings.pkl"
sdg_tags_cache = "./python/cache/sdg_tags.pkl"
description_embeddings_cache = "./python/cache/description_embeddings.pkl"

# Load the TEDx Dataset
data = load_dataset(file_path, cache_file_path)

# Load the Sentence-BERT model for Semantic Search
logger.info("Step 5: Loading the Sentence-BERT model for semantic search.")
model = load_model('paraphrase-MiniLM-L6-v2')

# Define the Initial SDG Keywords
logger.info("Step 6: Importing the predefined list of SDG keywords for all 17 SDGs.")
sdg_keywords = get_sdg_keywords()
sdg_names = list(sdg_keywords.keys())
sdg_keyword_list = [" ".join(keywords) for keywords in sdg_keywords.values()]

# Precompute or Load Cached SDG Keyword Embeddings
logger.info("Step 7: Precomputing or loading cached SDG keyword embeddings.")
if os.path.exists(sdg_embeddings_cache):
    logger.info("Loading cached SDG keyword embeddings.")
    try:
        with open(sdg_embeddings_cache, 'rb') as cache_file:
            sdg_embeddings = pickle.load(cache_file)
    except Exception as e:
        logger.error(f"Error loading cached SDG keyword embeddings: {e}")
        sdg_embeddings = None
else:
    if model:
        sdg_embeddings = encode_sdg_keywords(sdg_keyword_list, model)
        if sdg_embeddings:
            with open(sdg_embeddings_cache, 'wb') as cache_file:
                pickle.dump(sdg_embeddings, cache_file)
            logger.info("SDG keyword embeddings encoded and cached successfully.")
        else:
            logger.error("Failed to encode SDG keywords.")
    else:
        logger.error("Model not available to encode SDG keywords.")
        sdg_embeddings = None

# Precompute or Load Cached SDG Tags for Each TEDx Talk
logger.info("Step 8: Precomputing or loading cached SDG tags for TEDx talks.")
if os.path.exists(sdg_tags_cache):
    logger.info("Loading cached SDG tags.")
    try:
        with open(sdg_tags_cache, 'rb') as cache_file:
            data['sdg_tags'] = pickle.load(cache_file)
    except Exception as e:
        logger.error(f"Error loading cached SDG tags: {e}")
else:
    if not data.empty and 'description' in data.columns and sdg_embeddings is not None:
        descriptions = data['description'].tolist()
        description_vectors = encode_descriptions(descriptions, model)
        description_vectors_tensor = torch.tensor(description_vectors)
        sdg_embeddings_tensor = torch.tensor(sdg_embeddings)
        cosine_similarities = torch.nn.functional.cosine_similarity(description_vectors_tensor.unsqueeze(1), sdg_embeddings_tensor.unsqueeze(0), dim=-1)
        data['sdg_tags'] = compute_sdg_tags(cosine_similarities, sdg_names)
        save_cache(data['sdg_tags'], sdg_tags_cache)
        logger.info("SDG tags computed and cached successfully.")

# Precompute or Load Cached Embeddings for Each Description
logger.info("Step 9: Precomputing or loading cached embeddings for each description.")
if os.path.exists(description_embeddings_cache):
    logger.info("Loading cached description embeddings.")
    try:
        with open(description_embeddings_cache, 'rb') as cache_file:
            data['description_vector'] = pickle.load(cache_file)
    except Exception as e:
        logger.error(f"Error loading cached description embeddings: {e}")
else:
    if model and not data.empty and 'description' in data.columns:
        descriptions = data['description'].tolist()
        encoded_descriptions = encode_descriptions(descriptions, model)
        data['description_vector'] = encoded_descriptions
        save_cache(data['description_vector'], description_embeddings_cache)
        logger.info("Description embeddings encoded and cached successfully.")

# Define a "Hello World" Endpoint for Testing
@app.get("/api/py/helloFastApi")
async def hello_fast_api():
    return {"message": "Hello from FastAPI"}

# Create a Search Endpoint for TEDx Talks Using Asynchronous Search
@app.get("/api/py/search")
async def search(query: str = Query(..., min_length=1)) -> List[Dict]:
    try:
        return await semantic_search(query, data, model, sdg_embeddings)
    except Exception as e:
        logger.error(f"Error in search endpoint: {e}")
        return [{"error": str(e)}]
