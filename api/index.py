# api/index.py

# Step 1: Import necessary modules from FastAPI and other libraries
print("Step 1: Importing necessary modules from FastAPI and other libraries, including FastAPI, Pandas, NumPy, and Sentence-BERT.")
from fastapi import FastAPI, Query
from typing import List, Dict, Optional
import pandas as pd
import numpy as np
import re
from sentence_transformers import SentenceTransformer, util
import nltk
from nltk.corpus import wordnet
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

# Step 4: Download NLTK data if not available
print("Step 4: Downloading necessary NLTK data for WordNet.")
nltk_data_required = ['wordnet', 'omw-1.4']
for data_package in nltk_data_required:
    try:
        nltk.data.find(f'corpora/{data_package}.zip')
        print(f"Step 4.1: {data_package} data is already available.")
    except LookupError:
        print(f"Step 4.1: Downloading {data_package} data.")
        nltk.download(data_package)

# Step 5: Load the TEDx Dataset from a CSV file
print("Step 5: Loading the TEDx Dataset from the specified CSV file path.")
file_path = "./api/data/github-mauropelucchi-tedx_dataset-update_2024-details.csv"
try:
    data = pd.read_csv(file_path)
    print(f"Step 5.1: Dataset successfully loaded with {len(data)} records.")
except Exception as e:
    print(f"Step 5.2: Error loading dataset: {e}")
    data = pd.DataFrame()

# Step 6: Load the Sentence-BERT model for Semantic Search
print("Step 6: Loading the Sentence-BERT model for semantic search.")
try:
    model = SentenceTransformer('paraphrase-MiniLM-L6-v2')
    print("Step 6.1: Sentence-BERT model initialized successfully.")
except Exception as e:
    print(f"Step 6.1: Error initializing Sentence-BERT model: {e}")
    model = None

# Step 7: Define the Initial SDG Keywords for All 17 SDGs
print("Step 7: Importing the predefined list of SDG keywords for all 17 SDGs.")
from api.sdg_keywords import sdg_keywords

# Step 8: Enhance SDG Mapping with Additional NLP Processing
print("Step 8: Enhancing SDG mapping function.")
def map_sdgs(description: str) -> List[str]:
    sdg_tags = [sdg for sdg, keywords in sdg_keywords.items() if any(re.search(r'\b' + keyword + r'\b', description, flags=re.IGNORECASE) for keyword in keywords)]
    return sdg_tags if sdg_tags else [""]

# Step 9: Precompute SDG Tags for Each TEDx Talk
print("Step 9: Precomputing SDG tags for each TEDx talk.")
if not data.empty and 'description' in data.columns:
    data['sdg_tags'] = data['description'].apply(lambda x: map_sdgs(str(x)))
    data['sdg_tags_normalized'] = data['sdg_tags'].apply(lambda tags: [re.sub(r"SDG (\d+) -.*", r"SDG \1", tag) for tag in tags])
    print(f"Step 9.1: Sample of SDG tags mapped: {data[['description', 'sdg_tags', 'sdg_tags_normalized']].head(3).to_dict(orient='records')}")
else:
    print("Step 9.2: Dataset is empty or 'description' column not found.")

# Step 10: Precompute Embeddings for Each Description Using Sentence-BERT
print("Step 10: Precomputing Sentence-BERT embeddings.")
if model and not data.empty and 'description' in data.columns:
    data['description_vector'] = data['description'].apply(lambda x: model.encode(str(x), clean_up_tokenization_spaces=True, convert_to_tensor=True).tolist())
    print("Step 10.1: Embeddings successfully computed.")
else:
    print("Step 10.2: Error in computing embeddings or dataset is empty.")

# Step 11: Create a Semantic Search Function Using NumPy and Asynchronous Handling
print("Step 11: Creating a semantic search function.")
async def semantic_search(query: str, top_n: int = 5) -> List[Dict]:
    print(f"Step 11.1: Performing semantic search for the query: '{query}'.")
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
        print(f"Step 11.2: Error during semantic search: {e}")
        return [{"error": f"Search error: {str(e)}"}]

# Step 12: Define a "Hello World" Endpoint for Testing
@app.get("/api/py/helloFastApi")
async def hello_fast_api():
    return {"message": "Hello from FastAPI"}

# Step 13: Create a Search Endpoint for TEDx Talks Using Asynchronous Search
@app.get("/api/py/search")
async def search(query: str = Query(..., min_length=1), sdg_filter: Optional[List[str]] = Query(None)) -> List[Dict]:
    try:
        semantic_results = await semantic_search(query)
        if sdg_filter:
            semantic_results = [result for result in semantic_results if any(sdg in result['sdg_tags'] for sdg in sdg_filter)]
        return semantic_results
    except Exception as e:
        return [{"error": str(e)}]
