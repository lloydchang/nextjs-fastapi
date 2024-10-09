# File: app/api/chat/controllers/google/vertex/gemma.py

import logging
from typing import Any, Dict

# Assuming these modules are available in your project structure
from app.api.chat.utils.logger import logger
from app.api.chat.clients.google.vertex.gemma import generate_from_google_vertex_gemma
from app.api.chat.utils.config import get_config

async def handle_text_with_google_vertex_gemma_text_model(
    params: Dict[str, str],
    config: Any
) -> str:
    """
    Handles text generation using Google Vertex Gemma Text Model.

    Args:
        params (Dict[str, str]): A dictionary containing 'userPrompt' and 'textModel'.
        config (Any): Configuration object (unused in this function).

    Returns:
        str: Generated text from Google Vertex Gemma or an empty string on failure.
    """
    user_prompt = params.get('userPrompt')
    text_model = params.get('textModel')

    # Fetch configuration
    config = get_config()
    google_vertex_gemma_endpoint = config.get('googleVertexGemmaEndpoint')

    # Validate required configuration and parameters
    if not google_vertex_gemma_endpoint or not text_model:
        logger.debug(
            'handle_text_with_google_vertex_gemma_text_model - '
            'Missing required environment variables.'
        )
        return ''

    logger.debug(
        f'handle_text_with_google_vertex_gemma_text_model - '
        f'Generating text for model: {text_model}'
    )
    logger.debug(
        f'handle_text_with_google_vertex_gemma_text_model - '
        f'User prompt: {user_prompt}'
    )

    try:
        # Call the Google Vertex Gemma client to generate text
        response = await generate_from_google_vertex_gemma(
            endpoint=google_vertex_gemma_endpoint,
            prompt=user_prompt,
            model=text_model,
        )
    except Exception as e:
        logger.error(
            'handle_text_with_google_vertex_gemma_text_model - '
            f'Exception occurred: {e}'
        )
        return ''

    # Check if the response is valid
    if not response:
        logger.error(
            'handle_text_with_google_vertex_gemma_text_model - '
            'Failed to generate text from Google Vertex Gemma.'
        )
        return ''

    logger.info(
        f'handle_text_with_google_vertex_gemma_text_model - '
        f'Generated response: {response}'
    )
    return response
