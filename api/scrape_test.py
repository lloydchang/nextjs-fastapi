# scrape_test.py

import requests
from bs4 import BeautifulSoup

# Define the URL you want to scrape
url = "https://www.ted.com/talks/george_zaidan_how_do_gas_masks_actually_work/transcript?subtitle=en"

# Define headers to simulate a browser request
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

# Step 1: Fetch the webpage content
response = requests.get(url, headers=headers)

# Step 2: Check if the request was successful
if response.status_code == 200:
    print(f"Successfully fetched the webpage: {url}")
    
    # Step 3: Parse the HTML content using BeautifulSoup
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Step 4: Find specific elements using HTML selectors
    title_element = soup.find('h1', class_='talk-title')  # Example selector, adjust based on the target HTML structure
    transcript_element = soup.find('div', class_='talk-transcript__body')  # Modify based on actual structure

    # Step 5: Extract and print the required content
    if title_element:
        print(f"Talk Title: {title_element.get_text(strip=True)}")
    else:
        print("Title element not found")

    if transcript_element:
        print(f"Transcript: {transcript_element.get_text(strip=True)}")
    else:
        print("Transcript element not found")

else:
    print(f"Failed to retrieve the webpage. Status code: {response.status_code}")
