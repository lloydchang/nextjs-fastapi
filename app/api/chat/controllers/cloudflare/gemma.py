# File: app/api/chat/controllers/cloudflare/gemma.py

import logging
from typing import Dict, Any

# Assuming these modules are available in your project structure
from app.api.chat.utils.logger import logger
from app.api.chat.clients.cloudflare.gemma import generate_from_cloudflare_gemma
from app.api.chat.utils.config import get_config

async def handle_text_with_cloudflare_gemma_text_model(
    data: Dict[str, str],
    config: Any
) -> str:
    """
    Handles text generation using Cloudflare Gemma's text model.

    Args:
        data (Dict[str, str]): A dictionary containing 'userPrompt' and 'textModel'.
        config (Any): Configuration object (not used directly).

    Returns:
        str: The generated text or an empty string if generation fails.
    """
    user_prompt = data.get('userPrompt')
    text_model = data.get('textModel')

    # Retrieve configuration settings
    config = get_config()
    cloudflare_gemma_endpoint = config.get('cloudflareGemmaEndpoint')

    # Validate required configuration and parameters
    if not cloudflare_gemma_endpoint or not text_model:
        logger.debug('handle_text_with_cloudflare_gemma_text_model - Missing required environment variables.')
        return ''

    logger.debug(f'handle_text_with_cloudflare_gemma_text_model - Generating text for model: {text_model}')
    logger.debug(f'handle_text_with_cloudflare_gemma_text_model - User prompt: {user_prompt}')

    try:
        # Call the Cloudflare Gemma client to generate text
        response = await generate_from_cloudflare_gemma(
            endpoint=cloudflare_gemma_endpoint,
            prompt=user_prompt,
            model=text_model
        )
    except Exception as e:
        logger.error(f'handle_text_with_cloudflare_gemma_text_model - Exception occurred: {e}')
        return ''

    # Check if the response is valid
    if not response:
        logger.error('handle_text_with_cloudflare_gemma_text_model - Failed to generate text from Cloudflare Gemma.')
        return ''

    logger.info(f'handle_text_with_cloudflare_gemma_text_model - Generated response: {response}')
    return response
