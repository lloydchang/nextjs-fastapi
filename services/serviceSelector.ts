// services/serviceSelector.ts

import { services } from './serviceConfig'; // Import service configurations

let roundRobinIndex = 0; // Round-robin counter

// Filter services based on valid keys
const validServices = services.filter(
  (service) => !service.apiKey || service.apiKey.trim() !== ""
);

// Function to get the next valid service
export const selectService = () => {
  if (validServices.length > 0) {
    const service = validServices[roundRobinIndex % validServices.length];
    roundRobinIndex++;
    return service;
  } else {
    throw new Error('No valid services available. Please check your configurations.');
  }
};
