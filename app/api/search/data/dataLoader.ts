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
