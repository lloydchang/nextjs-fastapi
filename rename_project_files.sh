#!/bin/bash

# File: rename_project_files.sh
# Description: Renames handlers to controllers and services to clients, updates file names, and adjusts internal references.

# Define directories for renaming
HANDLER_DIR="app/api/chat/handlers"
SERVICE_DIR="app/api/chat/services"
CONTROLLER_DIR="app/api/chat/controllers"
CLIENT_DIR="app/api/chat/clients"

# Step 1: Rename directories
echo "Renaming directories..."
mv "$HANDLER_DIR" "$CONTROLLER_DIR"
mv "$SERVICE_DIR" "$CLIENT_DIR"

# Step 2: Define file renaming patterns for controllers and clients
declare -A handler_to_controller=(
  ["handleAmazonBedrockTitan.ts"]="AmazonBedrockController.ts"
  ["handleAzureOpenAIO1.ts"]="AzureOpenAIController.ts"
  ["handleGoogleVertexGemini.ts"]="GoogleVertexGeminiController.ts"
  ["handleOllamaGemma.ts"]="OllamaGemmaController.ts"
  ["handleOllamaLlama.ts"]="OllamaLlamaController.ts"
  ["handleOpenAIO1.ts"]="OpenAIController.ts"
  ["handleRateLimit.ts"]="RateLimitController.ts"
  ["handleResponse.ts"]="ResponseController.ts"
)

declare -A service_to_client=(
  ["serveAmazonBedrockTitan.ts"]="AmazonBedrockClient.ts"
  ["serveAzureOpenAIO1.ts"]="AzureOpenAIClient.ts"
  ["serveGoogleVertexGemini.ts"]="GoogleVertexGeminiClient.ts"
  ["serveOllamaGemma.ts"]="OllamaGemmaClient.ts"
  ["serveOllamaLlama.ts"]="OllamaLlamaClient.ts"
  ["serveOpenAIO1.ts"]="OpenAIClient.ts"
)

# Step 3: Rename files inside the new controllers directory
echo "Renaming controller files..."
for old_name in "${!handler_to_controller[@]}"; do
  old_path="$CONTROLLER_DIR/$old_name"
  new_name="${handler_to_controller[$old_name]}"
  new_path="$CONTROLLER_DIR/$new_name"

  if [[ -f "$old_path" ]]; then
    echo "Renaming: $old_path → $new_path"
    mv "$old_path" "$new_path"
  else
    echo "File not found: $old_path"
  fi
done

# Step 4: Rename files inside the new clients directory
echo "Renaming client files..."
for old_name in "${!service_to_client[@]}"; do
  old_path="$CLIENT_DIR/$old_name"
  new_name="${service_to_client[$old_name]}"
  new_path="$CLIENT_DIR/$new_name"

  if [[ -f "$old_path" ]]; then
    echo "Renaming: $old_path → $new_path"
    mv "$old_path" "$new_path"
  else
    echo "File not found: $old_path"
  fi
done

# Step 5: Perform search and replace in TypeScript and TSX files
echo "Updating internal references in TypeScript and TSX files..."
find . -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
  echo "Processing file: $file"

  # Update handler references to controllers
  for old_name in "${!handler_to_controller[@]}"; do
    old_var=${old_name%.ts}
    new_var=${handler_to_controller[$old_name]%.ts}
    sed -i '' "s/$old_var/$new_var/g" "$file"
  done

  # Update service references to clients
  for old_name in "${!service_to_client[@]}"; do
    old_var=${old_name%.ts}
    new_var=${service_to_client[$old_name]%.ts}
    sed -i '' "s/$old_var/$new_var/g" "$file"
  done
done

# Step 6: Stage changes in git
echo "Staging changes..."
git add .

# Step 7: Commit changes
echo "Committing changes..."
git commit -m "Refactor: Rename handlers to controllers and services to clients, and update internal references."

echo "Refactor completed successfully!"
