#!/bin/bash

# File: rename_and_refactor.sh
# Usage: bash rename_and_refactor.sh
# Description: Renames files, performs search & replace, and updates git tracking.

# Step 1: Define rename mappings for handlers to controllers
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

# Step 2: Define rename mappings for services to clients
declare -A service_to_client=(
  ["serveAmazonBedrockTitan.ts"]="AmazonBedrockClient.ts"
  ["serveAzureOpenAIO1.ts"]="AzureOpenAIClient.ts"
  ["serveGoogleVertexGemini.ts"]="GoogleVertexGeminiClient.ts"
  ["serveOllamaGemma.ts"]="OllamaGemmaClient.ts"
  ["serveOllamaLlama.ts"]="OllamaLlamaClient.ts"
  ["serveOpenAIO1.ts"]="OpenAIClient.ts"
)

# Base directories
HANDLER_DIR="app/api/chat/handlers"
SERVICE_DIR="app/api/chat/services"

# Step 3: Rename handler files to controllers
for old_name in "${!handler_to_controller[@]}"; do
  new_name=${handler_to_controller[$old_name]}
  echo "Renaming handler file: $HANDLER_DIR/$old_name to $HANDLER_DIR/$new_name"
  git mv "$HANDLER_DIR/$old_name" "$HANDLER_DIR/$new_name" 2>/dev/null || mv "$HANDLER_DIR/$old_name" "$HANDLER_DIR/$new_name"
done

# Step 4: Rename service files to clients
for old_name in "${!service_to_client[@]}"; do
  new_name=${service_to_client[$old_name]}
  echo "Renaming service file: $SERVICE_DIR/$old_name to $SERVICE_DIR/$new_name"
  git mv "$SERVICE_DIR/$old_name" "$SERVICE_DIR/$new_name" 2>/dev/null || mv "$SERVICE_DIR/$old_name" "$SERVICE_DIR/$new_name"
done

# Step 5: Perform search and replace in relevant TypeScript and JSX files
echo "Performing search and replace in all TypeScript and JSX files..."
find . -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
  for old_name in "${!handler_to_controller[@]}"; do
    new_name=${handler_to_controller[$old_name]%.ts}  # Remove ".ts" for internal references
    old_var=${old_name%.ts}                          # Remove ".ts" for old variable reference
    echo "Updating references of $old_var to $new_name in $file"
    sed -i '' "s/$old_var/$new_name/g" "$file"
  done

  for old_name in "${!service_to_client[@]}"; do
    new_name=${service_to_client[$old_name]%.ts}  # Remove ".ts" for internal references
    old_var=${old_name%.ts}                       # Remove ".ts" for old variable reference
    echo "Updating references of $old_var to $new_name in $file"
    sed -i '' "s/$old_var/$new_name/g" "$file"
  done
done

# Step 6: Stage changes for git
echo "Staging changes for git..."
git add .

# Step 7: Commit the changes
echo "Committing changes..."
git commit -m "Refactor: Rename handlers to controllers and services to clients, and update references"

echo "Refactor completed successfully!"
