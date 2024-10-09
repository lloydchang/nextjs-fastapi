# File: app/api/chat/clients/google/vertex/gemma.py

import json
import logging
from typing import Optional, Dict

import httpx

# Assuming these modules are available in your project structure
from app.api.chat.utils.logger import logger
from app.api.chat.utils.stream_parser import parse_stream
from app.api.chat.utils.prompt import system_prompt

async def generate_from_google_vertex_gemma(params: Dict[str, str]) -> Optional[str]:
    """
    Generates a response from Google Vertex Gemma based on the provided prompt and model.

    Args:
        params (Dict[str, str]): A dictionary containing:
            - endpoint (str): The API endpoint for Google Vertex Gemma.
            - prompt (str): The user prompt.
            - model (str): The model to use.

    Returns:
        Optional[str]: The generated response or None if an error occurs.
    """
    endpoint = params.get("endpoint")
    prompt = params.get("prompt")
    model = params.get("model")

    combined_prompt = f"{system_prompt}\nUser Prompt: {prompt}"

    logger.debug(
        f"generate_from_google_vertex_gemma - Sending request to Google Vertex Gemma. "
        f"Endpoint: {endpoint}, Model: {model}, Prompt: {combined_prompt}"
    )

    try:
        request_body = json.dumps({"prompt": combined_prompt, "model": model})
        logger.debug(f"generate_from_google_vertex_gemma - Request body: {request_body}")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                endpoint,
                headers={"Content-Type": "application/json"},
                data=request_body,
            )

        if response.status_code != 200:
            logger.error(
                f"generate_from_google_vertex_gemma - HTTP error! Status: {response.status_code}"
            )
            return None

        if not response.aiter_bytes:
            logger.error(
                "generate_from_google_vertex_gemma - Failed to access the response body stream."
            )
            return None

        # Assuming parse_stream is an asynchronous function that processes the byte stream
        final_response = await parse_stream(response.aiter_bytes())

        logger.debug("generate_from_google_vertex_gemma - Received final response from Google Vertex Gemma:")
        logger.debug(f"generate_from_google_vertex_gemma - Final response: {final_response}")

        return final_response

    except Exception as e:
        logger.warning(
            f"generate_from_google_vertex_gemma - Error generating content from Google Vertex Gemma: {e}"
        )
        return None
