#!/bin/bash

# Script to update import paths in the backend directory and commit the changes to git
# Usage: ./update_backend_imports.sh

# Define the backend directory
BACKEND_DIR="backend"

# Log the start of the script
echo "Starting import path updates in the backend directory..."

# Find and replace all "python." imports with "backend.fastapi."
find "$BACKEND_DIR" -type f -name "*.py" -print0 | while IFS= read -r -d '' file; do
  echo "Updating imports in: $file"
  
  # Replace 'python.' with 'backend.fastapi.' for both import and from statements
  sed -i '' -e 's/from python\./from backend.fastapi./g' \
            -e 's/import python\./import backend.fastapi./g' \
            "$file"
done

# Stage the modified files
echo "Staging the changes..."
git add "$BACKEND_DIR"

# Commit the changes with a message
echo "Committing the changes..."
git commit -m "Refactor import paths: Updated 'python.' to 'backend.fastapi.' in backend files."

# Display the final status
echo "Import paths updated and changes committed successfully!"
