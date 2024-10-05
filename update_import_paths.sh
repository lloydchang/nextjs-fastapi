#!/bin/bash

# Script to update import paths and header comments in the backend directory

echo "Starting the update process for import paths in backend files..."

# List of old and new paths
paths_to_update=(
    "backend.fastapi.logger backend.fastapi.utils.logger"
    "backend.fastapi.data_loader backend.fastapi.data.data_loader"
    "backend.fastapi.model backend.fastapi.models.model_definitions"
    "backend.fastapi.sdg_manager backend.fastapi.services.sdg_manager"
    "backend.fastapi.search_service backend.fastapi.services.search_service"
    "backend.fastapi.embedding_utils backend.fastapi.utils.embedding_utils"
    "backend.fastapi.sdg_utils backend.fastapi.data.sdg_utils"
    "backend.fastapi.sdg_keywords backend.fastapi.data.sdg_keywords"
    "backend.fastapi.cache_manager backend.fastapi.cache.cache_manager"
)

# Iterate through each pair of old and new paths and update them in the backend files
for path_pair in "${paths_to_update[@]}"; do
    # Extract old and new paths
    old_path=$(echo "$path_pair" | awk '{print $1}')
    new_path=$(echo "$path_pair" | awk '{print $2}')

    echo "Updating import path: $old_path to $new_path"
    # Use sed to replace old import paths with new paths in all Python files within the backend directory
    find backend -type f -name "*.py" -exec sed -i '' "s|$old_path|$new_path|g" {} +
done

echo "Updating header comments in backend files..."

# Update the header comment in each Python file to reflect the new path
find backend -type f -name "*.py" -print0 | while IFS= read -r -d '' file; do
    # Extract the relative path of the file for the new header comment
    relative_path=$(echo "$file" | sed 's|./||')
    
    # Check if the file already has a header comment and update or add it
    if grep -q "^# File:" "$file"; then
        sed -i '' "1 s|^# File: .*|# File: $relative_path|" "$file"
    else
        sed -i '' "1i\\
# File: $relative_path
" "$file"
    fi
done

echo "Staging the changes..."
# Stage all changes
git add backend

echo "Committing the changes..."
# Commit the changes with a message
git commit -m "Updated import paths and header comments in backend files."

echo "Import paths updated and changes committed successfully!"
