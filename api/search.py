# api/search.py

from fastapi import FastAPI, Query
from typing import List, Dict
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer, util
import torch
import os
import pickle
from sdg_keywords import sdg_keywords

app = FastAPI()

# Load the TEDx Dataset
file_path = "./data/github-mauropelucchi-tedx_dataset-update_2024-details.csv"
cache_file_path = "./cache/tedx_dataset.pkl"
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

# Load the Sentence-BERT model
model = SentenceTransformer('paraphrase-MiniLM-L6-v2')

# Precompute or Load SDG Keyword Embeddings
sdg_embeddings_cache = "./cache/sdg_embeddings.pkl"
sdg_names = list(sdg_keywords.keys())
sdg_keyword_list = [" ".join(keywords) for keywords in sdg_keywords.values()]

if os.path.exists(sdg_embeddings_cache):
    with open(sdg_embeddings_cache, 'rb') as cache_file:
        sdg_embeddings = pickle.load(cache_file)
else:
    sdg_embeddings = model.encode(sdg_keyword_list, convert_to_tensor=True)
    with open(sdg_embeddings_cache, 'wb') as cache_file:
        pickle.dump(sdg_embeddings, cache_file)

# Precompute or Load SDG Tags for Each TEDx Talk
sdg_tags_cache = "./cache/sdg_tags.pkl"

if os.path.exists(sdg_tags_cache):
    with open(sdg_tags_cache, 'rb') as cache_file:
        data['sdg_tags'] = pickle.load(cache_file)
else:
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

@app.get("/")
async def search(query: str = Query(..., min_length=1)) -> List[Dict]:
    query_vector = model.encode([query], convert_to_tensor=True)
    
    # Calculate cosine similarity between query and all TEDx talk descriptions
    all_descriptions = data['description'].tolist()
    all_vectors = model.encode(all_descriptions, convert_to_tensor=True)
    cos_scores = util.pytorch_cos_sim(query_vector, all_vectors)[0]
    
    # Get top 10 most similar talks
    top_results = torch.topk(cos_scores, k=10)
    
    results = []
    for score, idx in zip(top_results.values, top_results.indices):
        talk = data.iloc[idx]
        results.append({
            "title": talk['title'],
            "description": talk['description'],
            "url": talk['url'],
            "sdg_tags": talk['sdg_tags'],
            "relevance_score": float(score)
        })
    
    return results