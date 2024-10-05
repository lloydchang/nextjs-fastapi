#!/bin/bash

# File: refactor_project.sh
# Usage: bash refactor_project.sh
# Description: Renames files, performs search & replace, and updates git tracking.

# Step 1: Define directories and files to be renamed
declare -A rename_map=(
  # Key: Original path, Value: New path
  ["app/api/chat/handlers"]="app/api/chat/controllers"
  ["app/api/chat/services"]="app/api/chat/clients"
  ["python"]="backend/fastapi"
)

# Step 2: Rename directories and files using mv and git mv
for src in "${!rename_map[@]}"; do
  dest=${rename_map[$src]}

  # If the source is tracked by git, use git mv, else use mv
  if [[ -d "$src" || -f "$src" ]]; then
    echo "Renaming $src to $dest"
    git mv "$src" "$dest" 2>/dev/null || mv "$src" "$dest"
  fi
done

# Step 3: Search and replace strings in all relevant files
# Example: replace "handlers" with "controllers" in TypeScript files
find . -type f -name "*.ts" -o -name "*.tsx" | while read -r file; do
  echo "Processing $file"
  sed -i '' 's/handlers/controllers/g' "$file"
  sed -i '' 's/services/clients/g' "$file"
  sed -i '' 's/python/backend\/fastapi/g' "$file"
done

# Step 4: Add changes to git
echo "Staging changes for git..."
git add .

# Step 5: Commit changes
echo "Committing changes..."
git commit -m "Refactor: Renamed directories and updated references"

echo "Refactor completed successfully!"
