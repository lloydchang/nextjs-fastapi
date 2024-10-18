// File: store/modelService.ts

import * as tf from '@tensorflow/tfjs';

let loadedModel: tf.LayersModel | null = null;

// Function to load the TensorFlow.js model (singleton)
export async function loadModel(): Promise<tf.LayersModel> {
  if (loadedModel) {
    console.debug('Using already loaded TensorFlow.js model.');
    return loadedModel;
  }

  console.debug('Loading TensorFlow.js model...');
  try {
    loadedModel = await tf.loadLayersModel('/models/my-model/model.json');
    console.debug('TensorFlow.js model loaded successfully.');
    return loadedModel;
  } catch (error) {
    console.error('Error loading TensorFlow.js model:', error);
    throw new Error('Failed to load TensorFlow.js model.');
  }
}

// Function to run prediction using the TensorFlow.js model
export async function runModelPrediction(input: string): Promise<string> {
  try {
    const model = await loadModel();

    // Example preprocessing: Convert input string to character codes
    const inputTensor = tf.tensor([input.split('').map((char) => char.charCodeAt(0))]);

    // Run prediction
    const prediction = model.predict(inputTensor) as tf.Tensor;

    // Example postprocessing: Assume scalar output
    const result = prediction.dataSync()[0];

    console.debug('TensorFlow.js Prediction Result:', result);

    // Convert prediction to a meaningful response
    return result > 0.5 ? 'Positive response from TensorFlow.js model.' : 'Negative response from TensorFlow.js model.';
  } catch (error) {
    console.error('Error during TensorFlow.js prediction:', error);
    throw new Error('TensorFlow.js prediction failed.');
  }
}
