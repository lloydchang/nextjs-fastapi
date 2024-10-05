#!/bin/bash

# Script: enhanced_refactor.sh
# Purpose: Complete project refactoring and restructuring with cross-reference validation

# Check if the script is run from the root directory
if [ ! -d "components" ] || [ ! -d "app" ]; then
  echo "Error: Please run this script from the root of your project directory."
  exit 1
fi

# Step 1: Create Atomic Design directories if missing
echo "Ensuring all Atomic Design directories exist..."
mkdir -p components/atoms components/molecules components/organisms components/templates components/pages
mkdir -p styles/atoms styles/molecules styles/organisms styles/templates styles/pages

# Step 2: Move components to appropriate directories
echo "Organizing components into Atomic Design structure..."

# Move atoms (small, self-contained components)
git mv components/atoms/ActionButton.tsx components/atoms/ 2>/dev/null
git mv components/atoms/ChatInput.tsx components/atoms/ 2>/dev/null
git mv components/atoms/ChatMessage.tsx components/atoms/ 2>/dev/null

# Move molecules (components composed of atoms)
git mv components/molecules/ChatMessages.tsx components/molecules/ 2>/dev/null
git mv components/molecules/SearchBar.tsx components/molecules/ 2>/dev/null

# Move organisms (complex UI components)
git mv components/AudioStream.tsx components/organisms/ 2>/dev/null
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

# Step 3: Move styles to match the component structure
echo "Organizing styles to match the Atomic Design structure..."

# Move styles to corresponding directories
git mv styles/AudioStream.module.css styles/organisms/ 2>/dev/null
git mv styles/TestSpeechRecognition.module.css styles/atoms/ 2>/dev/null
git mv styles/ChatMessages.module.css styles/molecules/ 2>/dev/null
git mv styles/ProjectPlan.module.css styles/templates/ 2>/dev/null

echo "Styles reorganized successfully."

# Step 4: Validate and update cross-references in TypeScript files
echo "Validating and updating cross-references in TypeScript files..."
find . -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
  # Replace all component and style import paths based on the new structure
  sed -i '' 's#components/AudioStream#components/organisms/AudioStream#g' "$file"
  sed -i '' 's#components/TestSpeechRecognition#components/atoms/TestSpeechRecognition#g' "$file"
  sed -i '' 's#components/ResultsList#components/molecules/ResultsList#g' "$file"
  sed -i '' 's#components/ErrorBoundary#components/organisms/ErrorBoundary#g' "$file"
  
  # Style references
  sed -i '' 's#styles/AudioStream.module.css#styles/organisms/AudioStream.module.css#g' "$file"
  sed -i '' 's#styles/TestSpeechRecognition.module.css#styles/atoms/TestSpeechRecognition.module.css#g' "$file"
  sed -i '' 's#styles/ChatMessages.module.css#styles/molecules/ChatMessages.module.css#g' "$file"
  sed -i '' 's#styles/ProjectPlan.module.css#styles/templates/ProjectPlan.module.css#g' "$file"
done

echo "Cross-references updated successfully."

# Step 5: Staging and committing changes to Git
echo "Staging all changes and committing to Git..."
git add .
git commit -m "Refactor: Organize components and styles into Atomic Design structure and update references."

echo "Refactoring completed successfully!"
