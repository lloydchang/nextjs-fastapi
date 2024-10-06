// File: app/api/search/services/searchService.ts

import { loadModel } from '../models/modelDefinitions';
import { loadData } from '../data/dataLoader';
import { getCachedData, setCachedData } from '../cache/cacheManager';

let model: any = null;
let data: any[] | null = null;

// Cosine Similarity Function
function cosineSimilarity(a: any, b: any): number {
  return a.dot(b).div(a.norm().mul(b.norm())).arraySync();
}

// Initialize function to load model and data
async function initialize() {
  if (!model) {
    console.log('Loading model...');
    model = await loadModel();
    console.log('Model loaded successfully');
  }
  if (!data) {
    console.log('Loading data...');
    data = await loadData();
    console.log('Data loaded successfully');
  }
}

// Semantic Search Function
export async function semanticSearch(query: string): Promise<any[]> {
  await initialize();

  if (!model || !data) {
    console.error('Model or data not initialized');
    throw new Error('Search service not initialized properly');
  }

  const cacheKey = `search_${query}`;
  const cachedResults = await getCachedData(cacheKey);
  if (cachedResults) {
    console.log('Returning cached results');
    return cachedResults;
  }

  console.log('Performing semantic search');
  
  try {
    // Convert query to a vector representation using the model
    const queryVector = model.encode(query);

    const results = await Promise.all(data.map(async (entry) => {
      const descriptionVector = entry.description_vector;
      const similarity = cosineSimilarity(queryVector, descriptionVector);
      return { ...entry, similarity };
    }));

    // Sort results by similarity
    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, 10); // Return top 10 results

    // Cache the results
    await setCachedData(cacheKey, topResults);

    return topResults;
  } catch (error) {
    console.error('Error in semantic search:', error);
    throw error;
  }
}
