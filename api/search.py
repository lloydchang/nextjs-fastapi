# api/search.py

# Step 1: Import necessary modules
import os
import pandas as pd
import numpy as np
import torch
from sentence_transformers import SentenceTransformer, util
import pickle
from typing import List, Dict
import asyncio

# Step 2: Function to Load TEDx Dataset with Caching Mechanism
def load_datasets():
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

    return data, None

# Step 3: Function to Initialize the Sentence-BERT Model
def initialize_model(model=None):
    try:
        if model is None:
            model = SentenceTransformer('paraphrase-MiniLM-L6-v2')
        print("Model initialized successfully.")
    except Exception as e:
        print(f"Error initializing model: {e}")
        model = None

    sdg_embeddings_cache = "./api/cache/sdg_embeddings.pkl"
    from api.sdg_keywords import sdg_keywords
    sdg_keyword_list = [" ".join(keywords) for keywords in sdg_keywords.values()]

    if os.path.exists(sdg_embeddings_cache):
        with open(sdg_embeddings_cache, 'rb') as cache_file:
            sdg_embeddings = pickle.load(cache_file)
    else:
        sdg_embeddings = model.encode(sdg_keyword_list, convert_to_tensor=True)
        with open(sdg_embeddings_cache, 'wb') as cache_file:
            pickle.dump(sdg_embeddings, cache_file)
    
    return sdg_embeddings

# Step 4: Semantic Search Function Using NumPy and Asynchronous Handling
async def semantic_search(query: str, data: pd.DataFrame, model, sdg_embeddings, top_n: int = 10) -> List[Dict]:
    if model is None or 'description' not in data.columns:
        return [{"error": "Model or data not available."}]

    try:
        query_vector = await asyncio.to_thread(model.encode, query, convert_to_tensor=True)
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
        return [{"error": f"Search error: {str(e)}"}]
