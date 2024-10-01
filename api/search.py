# api/search.py

# Step 1: Import necessary modules
import pandas as pd
import numpy as np
import torch
from sentence_transformers import SentenceTransformer, util
from typing import List, Dict
import asyncio

# Step 2: Moved function body of semantic_search to a new function perform_search
async def perform_search(query: str, data: pd.DataFrame, model: SentenceTransformer, sdg_embeddings, top_n: int = 10) -> List[Dict]:
    """
    Performs the semantic search using the query and preloaded data/model.
    This logic was moved from the `semantic_search` function in `index.py`.
    """
    if model is None or 'description_vector' not in data.columns:
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
