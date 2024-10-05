#!/bin/bash

# File: rename_files.sh
# Description: Script to rename handler files to controllers and service files to clients, and update internal references.

# Define directories for controllers and clients
CONTROLLER_DIR="app/api/chat/controllers"
CLIENT_DIR="app/api/chat/clients"

# Step 1: Rename files inside the `controllers` directory
echo "Renaming handler files in the controllers directory..."
for file in "$CONTROLLER_DIR"/handle*.ts; do
  if [[ -f "$file" ]]; then
    base_name=$(basename "$file" .ts)
    # Remove "handle" prefix and add "Controller"
    new_name="${base_name#handle}Controller.ts"
    echo "Renaming: $file → $CONTROLLER_DIR/$new_name"
    mv "$file" "$CONTROLLER_DIR/$new_name"
  else
    echo "No handler files found to rename in $CONTROLLER_DIR"
  fi
done

# Step 2: Rename files inside the `clients` directory
echo "Renaming service files in the clients directory..."
for file in "$CLIENT_DIR"/serve*.ts; do
  if [[ -f "$file" ]]; then
    base_name=$(basename "$file" .ts)
    # Remove "serve" prefix and add "Client"
    new_name="${base_name#serve}Client.ts"
    echo "Renaming: $file → $CLIENT_DIR/$new_name"
    mv "$file" "$CLIENT_DIR/$new_name"
  else
    echo "No service files found to rename in $CLIENT_DIR"
  fi
done

# Step 3: Perform search and replace in relevant TypeScript and TSX files
echo "Updating internal references in TypeScript and TSX files..."
find . -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
  echo "Processing file: $file"
  # Replace handler references to controller references
  sed -i '' 's/handleAmazonBedrockTitan/AmazonBedrockController/g' "$file"
  sed -i '' 's/handleAzureOpenAIO1/AzureOpenAIController/g' "$file"
  sed -i '' 's/handleGoogleVertexGemini/GoogleVertexGeminiController/g' "$file"
  sed -i '' 's/handleOllamaGemma/OllamaGemmaController/g' "$file"
  sed -i '' 's/handleOllamaLlama/OllamaLlamaController/g' "$file"
  sed -i '' 's/handleOpenAIO1/OpenAIController/g' "$file"
  sed -i '' 's/handleRateLimit/RateLimitController/g' "$file"
  sed -i '' 's/handleResponse/ResponseController/g' "$file"

  # Replace service references to client references
  sed -i '' 's/serveAmazonBedrockTitan/AmazonBedrockClient/g' "$file"
  sed -i '' 's/serveAzureOpenAIO1/AzureOpenAIClient/g' "$file"
  sed -i '' 's/serveGoogleVertexGemini/GoogleVertexGeminiClient/g' "$file"
  sed -i '' 's/serveOllamaGemma/OllamaGemmaClient/g' "$file"
  sed -i '' 's/serveOllamaLlama/OllamaLlamaClient/g' "$file"
  sed -i '' 's/serveOpenAIO1/OpenAIClient/g' "$file"
done

# Step 4: Stage changes for git
echo "Staging changes for git..."
git add .

# Step 5: Commit the changes
echo "Committing changes..."
git commit -m "Refactor: Rename handler files to controllers and service files to clients, and update internal references."

echo "File renaming and reference update completed successfully!"
