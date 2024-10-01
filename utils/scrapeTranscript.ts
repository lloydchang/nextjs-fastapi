// utils/scrapeTranscript.ts

export const scrapeTranscript = async (url: string): Promise<string> => {
    const transcriptUrl = `${url}/transcript?subtitle=en`;
  
    // Construct the equivalent curl command
    const curlCommand = `curl -H "User-Agent: curl/7.68.0" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" -H "Accept-Language: en-US,en;q=0.5" -H "Referer: https://www.ted.com/" -H "Connection: keep-alive" -H "DNT: 1" "${transcriptUrl}"`;
  
    try {
      const headers = {
        'User-Agent': 'curl/7.68.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.ted.com/',
        'Connection': 'keep-alive',
        'DNT': '1'
      };
  
      const response = await fetch(transcriptUrl, { headers, method: 'GET' });
  
      // Log HTTP response status and curl command
      console.log(`HTTP Response Status: ${response.status}`);
      console.log('HTTP Response Headers:', JSON.stringify([...response.headers]));
      console.log('Equivalent curl command:', curlCommand); // Log the curl command
  
      if (!response.ok) {
        const errorResponseBody = await response.text();
        console.error(`Failed to fetch transcript. Status: ${response.status} - ${response.statusText}`);
        console.error('Response Body:', errorResponseBody);
        throw new Error(`Failed to fetch transcript from ${transcriptUrl}`);
      }
  
      const responseText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(responseText, 'text/html');
      const transcriptElement = doc.querySelector('.Grid__cell.flx-s:1') || doc.querySelector('.talk-transcript__paragraph');
  
      if (!transcriptElement) {
        throw new Error('Transcript element not found in the HTML.');
      }
  
      return transcriptElement.textContent || 'No transcript available.';
    } catch (error) {
      console.error(`Error while scraping transcript: ${error.message}`);
      throw error; // Re-throw the error for further handling
    }
  };
  