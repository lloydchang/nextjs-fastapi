# api/index.py

# Step 1: Import necessary modules from FastAPI and other libraries
print("Step 1: Importing necessary modules from FastAPI and other libraries, including FastAPI, Pandas, NumPy, and Sentence-BERT.")
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

# Step 1.1: Suppress `FutureWarning` in transformers and torch libraries
print("Step 1.1: Suppressing `FutureWarning` in transformers and torch libraries.")
warnings.filterwarnings("ignore", category=FutureWarning, module="transformers.tokenization_utils_base")
warnings.filterwarnings("ignore", category=FutureWarning, message=".*torch.load.*", module="torch.storage")

# Step 2: Create a FastAPI app instance
print("Step 2: Creating a FastAPI app instance with customized documentation paths.")
app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

# Step 3: Enable CORS middleware to handle cross-origin requests
print("Step 3: Enabling CORS middleware to allow cross-origin requests from any origin.")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Step 4: Load the TEDx Dataset with caching mechanism
print("Step 4: Loading the TEDx Dataset with a caching mechanism.")
file_path = "./api/data/github-mauropelucchi-tedx_dataset-update_2024-details.csv"
cache_file_path = "./api/cache/tedx_dataset.pkl"
data = pd.DataFrame()

if os.path.exists(cache_file_path):
    print("Step 4.1: Loading cached dataset.")
    with open(cache_file_path, 'rb') as cache_file:
        data = pickle.load(cache_file)
else:
    print("Step 4.2: Loading dataset from CSV file.")
    try:
        data = pd.read_csv(file_path)
        print(f"Step 4.3: Dataset successfully loaded with {len(data)} records.")
        # Cache the dataset for future use
        with open(cache_file_path, 'wb') as cache_file:
            pickle.dump(data, cache_file)
    except Exception as e:
        print(f"Step 4.4: Error loading dataset: {e}")

# Step 5: Load the Sentence-BERT model for Semantic Search
print("Step 5: Loading the Sentence-BERT model for semantic search.")
try:
    model = SentenceTransformer('paraphrase-MiniLM-L6-v2')
    print("Step 5.1: Sentence-BERT model initialized successfully.")
except Exception as e:
    print(f"Step 5.2: Error initializing Sentence-BERT model: {e}")
    model = None

# Step 6: Define the Initial SDG Keywords for All 17 SDGs
print("Step 6: Importing the predefined list of SDG keywords for all 17 SDGs.")
from api.sdg_keywords import sdg_keywords

# Step 7: Precompute or Load Cached SDG Keyword Embeddings
print("Step 7: Precomputing or loading cached SDG keyword embeddings.")
sdg_embeddings_cache = "./api/cache/sdg_embeddings.pkl"
sdg_names = list(sdg_keywords.keys())
sdg_keyword_list = [" ".join(keywords) for keywords in sdg_keywords.values()]

if os.path.exists(sdg_embeddings_cache):
    print("Step 7.1: Loading cached SDG keyword embeddings.")
    with open(sdg_embeddings_cache, 'rb') as cache_file:
        sdg_embeddings = pickle.load(cache_file)
else:
    print("Step 7.2: Encoding SDG keywords as a matrix.")
    sdg_embeddings = model.encode(sdg_keyword_list, convert_to_tensor=True)
    with open(sdg_embeddings_cache, 'wb') as cache_file:
        pickle.dump(sdg_embeddings, cache_file)

# Step 8: Precompute or Load Cached SDG Tags for Each TEDx Talk
print("Step 8: Precomputing or loading cached SDG tags for TEDx talks.")
sdg_tags_cache = "./api/cache/sdg_tags.pkl"

if os.path.exists(sdg_tags_cache):
    print("Step 8.1: Loading cached SDG tags.")
    with open(sdg_tags_cache, 'rb') as cache_file:
        data['sdg_tags'] = pickle.load(cache_file)
else:
    print("Step 8.2: Computing SDG tags.")
    if not data.empty and 'description' in data.columns:
        descriptions = data['description'].tolist()
        description_vectors = model.encode(descriptions, convert_to_tensor=True, batch_size=32)
        cosine_similarities = util.pytorch_cos_sim(description_vectors, sdg_embeddings)

        sdg_tags_list = []
        for row in cosine_similarities:
            sdg_indices = torch.where(row > 0.5)[0]
            if len(sdg_indices) == 0:
                top_n = row.topk(1).indices
                sdg_indices = top_n

            sdg_tags = [sdg_names[i] for i in sdg_indices]
            sdg_tags_list.append(sdg_tags)

        data['sdg_tags'] = sdg_tags_list
        with open(sdg_tags_cache, 'wb') as cache_file:
            pickle.dump(data['sdg_tags'], cache_file)

# Step 9: Precompute or Load Cached Embeddings for Each Description
print("Step 9: Precomputing or loading cached embeddings for each description.")
description_embeddings_cache = "./api/cache/description_embeddings.pkl"

if os.path.exists(description_embeddings_cache):
    print("Step 9.1: Loading cached description embeddings.")
    with open(description_embeddings_cache, 'rb') as cache_file:
        data['description_vector'] = pickle.load(cache_file)
else:
    print("Step 9.2: Encoding descriptions.")
    if model and not data.empty and 'description' in data.columns:
        data['description_vector'] = data['description'].apply(lambda x: model.encode(str(x), clean_up_tokenization_spaces=True, convert_to_tensor=True).tolist())
        with open(description_embeddings_cache, 'wb') as cache_file:
            pickle.dump(data['description_vector'], cache_file)

# Step 10: Create a Semantic Search Function Using NumPy and Asynchronous Handling
print("Step 10: Creating a semantic search function.")
async def semantic_search(query: str, top_n: int = 10) -> List[Dict]:
    print(f"Step 10.1: Performing semantic search for the query: '{query}'.")
    if model is None or 'description_vector' not in data.columns:
        return [{"error": "Model or data not available."}]
    
    try:
        query_vector = await asyncio.to_thread(model.encode, query, clean_up_tokenization_spaces=True, convert_to_tensor=True)
        query_vector = query_vector.cpu().numpy()

        description_vectors_np = np.array([np.array(vec) for vec in data['description_vector']])
        similarities = np.dot(description_vectors_np, query_vector) / (np.linalg.norm(description_vectors_np, axis=1) * np.linalg.norm(query_vector))
        top_indices = np.argsort(-similarities)[:top_n]
        return [
            {
                'title': data.iloc[idx]['slug'].replace('_', ' '),
                'description': data.iloc[idx]['description'],
                'presenter': data.iloc[idx]['presenterDisplayName'],
                'sdg_tags': data.iloc[idx]['sdg_tags'],
                'similarity_score': float(similarities[idx]),
                'url': f"https://www.ted.com/talks/{data.iloc[idx]['slug']}"
            }
            for idx in top_indices
        ]
    except Exception as e:
        print(f"Step 10.2: Error during semantic search: {e}")
        return [{"error": f"Search error: {str(e)}"}]

# Step 11: Define a "Hello World" Endpoint for Testing
@app.get("/api/py/helloFastApi")
async def hello_fast_api():
    return {"message": "Hello from FastAPI"}

# Step 12: Create a Search Endpoint for TEDx Talks Using Asynchronous Search
@app.get("/api/py/search")
async def search(query: str = Query(..., min_length=1)) -> List[Dict]:
    try:
        return await semantic_search(query)
    except Exception as e:
        return [{"error": str(e)}]
