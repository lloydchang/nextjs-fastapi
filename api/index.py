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

# Step 1.1: Suppress `FutureWarning` in transformers library
print("Step 1.1: Suppressing `FutureWarning` in transformers library regarding tokenization.")
warnings.filterwarnings("ignore", category=FutureWarning, module="transformers.tokenization_utils_base")

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

# Step 4: Load the TEDx Dataset from a CSV file
print("Step 4: Loading the TEDx Dataset from the specified CSV file path.")
file_path = "./api/data/github-mauropelucchi-tedx_dataset-update_2024-details.csv"
try:
    data = pd.read_csv(file_path)
    print(f"Step 4.1: Dataset successfully loaded with {len(data)} records.")
except Exception as e:
    print(f"Step 4.2: Error loading dataset: {e}")
    data = pd.DataFrame()

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

# Step 7: Precompute Embeddings for SDG Keywords Using Sentence-BERT
print("Step 7: Precomputing SDG keyword embeddings using Sentence-BERT for optimized matrix calculations.")
sdg_names = list(sdg_keywords.keys())
sdg_keyword_list = [" ".join(keywords) for keywords in sdg_keywords.values()]

# Encode SDG keywords as a matrix
sdg_embeddings = model.encode(sdg_keyword_list, convert_to_tensor=True)

# Step 8: Precompute SDG Tags for Each TEDx Talk Using Efficient Matrix Operations
print("Step 8: Precomputing SDG tags for each TEDx talk using matrix operations for semantic similarity.")
if not data.empty and 'description' in data.columns:
    try:
        descriptions = data['description'].tolist()
        # Step 8.1: Encode descriptions as a tensor matrix
        description_vectors = model.encode(descriptions, convert_to_tensor=True, batch_size=32)

        # Step 8.2: Calculate similarity between description and SDG keyword embeddings using matrix operations
        cosine_similarities = util.pytorch_cos_sim(description_vectors, sdg_embeddings)
        
        # Step 8.3: Map each description to its highest scoring SDG(s)
        sdg_tags_list = []
        for row in cosine_similarities:
            sdg_indices = torch.where(row > 0.5)[0]  # Filter by threshold
            if len(sdg_indices) == 0:
                top_n = row.topk(1).indices  # Fallback to top N SDGs
                sdg_indices = top_n

            # Convert indices to SDG names
            sdg_tags = [sdg_names[i] for i in sdg_indices]
            sdg_tags_list.append(sdg_tags)

        # Step 8.4: Store results in the DataFrame
        data['sdg_tags'] = sdg_tags_list
        data['sdg_tags_normalized'] = data['sdg_tags'].apply(
            lambda tags: [re.sub(r"SDG (\d+) -.*", r"SDG \1", tag) for tag in tags]
        )
        print(f"Step 8.5: Sample of SDG tags mapped: {data[['description', 'sdg_tags', 'sdg_tags_normalized']].head(3).to_dict(orient='records')}")
    except Exception as e:
        print(f"Step 8.6: Error during SDG tag precomputation: {e}")
else:
    print("Step 8.7: Dataset is empty or 'description' column not found.")

# Step 9: Precompute Embeddings for Each Description Using Sentence-BERT
print("Step 9: Precomputing Sentence-BERT embeddings.")
if model and not data.empty and 'description' in data.columns:
    data['description_vector'] = data['description'].apply(lambda x: model.encode(str(x), clean_up_tokenization_spaces=True, convert_to_tensor=True).tolist())
    print("Step 9.1: Embeddings successfully computed.")
else:
    print("Step 9.2: Error in computing embeddings or dataset is empty.")

# Step 10: Create a Semantic Search Function Using NumPy and Asynchronous Handling
print("Step 10: Creating a semantic search function.")
async def semantic_search(query: str, top_n: int = 10) -> List[Dict]:
    print(f"Step 10.1: Performing semantic search for the query: '{query}'.")
    if model is None or 'description_vector' not in data.columns:
        return [{"error": "Model or data not available."}]
    
    try:
        query_vector = await asyncio.to_thread(model.encode, query, clean_up_tokenization_spaces=True, convert_to_tensor=True)
        query_vector = query_vector.cpu().numpy()

        # Perform general semantic search
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
