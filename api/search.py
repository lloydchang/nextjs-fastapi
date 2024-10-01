"""
Title: Impact: Accelerating Progress Towards Global Goals with AI-Powered Insights

This semantic search API, built on FastAPI, harnesses AI and Natural Language Processing (NLP) to connect inspirational ideas from TEDx talks to the United Nations Sustainable Development Goals (SDGs).
"""

print("Step 1: Importing necessary modules from FastAPI and other libraries.")
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

# Step 1.1: Suppress `FutureWarning` in transformers and torch libraries
print("Step 1.1: Suppressing `FutureWarning` in transformers and torch libraries.")
warnings.filterwarnings("ignore", category=FutureWarning, module="transformers.tokenization_utils_base")
warnings.filterwarnings("ignore", category=FutureWarning, message=".*torch.load.*", module="torch.storage")

# Step 2: Create a FastAPI sub-application for the semantic search
print("Step 2: Creating a FastAPI app instance with customized documentation paths.")
app = FastAPI(docs_url=None, openapi_url=None)  # Set documentation paths to None to prevent conflicts

# Step 3: Enable CORS middleware to handle cross-origin requests
print("Step 3: Enabling CORS middleware to allow cross-origin requests from any origin.")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define a simple root path for testing if the sub-application is active
@app.get("/")
async def root():
    return {"message": "Search API is running"}

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

# Step 11: Create a Search Endpoint for TEDx Talks Using Asynchronous Search
print("Step 11: Create a Search Endpoint for TEDx Talks Using Asynchronous Search.")
@app.get("/search")  # The path here should be "/search"
async def search(query: str = Query(..., min_length=1)) -> List[Dict]:
    try:
        return await semantic_search(query)
    except Exception as e:
        return [{"error": str(e)}]

# Step 12: Define a "Hello World" Endpoint for Testing
print("Step 12: Define a \"Hello World\" Endpoint for Testing.")
@app.get("/search/hello")
async def hello_fast_api():
    return {"message": "Hello from Search Application"}
