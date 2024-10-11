# File: app/api/chat/controllers/ollama/gemma.py

import logging
from typing import Dict, Any

# Assuming these modules are available in your project structure
from app.api.chat.utils.logger import logger
from app.api.chat.clients.ollama.gemma import generate_from_ollama_gemma
from app.api.chat.utils.config import get_config

async def handle_text_with_ollama_gemma_text_model(
    params: Dict[str, str],
    config: Any
) -> str:
    """
    Handles text generation using the Ollama Gemma text model.

    Args:
        params (Dict[str, str]): A dictionary containing 'userPrompt' and 'textModel'.
        config (Any): Configuration object (unused in this function).

    Returns:
        str: The generated text response or an empty string if generation fails.
    """
    user_prompt = params.get('userPrompt')
    text_model = params.get('textModel')
    
    # Retrieve configuration
    config = get_config()
    ollama_gemma_endpoint = config.get('ollamaGemmaEndpoint')

    # Check for required configuration and parameters
    if not ollama_gemma_endpoint or not text_model:
        logger.debug(
            'handle_text_with_ollama_gemma_text_model - Missing required environment variables.'
        )
        return ''

    logger.debug(
        f'handle_text_with_ollama_gemma_text_model - Generating text for model: {text_model}'
    )
    logger.debug(
        f'handle_text_with_ollama_gemma_text_model - User prompt: {user_prompt}'
    )

    # Generate text using Ollama Gemma
    response = await generate_from_ollama_gemma(
        endpoint=ollama_gemma_endpoint,
        prompt=user_prompt,
        model=text_model
    )

    # Handle potential failure in text generation
    if not response:
        logger.error(
            'handle_text_with_ollama_gemma_text_model - Failed to generate text from Ollama Gemma.'
        )
        return ''

    logger.debug(
        f'handle_text_with_ollama_gemma_text_model - Generated response: {response}'
    )
    return response
