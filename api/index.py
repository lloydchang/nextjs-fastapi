# api/index.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create a FastAPI app instance
app = FastAPI()

# Enable CORS middleware to handle cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define a "Hello, World" Endpoint for Testing
@app.get("/api/py/hello")
async def hello():
    return {"message": "Hello, World!"}
