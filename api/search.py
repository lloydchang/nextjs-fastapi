# api/search.py

"""
Title: Impact: Accelerating Progress Towards Global Goals with AI-Powered Insights

This semantic search API, built on FastAPI, harnesses AI and Natural Language Processing (NLP) to connect inspirational ideas from TEDx talks to the United Nations Sustainable Development Goals (SDGs). By allowing users to explore TEDx talks through the lens of SDGs, the application serves as a vital tool to bridge the gap between innovative ideas and actionable solutions, facilitating progress towards the Global Goals in a data-driven and research-backed manner. This API aims to address inefficiencies in discovering and mapping relevant content for sustainable development, making it easier for organizations, researchers, and activists to find resources aligned with specific SDGs.

The primary impact of this application lies in its ability to enhance information accessibility and scalability. It enables users to search and explore TEDx talks closely aligned with their areas of interest, reducing the time needed to manually sift through large datasets. Additionally, by associating TEDx content with SDG themes, the application helps contextualize global challenges, providing users with actionable insights directly linked to research-backed SDG metrics.

Research Grounding:

The AI model applied here, Sentence-BERT, is widely recognized for its robust performance in semantic similarity tasks. This research-backed model is fine-tuned specifically for sentence-level comparisons, making it ideal for understanding thematic relevance across a variety of domains. The application employs a well-defined plan to leverage this model for SDG alignment, using keyword embeddings and similarity scores to map talks to their corresponding SDGs.

The deployment strategy involves precomputing and caching embeddings, enabling fast, real-time search capabilities even with extensive datasets. The process includes multiple optimization steps, such as:
- Precomputing SDG keyword embeddings.
- Encoding TEDx talk descriptions.
- Computing and caching SDG relevance scores for each talk.

Expected Outcomes:

1. Improved Content Discovery: By using semantic search, the application allows users to find highly relevant TEDx talks that might otherwise be overlooked in traditional keyword-based searches.
2. Enhanced Awareness and Impact: Users, including non-profits, educators, and policymakers, can gain deeper insights into specific SDGs through TEDx content, sparking new ideas and strategies for addressing global challenges.
3. Catalyzing Action: By connecting SDG-aligned talks to users actively working in these areas, the API can catalyze the development of new projects, partnerships, and initiatives that are rooted in innovative, research-backed solutions.

AI Acceleration:

The application accelerates SDG progress by reducing inefficiencies in navigating complex information sources. For instance, traditional methods of sifting through TEDx transcripts would take significant time and manual effort. This AI-powered solution reduces that time exponentially, providing quick access to curated content that aligns with specific sustainable development goals. This efficient content mapping has the potential to accelerate policy development, educational initiatives, and community projects by making relevant knowledge more accessible.

Furthermore, the application is built with a clear strategy for future scaling. Additional SDG-related data sources, such as UNDP Human Development Reports or International Aid Transparency Initiative (IATI) data, can be integrated to create even more comprehensive SDG mappings. With additional datasets and continuous refinement of the AI model, the application can support broader impact areas, such as sustainability reporting, project planning, and real-time monitoring of progress towards the Global Goals.

Through this semantic search application, the goal is to create a scalable, AI-driven platform that democratizes access to valuable information, enabling users across sectors to make informed decisions that drive meaningful progress towards achieving the UN SDGs.
"""

# Step 1: Import necessary modules from FastAPI and other libraries
print("Step 1: Importing necessary modules from FastAPI and other libraries, including FastAPI, Pandas, NumPy, and Sentence-BERT.")
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

# Step 2: Create a FastAPI app instance
print("Step 2: Creating a FastAPI app instance with customized documentation paths.")
app = FastAPI(docs_url="/fastapi/docs", openapi_url="/fastapi/openapi.json")

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
file_path = "./data/github-mauropelucchi-tedx_dataset-update_2024-details.csv"
cache_file_path = "./cache/tedx_dataset.pkl"
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
sdg_embeddings_cache = "./cache/sdg_embeddings.pkl"
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
sdg_tags_cache = "./cache/sdg_tags.pkl"

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
