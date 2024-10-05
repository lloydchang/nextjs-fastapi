#!/bin/bash

# Script to update import paths and references in the backend directory
# Usage: ./update_logger_path.sh

# Define the backend directory
BACKEND_DIR="backend"

echo "Starting the update process for the logger path in backend files..."

# Find and replace incorrect logger path references in the backend directory
find "$BACKEND_DIR" -type f -name "*.py" -print0 | while IFS= read -r -d '' file; do
  echo "Updating logger path in: $file"
  
  # Update the logger import path to point to "backend.fastapi.utils.logger"
  sed -i '' -e 's/backend.fastapi.logger/backend.fastapi.utils.logger/g' "$file"
  
  # Log changes for debugging
  echo "Logger path updated in: $file"
done

# Stage the modified files
echo "Staging the changes..."
git add "$BACKEND_DIR"

# Commit the changes with a message
echo "Committing the changes..."
git commit -m "Refactor: Correct logger import path to backend.fastapi.utils.logger in backend files."

echo "Logger path updated and changes committed successfully!"
