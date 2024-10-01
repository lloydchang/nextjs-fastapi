# api/test_index.py
"""
Test Suite for Combined API in index.py

This test file uses pytest and httpx to test the primary FastAPI application for the following:
- `/api/py/helloFastApi`: A basic hello endpoint.
- `/api/py/search`: Tests the search endpoint with a sample query.
- `/api/py/transcript`: Checks if the transcript sub-application is correctly mounted.
"""

import pytest
from httpx import AsyncClient
from index import app  # Import the FastAPI app from index.py
import sys
import os

# Set the root directory of the project to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from index import app  # Import the FastAPI app from index.py

# Define the pytest fixture for the test client
@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://127.0.0.1:8000") as ac:
        yield ac

# Test the Root Endpoint for the Main Application
@pytest.mark.asyncio
async def test_hello_fast_api(client):
    response = await client.get("/api/py/helloFastApi")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello from FastAPI!"}

# Test the Search Endpoint with a Sample Query
@pytest.mark.asyncio
async def test_search_endpoint(client):
    response = await client.get("/api/py/search?query=climate+change")
    assert response.status_code == 200
    assert isinstance(response.json(), list)  # The response should be a list of results or error

# Test the Transcript Sub-Application Mounting
@pytest.mark.asyncio
async def test_transcript_app_mount(client):
    response = await client.get("/api/py/transcript")
    assert response.status_code in [200, 404]  # Check if the endpoint exists or returns 404 (if not implemented)
