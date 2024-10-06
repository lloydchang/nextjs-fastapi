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
