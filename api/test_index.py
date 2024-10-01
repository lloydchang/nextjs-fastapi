# api/test_index.py

import pytest
from httpx import AsyncClient
import sys
import os
import pytest_asyncio

# Set the root directory of the project to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from index import app  # Import the FastAPI app from index.py

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_hello_fast_api(client):
    response = await client.get("/api/py/helloFastApi")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello from FastAPI!"}

@pytest.mark.asyncio
async def test_search_endpoint(client):
    response = await client.get("/api/py/search/?query=climate+change")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_transcript_app_mount(client):
    response = await client.get("/api/py/transcript/get-transcript/?url=https://example.com")
    assert response.status_code == 200
    assert "status" in response.json()