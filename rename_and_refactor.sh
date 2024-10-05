#!/bin/bash

# File: rename_and_refactor.sh
# Description: Rename handlers to controllers and services to clients, update internal references, and handle git operations.

# Set base directories for handlers and services
HANDLER_DIR="app/api/chat/handlers"
SERVICE_DIR="app/api/chat/services"
SCRIPT_NAME="rename_and_refactor.sh"

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

# Step 3: Rename handler files to controllers
for old_name in "${!handler_to_controller[@]}"; do
  new_name=${handler_to_controller[$old_name]}
  old_path="$HANDLER_DIR/$old_name"
  new_path="$HANDLER_DIR/$new_name"

  # Check if the old file exists before renaming
  if [[ -f "$old_path" ]]; then
    echo "Renaming handler file: $old_path to $new_path"
    git mv "$old_path" "$new_path" 2>/dev/null || mv "$old_path" "$new_path"
  else
    echo "Warning: $old_path not found. Skipping."
  fi
done

# Step 4: Rename service files to clients
for old_name in "${!service_to_client[@]}"; do
  new_name=${service_to_client[$old_name]}
  old_path="$SERVICE_DIR/$old_name"
  new_path="$SERVICE_DIR/$new_name"

  # Check if the old file exists before renaming
  if [[ -f "$old_path" ]]; then
    echo "Renaming service file: $old_path to $new_path"
    git mv "$old_path" "$new_path" 2>/dev/null || mv "$old_path" "$new_path"
  else
    echo "Warning: $old_path not found. Skipping."
  fi
done

# Step 5: Perform search and replace in relevant TypeScript and JSX files
echo "Performing search and replace in all TypeScript and JSX files..."
find . -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
  # Skip the script file itself to prevent unintended changes
  if [[ "$file" == *"$SCRIPT_NAME" ]]; then
    continue
  fi

  echo "Processing file: $file"

  # Replace handler references
  for old_name in "${!handler_to_controller[@]}"; do
    old_var=${old_name%.ts}                          # Remove ".ts" for old variable reference
    new_var=${handler_to_controller[$old_name]%.ts}  # Remove ".ts" for new variable reference
    sed -i '' "s/$old_var/$new_var/g" "$file"
  done

  # Replace service references
  for old_name in "${!service_to_client[@]}"; do
    old_var=${old_name%.ts}                          # Remove ".ts" for old variable reference
    new_var=${service_to_client[$old_name]%.ts}      # Remove ".ts" for new variable reference
    sed -i '' "s/$old_var/$new_var/g" "$file"
  done
done

# Step 6: Stage changes for git, excluding the script file itself
echo "Staging changes for git..."
git add . ":!$SCRIPT_NAME"

# Step 7: Commit the changes
echo "Committing changes..."
git commit -m "Refactor: Rename handlers to controllers and services to clients, and update references"

echo "Refactor completed successfully!"
