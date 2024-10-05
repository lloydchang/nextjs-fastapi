// File: testOllamaGemma.js

const fetch = require('node-fetch');

async function testOllamaGemma() {
  const endpoint = 'http://localhost:11434/api/generate';
  const body = JSON.stringify({
    prompt: 'Hello, world!',
    model: 'gemma2:2b'
  });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      console.error('Response text:', text);
      return;
    }

    // Instead of using getReader, simply get the response text
    const responseText = await response.text();
    console.log('Response:', responseText);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testOllamaGemma();
