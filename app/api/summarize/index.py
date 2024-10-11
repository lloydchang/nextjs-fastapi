# app/api/summarize/index.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from gensim.summarization import summarize
from typing import Optional

# Initialize FastAPI app with default documentation URLs
app = FastAPI()  # Removed custom docs_url, redoc_url, openapi_url

class SummarizationRequest(BaseModel):
    text: str
    ratio: Optional[float] = 0.2  # Fraction of sentences to include in the summary
    word_count: Optional[int] = None  # Total word count for the summary

class SummarizationResponse(BaseModel):
    summary: str

@app.post("/summarize", response_model=SummarizationResponse)
def get_summary(request: SummarizationRequest):
    try:
        if request.word_count:
            summary = summarize(request.text, word_count=request.word_count)
        else:
            summary = summarize(request.text, ratio=request.ratio)
        
        if not summary:
            raise ValueError("Summary could not be generated. The text may be too short or not suitable for summarization.")
        
        return SummarizationResponse(summary=summary)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred during summarization.")
