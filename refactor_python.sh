#!/bin/bash

# File: refactor_python.sh
# Description: Refactors and reorganizes the `python` directory into a more structured format.

# Step 1: Create new folder structure under `backend/fastapi`
mkdir -p backend/fastapi/{api,services,models,data,cache,utils}

# Step 2: Move and rename files into appropriate directories

# Move `api` files
mv python/api/index.py backend/fastapi/api/index.py

# Move `services` files
mv python/sdg_manager.py backend/fastapi/services/
mv python/search.py backend/fastapi/services/search_service.py

# Move `models` files
mv python/model.py backend/fastapi/models/model_definitions.py
mv python/sdg_embeddings.pkl backend/fastapi/models/
mv python/sdg_tags.pkl backend/fastapi/models/
mv python/tedx_dataset.pkl backend/fastapi/models/

# Move `data` files
mv python/data_loader.py backend/fastapi/data/
mv python/sdg_keywords.py backend/fastapi/data/
mv python/sdg_utils.py backend/fastapi/data/

# Move `cache` files
mv python/cache_manager.py backend/fastapi/cache/cache_manager.py

# Move `utils` files
mv python/embedding_utils.py backend/fastapi/utils/
mv python/logger.py backend/fastapi/utils/

# Step 3: Remove empty directories
rm -rf python/api
rm -rf python/cache

# Step 4: Create an entry point for FastAPI (main.py)
echo 'from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI service"}' > backend/fastapi/main.py

# Step 5: Update import references inside each Python file
echo "Updating internal imports..."
find backend/fastapi/ -type f -name "*.py" | while read -r file; do
  # Replace old module paths with the new structure
  sed -i '' 's/from model/from models.model_definitions/g' "$file"
  sed -i '' 's/from sdg_manager/from services.sdg_manager/g' "$file"
  sed -i '' 's/from data_loader/from data.data_loader/g' "$file"
  sed -i '' 's/from sdg_utils/from data.sdg_utils/g' "$file"
  sed -i '' 's/from search/from services.search_service/g' "$file"
  sed -i '' 's/from cache_manager/from cache.cache_manager/g' "$file"
done

# Step 6: Stage and commit changes to git
git add backend/fastapi/
git commit -m "Refactor: Reorganized and renamed Python directory structure for better clarity and maintainability."

echo "Python directory refactor completed successfully!"
