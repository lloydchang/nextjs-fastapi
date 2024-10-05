#!/bin/bash

# Script Name: final_refactor.sh
# Description: Finalize project directory structure, move remaining files, update references, and clean up empty directories.
# Ensure you have a clean git status before running this.

echo "Starting final project structure alignment..."

# Move hooks and context into a shared directory
mkdir -p components/state/hooks components/state/context
git mv hooks/useChat.ts components/state/hooks/useChat.ts 2>/dev/null
git mv hooks/useMedia.ts components/state/hooks/useMedia.ts 2>/dev/null
git mv hooks/useSpeechRecognition.ts components/state/hooks/useSpeechRecognition.ts 2>/dev/null
git mv context/ChatContext.tsx components/state/context/ChatContext.tsx 2>/dev/null
git mv context/TalkContext.tsx components/state/context/TalkContext.tsx 2>/dev/null

# Move utils to shared/utils directory
mkdir -p shared/utils
git mv utils/*.ts shared/utils/ 2>/dev/null

# Create a unified __tests__ directory
mkdir -p __tests__/components
git mv tests/testOllamaGemma.js __tests__/components/testOllamaGemma.js 2>/dev/null

# Align styles directory to reflect new structure
mkdir -p styles/components
git mv styles/atoms styles/components/atoms 2>/dev/null
git mv styles/molecules styles/components/molecules 2>/dev/null
git mv styles/organisms styles/components/organisms 2>/dev/null
git mv styles/pages styles/components/pages 2>/dev/null
git mv styles/templates styles/components/templates 2>/dev/null

# Remove empty directories from components, context, and hooks
echo "Removing empty directories..."
find . -type d -empty -exec git rm -r {} + 2>/dev/null

# Commit the changes to git
echo "Staging changes to Git..."
git add .
echo "Committing changes..."
git commit -m "Refactor: Final project structure alignment, component reorganization, and empty directory cleanup"

echo "Final project structure refactoring and cleanup completed successfully!"
