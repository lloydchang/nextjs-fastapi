#!/bin/bash

# Script: refactor_project_structure.sh
# Purpose: Reorganize project structure using Atomic Design principles, update import paths, and commit changes to Git.

# Check if the script is run from the root directory
if [ ! -d "components" ]; then
  echo "Error: This script must be run from the project root directory."
  exit 1
fi

echo "Starting project refactor based on Atomic Design principles..."

# Step 1: Create directories based on Atomic Design structure
echo "Creating Atomic Design directories inside components..."
mkdir -p components/atoms components/molecules components/organisms components/templates components/pages

# Step 2: Move files into corresponding directories using git mv
echo "Moving components into atomic structure directories..."

# Move atoms
git mv components/ActionButton.tsx components/atoms/ 2>/dev/null
git mv components/ChatInput.tsx components/atoms/ 2>/dev/null
git mv components/ChatMessage.tsx components/atoms/ 2>/dev/null

# Move molecules
git mv components/SearchBar.tsx components/molecules/ 2>/dev/null
git mv components/ChatMessages.tsx components/molecules/ 2>/dev/null

# Move organisms
git mv components/VideoStream.tsx components/organisms/ 2>/dev/null
git mv components/LeftPanel.tsx components/organisms/ 2>/dev/null
git mv components/RightPanel.tsx components/organisms/ 2>/dev/null
git mv components/ControlButtons.tsx components/organisms/ 2>/dev/null
git mv components/DebugPanel.tsx components/organisms/ 2>/dev/null
git mv components/MiddlePanel.tsx components/organisms/ 2>/dev/null

# Move templates
git mv components/ProjectPlan.tsx components/templates/ 2>/dev/null

# Move page-level components
git mv components/VideoPlayer.tsx components/pages/ 2>/dev/null
git mv components/Greeting.tsx components/pages/ 2>/dev/null

echo "Component reorganization complete."

# Step 3: Update import paths in all TypeScript and TypeScript React files
echo "Updating import paths in all TypeScript (.ts and .tsx) files..."
find . -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
  # Update import paths for atoms
  sed -i '' 's#components/ActionButton#components/atoms/ActionButton#g' "$file"
  sed -i '' 's#components/ChatInput#components/atoms/ChatInput#g' "$file"
  sed -i '' 's#components/ChatMessage#components/atoms/ChatMessage#g' "$file"
  
  # Update import paths for molecules
  sed -i '' 's#components/SearchBar#components/molecules/SearchBar#g' "$file"
  sed -i '' 's#components/ChatMessages#components/molecules/ChatMessages#g' "$file"

  # Update import paths for organisms
  sed -i '' 's#components/VideoStream#components/organisms/VideoStream#g' "$file"
  sed -i '' 's#components/LeftPanel#components/organisms/LeftPanel#g' "$file"
  sed -i '' 's#components/RightPanel#components/organisms/RightPanel#g' "$file"
  sed -i '' 's#components/ControlButtons#components/organisms/ControlButtons#g' "$file"
  sed -i '' 's#components/DebugPanel#components/organisms/DebugPanel#g' "$file"
  sed -i '' 's#components/MiddlePanel#components/organisms/MiddlePanel#g' "$file"
  
  # Update import paths for templates
  sed -i '' 's#components/ProjectPlan#components/templates/ProjectPlan#g' "$file"

  # Update import paths for pages
  sed -i '' 's#components/VideoPlayer#components/pages/VideoPlayer#g' "$file"
  sed -i '' 's#components/Greeting#components/pages/Greeting#g' "$file"
done

echo "Import paths update complete."

# Step 4: Move styles based on Atomic Design structure if styles are component-specific
echo "Reorganizing styles directory to match components..."
mkdir -p styles/atoms styles/molecules styles/organisms styles/templates styles/pages

# Move styles to corresponding directories
git mv styles/ActionButton.module.css styles/atoms/ 2>/dev/null
git mv styles/ChatInput.module.css styles/atoms/ 2>/dev/null
git mv styles/ChatMessage.module.css styles/atoms/ 2>/dev/null

git mv styles/SearchBar.module.css styles/molecules/ 2>/dev/null
git mv styles/ChatMessages.module.css styles/molecules/ 2>/dev/null

git mv styles/VideoStream.module.css styles/organisms/ 2>/dev/null
git mv styles/LeftPanel.module.css styles/organisms/ 2>/dev/null
git mv styles/RightPanel.module.css styles/organisms/ 2>/dev/null
git mv styles/ControlButtons.module.css styles/organisms/ 2>/dev/null
git mv styles/DebugPanel.module.css styles/organisms/ 2>/dev/null
git mv styles/MiddlePanel.module.css styles/organisms/ 2>/dev/null

git mv styles/ProjectPlan.module.css styles/templates/ 2>/dev/null

echo "Styles reorganization complete."

# Step 5: Git operations - stage and commit changes
echo "Staging changes in Git..."
git add .

echo "Creating a commit..."
git commit -m "Refactor: Reorganize project structure based on Atomic Design principles"

echo "Project refactor and Git commit completed successfully!"
