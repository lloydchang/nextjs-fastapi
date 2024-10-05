#!/bin/bash

# Script: complete_refactor.sh
# Purpose: Completes the refactoring and restructuring of the project, handles remaining files, and commits changes to Git.

# Check if the script is run from the root directory
if [ ! -d "components" ] || [ ! -d "app" ]; then
  echo "Error: Please run this script from the root of your project directory."
  exit 1
fi

# Step 1: Create Atomic Design directories if missing
echo "Ensuring all Atomic Design directories exist..."
mkdir -p components/atoms components/molecules components/organisms components/templates components/pages

# Step 2: Move components to appropriate directories
echo "Organizing components into Atomic Design structure..."

# Move atoms (small, self-contained components)
git mv components/atoms/ActionButton.tsx components/atoms/ 2>/dev/null
git mv components/atoms/ChatInput.tsx components/atoms/ 2>/dev/null
git mv components/atoms/ChatMessage.tsx components/atoms/ 2>/dev/null

# Move molecules (components composed of atoms)
git mv components/molecules/ChatMessages.tsx components/molecules/ 2>/dev/null
git mv components/molecules/SearchBar.tsx components/molecules/ 2>/dev/null

# Move `AudioStream` to organisms
git mv components/AudioStream.tsx components/organisms/ 2>/dev/null

# Move organisms (complex UI components)
git mv components/organisms/ControlButtons.tsx components/organisms/ 2>/dev/null
git mv components/organisms/DebugPanel.tsx components/organisms/ 2>/dev/null
git mv components/organisms/LeftPanel.tsx components/organisms/ 2>/dev/null
git mv components/organisms/MiddlePanel.tsx components/organisms/ 2>/dev/null
git mv components/organisms/RightPanel.tsx components/organisms/ 2>/dev/null
git mv components/organisms/VideoStream.tsx components/organisms/ 2>/dev/null

# Move remaining `pages` components
git mv components/Greeting.tsx components/pages/ 2>/dev/null
git mv components/VideoPlayer.tsx components/pages/ 2>/dev/null

echo "Components organized successfully."

# Step 3: Reorganize styles directory to match Atomic Design components
echo "Ensuring styles match the Atomic Design components..."
mkdir -p styles/atoms styles/molecules styles/organisms styles/templates styles/pages

# Move style files using git mv
git mv styles/AudioStream.module.css styles/organisms/ 2>/dev/null
git mv styles/TestSpeechRecognition.module.css styles/atoms/ 2>/dev/null
git mv styles/ChatMessages.module.css styles/molecules/ 2>/dev/null
git mv styles/ProjectPlan.module.css styles/templates/ 2>/dev/null

echo "Styles reorganized successfully."

# Step 4: Refactor the Python backend structure
echo "Ensuring backend structure under backend/fastapi..."
mkdir -p backend/fastapi/api backend/fastapi/cache backend/fastapi/data backend/fastapi/models backend/fastapi/services backend/fastapi/utils

# Move any loose files in the python directory
git mv python/api backend/fastapi/api 2>/dev/null
git mv python/cache backend/fastapi/cache 2>/dev/null
git mv python/data backend/fastapi/data 2>/dev/null
git mv python/models backend/fastapi/models 2>/dev/null
git mv python/services backend/fastapi/services 2>/dev/null
git mv python/utils backend/fastapi/utils 2>/dev/null
git mv python/pytest.ini backend/fastapi/ 2>/dev/null

# Remove empty python directory if exists
rmdir python 2>/dev/null

echo "Backend structure refactored successfully."

# Step 5: Update import paths in all TypeScript and TypeScript React files
echo "Updating import paths in TypeScript (.ts and .tsx) files..."
find . -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
  sed -i '' 's#components/AudioStream#components/organisms/AudioStream#g' "$file"
  sed -i '' 's#components/TestSpeechRecognition#components/atoms/TestSpeechRecognition#g' "$file"
  sed -i '' 's#components/ResultsList#components/molecules/ResultsList#g' "$file"
  sed -i '' 's#components/ErrorBoundary#components/organisms/ErrorBoundary#g' "$file"
  sed -i '' 's#styles/ChatMessages.module.css#styles/molecules/ChatMessages.module.css#g' "$file"
  sed -i '' 's#styles/AudioStream.module.css#styles/organisms/AudioStream.module.css#g' "$file"
  sed -i '' 's#styles/TestSpeechRecognition.module.css#styles/atoms/TestSpeechRecognition.module.css#g' "$file"
done

# Step 6: Add and commit changes to Git
echo "Staging all changes and committing to Git..."
git add .
git commit -m "Refactor: Move AudioStream to organisms and update references, adjust other components."

echo "Refactoring completed successfully!"
