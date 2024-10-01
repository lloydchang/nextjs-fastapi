# api/search.py

from typing import List, Dict
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
import torch
import asyncio
from api.logger import logger  # Import the logger

async def semantic_search(query: str, data: pd.DataFrame, model: SentenceTransformer, sdg_embeddings, top_n: int = 10) -> List[Dict]:
    """
    Performs semantic search on the TEDx dataset.

    Args:
        query (str): The search query.
        data (pd.DataFrame): The dataset containing TEDx talks.
        model (SentenceTransformer): The loaded Sentence-BERT model.
        sdg_embeddings: The precomputed SDG embeddings.
        top_n (int): Number of top results to return.

    Returns:
        List[Dict]: List of search results with metadata.
    """
    logger.info(f"Performing semantic search for the query: '{query}'.")

    if model is None or 'description_vector' not in data.columns:
        logger.error("Model or data not available.")
        return [{"error": "Model or data not available."}]

    try:
        # Encode the query asynchronously
        query_vector = await asyncio.to_thread(
            model.encode,
            query,
            clean_up_tokenization_spaces=True,
            convert_to_tensor=True
        )
        query_vector = query_vector.cpu().numpy()

        # Convert description vectors to numpy array
        description_vectors_np = np.array([np.array(vec) for vec in data['description_vector']])

        # Compute cosine similarities
        similarities = np.dot(description_vectors_np, query_vector) / (
            np.linalg.norm(description_vectors_np, axis=1) * np.linalg.norm(query_vector)
        )

        # Get top N indices
        top_indices = np.argsort(-similarities)[:top_n]

        # Prepare the search results
        results = []
        for idx in top_indices:
            result = {
                'title': data.iloc[idx]['slug'].replace('_', ' '),
                'description': data.iloc[idx]['description'],
                'presenter': data.iloc[idx]['presenterDisplayName'],
                'sdg_tags': data.iloc[idx]['sdg_tags'],
                'similarity_score': float(similarities[idx]),
                'url': f"https://www.ted.com/talks/{data.iloc[idx]['slug']}"
            }
            results.append(result)

        logger.info(f"Semantic search completed successfully for query: '{query}'.")
        return results

    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        return [{"error": f"Search error: {str(e)}"}]
