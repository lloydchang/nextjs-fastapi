#!/bin/bash

# Script to update import paths, references, and the first commented line in the backend directory
# Usage: ./update_backend_imports_and_headers.sh

# Define the backend directory
BACKEND_DIR="backend"

echo "Starting the update process for import paths, references, and header comments in the backend directory..."

# Find and replace all "python." imports with "backend.fastapi."
# Also handle the updated logger path: "backend.fastapi.utils.logger"
find "$BACKEND_DIR" -type f -name "*.py" -print0 | while IFS= read -r -d '' file; do
  echo "Updating imports and references in: $file"
  
  # Update general import paths and references
  sed -i '' -e 's/from python\./from backend.fastapi./g' \
            -e 's/import python\./import backend.fastapi./g' \
            -e 's/"python\./"backend.fastapi./g' \
            "$file"
  
  # Update logger import to use the new path "backend.fastapi.utils.logger"
  sed -i '' -e 's/from backend.fastapi.logger import logger/from backend.fastapi.utils.logger import logger/g' \
            -e 's/import backend.fastapi.logger as logger/import backend.fastapi.utils.logger as logger/g' \
            "$file"

  # Handle file paths if they reference python/data or python/cache directories
  sed -i '' -e 's#./python/data#./backend/fastapi/data#g' \
            -e 's#./python/cache#./backend/fastapi/cache#g' \
            "$file"
  
  # Update the first commented line to indicate the file's path relative to the project root
  echo "Updating header comment in: $file"
  file_relative_path=$(echo "$file" | sed 's#^\./##')  # Remove leading "./" if present
  sed -i '' -e "1s|^#.*|# File: $file_relative_path|" "$file"
done

# Stage the modified files
echo "Staging the changes..."
git add "$BACKEND_DIR"

# Commit the changes with a message
echo "Committing the changes..."
git commit -m "Refactor: Update import paths, references, and header comments in backend files. Updated logger path to backend.fastapi.utils.logger."

echo "Import paths, references, and header comments updated and changes committed successfully!"
