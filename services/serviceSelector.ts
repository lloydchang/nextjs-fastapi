// services/serviceSelector.ts

import { services } from './serviceConfig'; // Import service configurations

let roundRobinIndex = 0; // Round-robin counter

// Log that the service selector is loaded
console.log("Service Selector Loaded");

// Shared error message for service availability
const noValidServiceErrorMessage = 'No valid services available. Please check your configurations in .env.local and View > Developer > JavaScript Console.';

// Filter services based on valid keys and exclude keys starting with 'your_'
const validServices = services.filter((service) => {
  const apiKey = service.apiKey;
  const url = service.url; // Assume you have a 'url' property in your service object

  // Check if the API key is valid and URL is defined
  const isValid = apiKey && !apiKey.startsWith('your_') && url && !url.startsWith('your_');

  // Log attempts to filter services
  console.log(`Examining service: ${service.model}`);
  console.log(`API Key valid: ${isValid ? 'Yes' : 'No'}`);
  console.log(`URL valid: ${url ? 'Yes' : 'No'}`);

  if (!isValid) {
    console.log(`Service ${service.model} excluded due to invalid API Key or URL.`);
  }
  
  return isValid;
});

// Log the number of valid services found
console.log(`Number of valid services: ${validServices.length}`);

if (validServices.length === 0) {
  console.error(noValidServiceErrorMessage);
} else {
  // Log all valid services
  console.log('Valid services available for selection:');
  validServices.forEach(service => {
    console.log(`- ${service.model} at ${service.url}`);
  });
}

// Function to get the next valid service
export const selectService = () => {
  if (validServices.length > 0) {
    const service = validServices[roundRobinIndex % validServices.length];

    // Log the selected service details
    console.log(`Selected service: ${service.model}`);
    console.log(`Service URL: ${service.url}`);
    
    roundRobinIndex++;
    return service;
  } else {
    throw new Error(noValidServiceErrorMessage);
  }
};
