# Import necessary modules from FastAPI and other libraries
from fastapi import FastAPI, Query
from typing import List, Dict, Optional
import pandas as pd
import re
from sentence_transformers import SentenceTransformer, util
import nltk
from nltk.corpus import wordnet
import torch

# Download WordNet data for expanding keywords
nltk.download('wordnet')
nltk.download('omw-1.4')

# Create a FastAPI instance with custom documentation and OpenAPI URLs
app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

# Step 1: Load the TEDx Dataset
file_path = "./data/github-mauropelucchi-tedx_dataset-update_2024-details.csv"
data = pd.read_csv(file_path)

# Step 2: Define the Initial SDG Keywords for All 17 SDGs
sdg_keywords = {
    'SDG 1 - No Poverty': ['poverty', 'income disparity', 'social protection', 'economic growth', 'vulnerable'],
    'SDG 2 - Zero Hunger': ['hunger', 'food security', 'nutrition', 'agriculture', 'malnutrition'],
    'SDG 3 - Good Health and Well-Being': ['health', 'medicine', 'well-being', 'healthcare', 'vaccines', 'disease'],
    'SDG 4 - Quality Education': ['education', 'school', 'learning', 'literacy', 'skills development'],
    'SDG 5 - Gender Equality': ['gender', 'equality', 'women', 'girls', 'empowerment', 'gender-based violence'],
    'SDG 6 - Clean Water and Sanitation': ['water', 'sanitation', 'hygiene', 'safe water', 'drinking water'],
    'SDG 7 - Affordable and Clean Energy': ['energy', 'clean energy', 'renewable', 'solar', 'wind'],
    'SDG 8 - Decent Work and Economic Growth': ['employment', 'decent work', 'economic growth', 'job creation'],
    'SDG 9 - Industry, Innovation, and Infrastructure': ['infrastructure', 'innovation', 'technology', 'industrialization'],
    'SDG 10 - Reduced Inequalities': ['inequality', 'equal opportunities', 'income inequality', 'social inclusion'],
    'SDG 11 - Sustainable Cities and Communities': ['cities', 'urban', 'housing', 'sustainable communities'],
    'SDG 12 - Responsible Consumption and Production': ['consumption', 'production', 'waste management', 'recycling'],
    'SDG 13 - Climate Action': ['climate change', 'global warming', 'carbon emissions', 'climate adaptation'],
    'SDG 14 - Life Below Water': ['ocean', 'marine', 'sea', 'coastal ecosystems', 'pollution'],
    'SDG 15 - Life on Land': ['biodiversity', 'ecosystems', 'deforestation', 'wildlife'],
    'SDG 16 - Peace, Justice, and Strong Institutions': ['peace', 'justice', 'human rights', 'law', 'governance'],
    'SDG 17 - Partnerships for the Goals': ['partnerships', 'collaboration', 'global partnerships']
}

# Step 3: Expand SDG Keywords Using Synonyms from WordNet
def get_synonyms(word):
    synonyms = set()
    for syn in wordnet.synsets(word):
        for lemma in syn.lemmas():
            synonyms.add(lemma.name().replace('_', ' '))
    return list(synonyms)

# Expand each SDG keyword list with synonyms
expanded_sdg_keywords = {}
for sdg, keywords in sdg_keywords.items():
    expanded_keywords = set(keywords)
    for keyword in keywords:
        synonyms = get_synonyms(keyword)
        expanded_keywords.update(synonyms)
    expanded_sdg_keywords[sdg] = list(expanded_keywords)

# Use the expanded SDG keywords for improved SDG mapping
sdg_keywords = expanded_sdg_keywords

# Step 4: Enhance SDG Mapping with Additional NLP Processing
def map_sdgs(description: str) -> List[str]:
    sdg_tags = []
    for sdg, keywords in sdg_keywords.items():
        if any(re.search(r'\b' + keyword + r'\b', description, flags=re.IGNORECASE) for keyword in keywords):
            sdg_tags.append(sdg)
    return sdg_tags

# Step 5: Precompute SDG Tags for Each TEDx Talk
data['sdg_tags'] = data['description'].apply(lambda x: map_sdgs(str(x)))

# Step 6: Load Sentence-BERT for Semantic Search
model = SentenceTransformer('paraphrase-MiniLM-L6-v2')

# Step 7: Precompute Embeddings for Each Description
if 'description_vector' not in data.columns or not isinstance(data['description_vector'].iloc[0], torch.Tensor):
    data['description_vector'] = data['description'].apply(lambda x: model.encode(x, convert_to_tensor=True))

# Step 8: Create a Semantic Search Function
def semantic_search(query: str, top_n: int = 5) -> List[Dict]:
    query_vector = model.encode(query, convert_to_tensor=True)
    data['similarity'] = data['description_vector'].apply(lambda x: util.pytorch_cos_sim(query_vector, x).item())
    top_results = data.sort_values(by='similarity', ascending=False).head(top_n)
    return [
        {
            'title': row['slug'].replace('_', ' '),
            'description': row['description'],
            'presenter': row['presenterDisplayName'],
            'sdg_tags': row['sdg_tags'],
            'similarity_score': row['similarity'],
            'url': f"https://www.ted.com/talks/{row['slug']}"
        }
        for _, row in top_results.iterrows()
    ]

# Step 9: Define a "Hello World" Endpoint for Testing
@app.get("/api/py/helloFastApi")
def hello_fast_api():
    return {"message": "Hello from FastAPI"}

# Step 10: Create a Search Endpoint for TEDx Talks
@app.get("/api/py/search")
def search(query: str = Query(..., min_length=1), sdg_filter: Optional[List[str]] = Query(None)) -> List[Dict]:
    """
    Search TEDx talks based on a query. Optionally filter results by specific SDGs.
    
    Parameters:
        query (str): The search query keyword.
        sdg_filter (List[str]): Optional list of SDGs to filter results by.
    
    Returns:
        List[Dict]: List of matching TEDx talks with their SDG tags.
    """
    semantic_results = semantic_search(query)
    if sdg_filter:
        semantic_results = [result for result in semantic_results if any(sdg in result['sdg_tags'] for sdg in sdg_filter)]
    return semantic_results
