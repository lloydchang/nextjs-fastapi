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
