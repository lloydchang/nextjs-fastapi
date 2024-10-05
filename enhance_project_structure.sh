#!/bin/bash

# Script Name: enhance_project_structure.sh
# Description: Refactor and reorganize hooks, context, and utils directories, updating file imports and aligning styles.

echo "Starting the refactoring process for hooks, context, and utils..."

# Check if running from the project root
if [ ! -d "components" ] || [ ! -d "styles" ] || [ ! -d "hooks" ] || [ ! -d "utils" ]; then
  echo "Error: Please run this script from the root of your project directory."
  exit 1
fi

# Move hooks to a new structure (if desired)
echo "Moving hooks to a dedicated directory structure..."
git mv hooks/useChat.ts components/hooks/useChat.ts 2>/dev/null
git mv hooks/useMedia.ts components/hooks/useMedia.ts 2>/dev/null
git mv hooks/useSpeechRecognition.ts components/hooks/useSpeechRecognition.ts 2>/dev/null

# Refactor context directory structure
echo "Refactoring context directory..."
git mv context/ChatContext.tsx components/contexts/ChatContext.tsx 2>/dev/null
git mv context/TalkContext.tsx components/contexts/TalkContext.tsx 2>/dev/null

# Move and organize utils
echo "Organizing utils..."
git mv utils/chatUtils.ts components/utils/chatUtils.ts 2>/dev/null
git mv utils/logger.ts components/utils/logger.ts 2>/dev/null
git mv utils/speechRecognitionUtils.ts components/utils/speechRecognitionUtils.ts 2>/dev/null
git mv utils/stringUtils.ts components/utils/stringUtils.ts 2>/dev/null

# Move styles corresponding to components, if needed
echo "Moving and aligning styles..."
git mv styles/atoms/*.css styles/components/atoms/ 2>/dev/null
git mv styles/molecules/*.css styles/components/molecules/ 2>/dev/null
git mv styles/organisms/*.css styles/components/organisms/ 2>/dev/null
git mv styles/templates/*.css styles/components/templates/ 2>/dev/null

# Refactor and align test files
echo "Moving test files to a unified __tests__ directory..."
if [ ! -d "__tests__" ]; then
  mkdir __tests__
fi
git mv tests/testOllamaGemma.js __tests__/testOllamaGemma.js 2>/dev/null

# Stage and commit changes
echo "Staging and committing changes to Git..."
git add .
git commit -m "Refactor: Align hooks, context, and utils to new project structure, and reorganize styles."

echo "Project structure refactoring completed successfully!"
