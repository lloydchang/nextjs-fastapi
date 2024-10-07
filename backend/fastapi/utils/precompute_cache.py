# File: backend/fastapi/utils/precompute_cache.py

from backend.fastapi.data.data_loader import load_dataset
from backend.fastapi.utils.text_processing import preprocess, compute_tf, compute_idf, compute_tfidf
from backend.fastapi.cache.cache_manager import save_cache

# Paths to data files and cache files
file_path = "backend/fastapi/data/github-mauropelucchi-tedx_dataset-update_2024-details.csv"
data_cache_path = "backend/fastapi/cache/tedx_dataset.pkl"
documents_cache_path = "backend/fastapi/cache/documents.pkl"
idf_cache_path = "backend/fastapi/cache/idf_dict.pkl"
tfidf_vectors_cache_path = "backend/fastapi/cache/document_tfidf_vectors.pkl"

# Step 1: Load the TEDx Dataset
data = load_dataset(file_path, data_cache_path)

# Step 2: Preprocess the dataset to create tokenized documents
documents = [preprocess(doc.get('description', '')) for doc in data]

# Step 3: Compute the IDF dictionary
idf_dict = compute_idf(documents)

# Step 4: Compute TF-IDF vectors for the documents
document_tfidf_vectors = [compute_tfidf(compute_tf(doc), idf_dict) for doc in documents]

# Step 5: Save all these components to cache files
save_cache(data, data_cache_path)  # Save dataset
save_cache(documents, documents_cache_path)  # Save preprocessed documents
save_cache(idf_dict, idf_cache_path)  # Save IDF dictionary
save_cache(document_tfidf_vectors, tfidf_vectors_cache_path)  # Save TF-IDF vectors

print("Precomputation complete! All resources have been cached successfully.")
