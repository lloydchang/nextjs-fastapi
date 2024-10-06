// File: app/api/search/models/modelDefinitions.ts

import type * as tf from '@tensorflow/tfjs-node';

let tfjs: typeof tf;
if (typeof window === 'undefined') {
  // Server-side
  tfjs = require('@tensorflow/tfjs-node');
} else {
  // Client-side (this branch likely won't be used in an API route)
  tfjs = require('@tensorflow/tfjs');
}

let model: tf.LayersModel | null = null;

async function loadModelInternal(modelPath: string): Promise<tf.LayersModel> {
  if (model) {
    return model;
  }
  try {
    model = await tfjs.loadLayersModel(modelPath);
    console.log('Model loaded successfully.');
  } catch (error) {
    console.error(`Error loading model: ${error}`);
    throw new Error('Failed to load model.');
  }
  return model;
}

async function loadModel(modelPath: string = 'file://models/tedx_model/model.json'): Promise<tf.LayersModel> {
  return loadModelInternal(modelPath);
}

// Example usage (uncomment to execute)
/*
loadModel().then(model => {
  console.log('Model is ready:', model);
}).catch(err => {
  console.error('Error:', err);
});
*/

module.exports = { loadModel };