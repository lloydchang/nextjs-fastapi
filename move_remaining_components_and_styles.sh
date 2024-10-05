#!/bin/bash

# Script Name: move_remaining_components_and_styles.sh
# Description: Move remaining uncategorized components and their styles to the appropriate directories in the Atomic Design structure.

echo "Starting component and style reorganization..."

# Ensure the script is being run from the project root
if [ ! -d "components" ] || [ ! -d "styles" ]; then
  echo "Error: Please run this script from the root of your project directory."
  exit 1
fi

# Move ErrorBoundary component and its CSS
echo "Moving ErrorBoundary.tsx and its CSS..."
git mv components/ErrorBoundary.tsx components/organisms/ 2>/dev/null
git mv styles/ErrorBoundary.module.css styles/organisms/ErrorBoundary.module.css 2>/dev/null

# Move ResultsList component and its CSS
echo "Moving ResultsList.tsx and its CSS..."
git mv components/ResultsList.tsx components/molecules/ 2>/dev/null
git mv styles/ResultsList.module.css styles/molecules/ResultsList.module.css 2>/dev/null

# Move TestSpeechRecognition component and its CSS
echo "Moving TestSpeechRecognition.tsx and its CSS..."
git mv components/TestSpeechRecognition.tsx components/organisms/ 2>/dev/null
git mv styles/atoms/TestSpeechRecognition.module.css styles/organisms/TestSpeechRecognition.module.css 2>/dev/null

# Stage and commit changes
echo "Staging and committing changes to Git..."
git add .
git commit -m "Refactor: Move remaining components and their styles to appropriate Atomic Design categories."

echo "Reorganization of remaining components and styles completed successfully!"
what 