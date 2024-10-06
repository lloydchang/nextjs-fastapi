// File: app/api/search/cache/cacheManager.ts

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const CACHE_DIRECTORY = './app/api/search/cache';
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Ensure the cache directory exists
export function ensureCacheDirectoryExists(): void {
  if (!fs.existsSync(CACHE_DIRECTORY)) {
    fs.mkdirSync(CACHE_DIRECTORY, { recursive: true });
    console.log(`Cache directory created at ${CACHE_DIRECTORY}.`);
  }
}

// Load data from cache
export async function loadCache<T>(cacheFilePath: string): Promise<T | null> {
  ensureCacheDirectoryExists();
  const fullPath = path.resolve(CACHE_DIRECTORY, cacheFilePath);

  if (fs.existsSync(fullPath)) {
    try {
      const data = await readFile(fullPath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Error loading cache from ${fullPath}: ${error}`);
      return null;
    }
  } else {
    return null;
  }
}

// Save data to cache
export async function saveCache<T>(data: T, cacheFilePath: string): Promise<void> {
  ensureCacheDirectoryExists();
  const fullPath = path.resolve(CACHE_DIRECTORY, cacheFilePath);
  try {
    await writeFile(fullPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Data cached successfully at ${fullPath}.`);
  } catch (error) {
    console.error(`Error saving cache to ${fullPath}: ${error}`);
  }
}

// Load cached data
export async function getCachedData(key: string): Promise<any> {
  const cacheFilePath = `${key}.json`; // Define how to derive the cache file name
  return await loadCache(cacheFilePath);
}

// Save cached data
export async function setCachedData(key: string, value: any): Promise<void> {
  const cacheFilePath = `${key}.json`; // Define how to derive the cache file name
  await saveCache(value, cacheFilePath);
}
// File: app/api/search/utils/logger.ts

import pino from 'pino';

export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

logger.info('Logger initialized.');
// File: app/api/search/models/modelDefinitions.ts

let tf;
try {
  if (typeof window === 'undefined') {
    // Server-side
    tf = require('@tensorflow/tfjs-node');
  } else {
    // Client-side
    tf = require('@tensorflow/tfjs');
  }
} catch (error) {
  console.error(`Error loading TensorFlow: ${error}`);
}

let model: tf.LayersModel | null = null;

export async function loadModel(modelPath: string = 'file://models/tedx_model/model.json'): Promise<tf.LayersModel> {
  if (model) {
    return model;
  }
  try {
    model = await tf.loadLayersModel(modelPath);
    console.log('Model loaded successfully.');
  } catch (error) {
    console.error(`Error loading model: ${error}`);
    throw new Error('Failed to load model.');
  }
  return model;
}
// File: app/api/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { semanticSearch } from './services/searchService';
import { loadDataset } from './data/dataLoader';
import path from 'path';

const filePath = path.join(process.cwd(), 'backend/fastapi/data/github-mauropelucchi-tedx_dataset-update_2024-details.csv');
const cacheFilePath = 'tedx_dataset.json';
let data: any[] = [];

// Function to load resources
async function initializeResources() {
  data = await loadDataset(filePath, cacheFilePath);
  console.log('Data loaded and resources initialized.');
}

// Initialize resources on startup
initializeResources();

export async function GET(request: NextRequest) {
  const query = new URL(request.url).searchParams.get('query');
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' });
  }

  const results = await semanticSearch(query, data);
  return NextResponse.json({ message: 'Search completed', results });
}
// File: app/api/search/data/dataLoader.ts

import { loadCache, saveCache } from '../cache/cacheManager';
import { parse } from 'csv-parse/sync';
import fs from 'fs/promises';

type TEDxTalk = {
  slug: string;
  description: string;
  presenterDisplayName: string;
  sdg_tags?: string[];
  description_vector?: number[];
};

export async function loadData(): Promise<TEDxTalk[]> {
  // Placeholder for your actual data loading logic
  const data: TEDxTalk[] = []; // Replace this with your actual data loading logic
  return data;
}

export async function loadDataset(filePath: string, cacheFilePath: string): Promise<TEDxTalk[]> {
  console.log('Loading the TEDx dataset with caching.');
  let data: TEDxTalk[] | null = await loadCache<TEDxTalk[]>(cacheFilePath);

  if (data) {
    console.log('Dataset loaded from cache.');
  } else {
    console.log('Loading dataset from CSV file.');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    data = parse(fileContent, { columns: true }) as TEDxTalk[];
    
    // Save parsed data to cache
    await saveCache(data, cacheFilePath);
    console.log(`Dataset parsed and cached at ${cacheFilePath}.`);
  }
  return data;
}
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
