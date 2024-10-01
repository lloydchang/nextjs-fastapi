# scrape_with_requests.py

import requests

# Define the URL to fetch
url = "https://www.ted.com/talks/george_zaidan_how_do_gas_masks_actually_work/transcript?subtitle=en"

# Set headers to replicate the `curl` command's headers
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.ted.com/',
    'Connection': 'keep-alive',
}

# Make a GET request similar to `curl -X GET <URL>`
response = requests.get(url, headers=headers)

# Print response headers and status code
print(f"Status Code: {response.status_code}")
print(f"Response Headers: {response.headers}")

# Print the raw content (equivalent to `curl` printing the response body)
print("Raw Response Content:\n")
print(response.text)
