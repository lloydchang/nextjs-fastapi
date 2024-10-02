# api/index.py

"""
Title: Impact: Accelerating Progress Towards Global Goals with AI-Powered Insights

[Full description as provided earlier]
"""

# Import necessary modules using importlib for lazy loading
import importlib
from fastapi import FastAPI, Query
import os
import pickle

# Lazy import function
def lazy_load(module_name):
    return importlib.import_module(module_name)

# Import custom modules using lazy load
transcript_router = lazy_load("python.transcript").router  # Import transcript router lazily

# Create a FastAPI app instance with customized documentation paths
app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

# Enable CORS middleware to handle cross-origin requests
app.add_middleware(
    lazy_load("fastapi.middleware.cors").CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the transcript router
app.include_router(transcript_router, prefix="/api/py", tags=["Transcript"])

# Check if the critical cache file exists and set a global flag
sdg_embeddings_cache = "./python/cache/sdg_embeddings.pkl"
sdg_embeddings_cache_exists = os.path.exists(sdg_embeddings_cache)

# If the cache exists, skip the following functions:
model = None
sdg_keywords = None
sdg_names = None
sdg_embeddings = None

if not sdg_embeddings_cache_exists:
    # Lazy load the model only if the cache file is not present
    def get_model():
        model_module = lazy_load("python.model")
        return model_module.load_model('paraphrase-MiniLM-L6-v2')

    model = get_model()

    # Lazy load SDG keywords only if the cache file is not present
    def get_sdg_keywords():
        sdg_module = lazy_load("python.sdg_manager")
        return sdg_module.get_sdg_keywords()

    sdg_keywords = get_sdg_keywords()
    sdg_names = list(sdg_keywords.keys())
    sdg_keyword_list = [" ".join(keywords) for keywords in sdg_keywords.values()]

    # Compute SDG keyword embeddings only if the cache file is not present
    def get_sdg_embeddings():
        embedding_utils = lazy_load("python.embedding_utils")
        return embedding_utils.encode_sdg_keywords(sdg_keyword_list, model)

    sdg_embeddings = get_sdg_embeddings()
else:
    print(f"Cache file '{sdg_embeddings_cache}' found. Skipping model and SDG keyword initialization.")
    with open(sdg_embeddings_cache, 'rb') as cache_file:
        sdg_embeddings = pickle.load(cache_file)

# Function to load dataset with caching mechanism
def get_dataset():
    cache_file_path = "./python/cache/tedx_dataset.pkl"
    if os.path.exists(cache_file_path):
        print("Dataset cache found. Skipping dataset loading.")
        with open(cache_file_path, 'rb') as cache_file:
            return pickle.load(cache_file)
    else:
        data_loader = lazy_load("python.data_loader")
        return data_loader.load_dataset(
            "./python/data/github-mauropelucchi-tedx_dataset-update_2024-details.csv", 
            cache_file_path
        )

data = get_dataset()

# Function to compute or load SDG tags lazily
def get_sdg_tags():
    cache_file_path = "./python/cache/sdg_tags.pkl"
    if os.path.exists(cache_file_path):
        print("SDG tags cache found. Skipping SDG tag computation.")
        with open(cache_file_path, 'rb') as cache_file:
            return pickle.load(cache_file)
    else:
        if not data.empty and 'description' in data.columns and sdg_embeddings is not None:
            descriptions = data['description'].tolist()
            description_vectors = encode_descriptions(descriptions)
            description_vectors_tensor = torch.tensor(description_vectors)
            sdg_embeddings_tensor = torch.tensor(sdg_embeddings)
            cosine_similarities = util.pytorch_cos_sim(description_vectors_tensor, sdg_embeddings_tensor)
            sdg_utils = lazy_load("python.sdg_utils")
            data['sdg_tags'] = sdg_utils.compute_sdg_tags(cosine_similarities, sdg_names)
            cache_manager = lazy_load("python.cache_manager")
            cache_manager.save_cache(data['sdg_tags'], cache_file_path)
            return data['sdg_tags']
        else:
            return None

sdg_tags = get_sdg_tags()

# Function to load description embeddings with caching
def get_description_embeddings():
    cache_file_path = "./python/cache/description_embeddings.pkl"
    if os.path.exists(cache_file_path):
        print("Description embeddings cache found. Skipping encoding.")
        with open(cache_file_path, 'rb') as cache_file:
            return pickle.load(cache_file)
    else:
        if model is not None and not data.empty and 'description' in data.columns:
            embedding_utils = lazy_load("python.embedding_utils")
            descriptions = data['description'].tolist()
            encoded_descriptions = embedding_utils.encode_descriptions(descriptions, model)
            cache_manager = lazy_load("python.cache_manager")
            cache_manager.save_cache(encoded_descriptions, cache_file_path)
            return encoded_descriptions
        else:
            return None

description_embeddings = get_description_embeddings()

# Define a "Hello World" Endpoint for Testing
@app.get("/api/py/helloFastApi")
async def hello_fast_api():
    """
    A simple endpoint to verify that the API is working.
    """
    return {"message": "Hello from FastAPI"}

# Create a Search Endpoint for TEDx Talks Using Asynchronous Search
@app.get("/api/py/search")
async def search(query: str = Query(..., min_length=1)) -> list[dict]:
    """
    Endpoint to perform semantic search on TEDx talks based on a query.

    Args:
        query (str): The search query provided by the user.

    Returns:
        list[dict]: A list of TEDx talks matching the query with relevant metadata.
    """
    semantic_search = lazy_load("python.search").semantic_search
    try:
        return await semantic_search(query, data, model, sdg_embeddings)
    except Exception as e:
        print(f"Error in search endpoint: {e}")
        return [{"error": str(e)}]
