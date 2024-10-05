// File: app/api/chat/handlers/index.ts

import { handleTextWithAmazonBedrockTitan } from './handleAmazonBedrockTitan';
import { handleTextWithGoogleVertexGeminiModel } from './handleGoogleVertexGemini';
import { handleTextWithOllamaGemmaModel } from './handleOllamaGemma';
import { handleTextWithOllamaLlamaModel } from './handleOllamaLlama';
import { handleTextWithAzureOpenAIO1Model } from './handleAzureOpenAIO1';
import { handleTextWithOpenAIO1Model } from './handleOpenAIO1';

export const handlers = [
  handleTextWithAmazonBedrockTitan,
  handleTextWithGoogleVertexGeminiModel,
  handleTextWithOllamaGemmaModel,
  handleTextWithOllamaLlamaModel,
  handleTextWithAzureOpenAIO1Model,
  handleTextWithOpenAIO1Model,
];
