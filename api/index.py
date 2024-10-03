# api/index.py

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import importlib
import os
import pickle
import warnings
import asyncio
import numpy as np

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

# Define a "Hello, World!" Endpoint for Testing
@app.get("/api/py/hello")
async def hello():
    return {"message": "Hello, World!"}

# Lazy Load Utility
def lazy_load(module_name, attr=None):
    module = importlib.import_module(module_name)
    return getattr(module, attr) if attr else module

# Initialize logger
logger = lazy_load("python.logger", "logger")

# Global variables to hold the loaded resources
model = None
data = None
sdg_embeddings = None
resources_initialized = False  # New flag to track if resources are fully initialized

# Event to wait for resource initialization
resource_event = asyncio.Event()

# Suppress warnings for specific libraries
logger.info("Suppressing FutureWarnings for transformers and torch libraries.")
warnings.filterwarnings("ignore", category=FutureWarning, module="transformers.tokenization_utils_base")
warnings.filterwarnings("ignore", category=FutureWarning, message=".*torch.load.*", module="torch.storage")

# File paths for data and cache
file_path = "./python/data/github-mauropelucchi-tedx_dataset-update_2024-details.csv"
cache_file_path = "./python/cache/tedx_dataset.pkl"
sdg_embeddings_cache = "./python/cache/sdg_embeddings.pkl"
description_embeddings_cache = "./python/cache/description_embeddings.pkl"

# Background task to load the necessary resources
async def load_resources():
    global model, data, sdg_embeddings, resources_initialized

    # Load TEDx Dataset
    logger.info("Loading TEDx dataset.")
    data_loader = lazy_load("python.data_loader", "load_dataset")
    data = data_loader(file_path, cache_file_path)
    logger.info(f"TEDx dataset loaded successfully! Data: {data is not None}")

    # Check if 'sdg_tags' column is in the dataset and add if missing
    if 'sdg_tags' not in data.columns:
        logger.info("Adding missing 'sdg_tags' column to the dataset with default empty lists.")
        data['sdg_tags'] = [[] for _ in range(len(data))]

    # Load the Sentence-BERT model
    logger.info("Loading the Sentence-BERT model for semantic search.")
    model = lazy_load("python.model", "load_model")('paraphrase-MiniLM-L6-v2')
    logger.info(f"Sentence-BERT model loaded successfully! Model: {model is not None}")

    # Check if 'description_vector' is present, if not, compute and add it
    if 'description_vector' not in data.columns:
        logger.info("'description_vector' column missing. Computing description embeddings.")
        embedding_utils = lazy_load("python.embedding_utils", "encode_descriptions")
        description_vectors = await asyncio.to_thread(embedding_utils, data['description'].tolist(), model)
        
        # Assign the computed vectors to the 'description_vector' column
        data['description_vector'] = description_vectors

        # Save the updated dataset with description embeddings to cache
        with open(cache_file_path, 'wb') as cache_file:
            pickle.dump(data, cache_file)
        logger.info("Description vectors computed and added to the dataset. Data cached successfully.")

    # Load or compute SDG Embeddings
    logger.info("Loading or computing SDG embeddings.")
    if os.path.exists(sdg_embeddings_cache):
        logger.info("Loading cached SDG keyword embeddings.")
        try:
            with open(sdg_embeddings_cache, 'rb') as cache_file:
                sdg_embeddings = pickle.load(cache_file)
            logger.info(f"SDG embeddings loaded from cache. Embeddings: {sdg_embeddings is not None}")
        except Exception as e:
            logger.error(f"Error loading cached SDG embeddings: {e}")
            sdg_embeddings = None
    else:
        logger.info("Computing SDG embeddings.")
        sdg_manager = lazy_load("python.sdg_manager", "get_sdg_keywords")
        sdg_keywords = sdg_manager()
        sdg_keyword_list = [" ".join(keywords) for keywords in sdg_keywords.values()]
        embedding_utils = lazy_load("python.embedding_utils", "encode_sdg_keywords")
        sdg_embeddings = await asyncio.to_thread(embedding_utils, sdg_keyword_list, model)
        if sdg_embeddings:
            with open(sdg_embeddings_cache, 'wb') as cache_file:
                pickle.dump(sdg_embeddings, cache_file)
            logger.info("SDG embeddings computed and cached successfully.")
        else:
            logger.error("Failed to encode SDG keywords.")
            sdg_embeddings = None

    # Set the resources initialized flag and notify waiting coroutines
    resources_initialized = True
    resource_event.set()  # Signal that resources are ready
    logger.info("All resources are fully loaded and ready for use.")

# On startup, load resources in a background task
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(load_resources())

# Create a Search Endpoint for TEDx Talks
@app.get("/api/py/search")
async def search(query: str = Query(..., min_length=1)) -> List[Dict]:
    # Wait until resources are fully initialized
    await resource_event.wait()
    logger.info(f"Search request received: Model is None: {model is None}, Data is None: {data is None}")

    if model is None or data is None:
        logger.error("Model or data not available.")
        return [{"error": "Model or data not available."}]

    # Log the types and content of the variables
    logger.info(f"Model Type: {type(model)}; Data Type: {type(data)}")

    # Perform the search if resources are available
    logger.info(f"Performing semantic search for the query: '{query}'.")
    try:
        search_module = lazy_load("python.search", "semantic_search")
        logger.info(f"Search Module Loaded: {search_module is not None}")
        result = await search_module(query, data, model, sdg_embeddings)
        logger.info(f"Search result: {result}")
        return result
    except Exception as e:
        logger.error(f"Error in search endpoint: {e}")
        return [{"error": str(e)}]
