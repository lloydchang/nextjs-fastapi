# File: app/api/chat/utils/config.py

import os
from typing import Optional, Dict, Any

class AppConfig:
    def __init__(self, config: Dict[str, Any]):
        self.amazon_bedrock_titan_text_model: Optional[str] = config.get("AMAZON_BEDROCK_TITAN_TEXT_MODEL")
        self.amazon_bedrock_titan_embedding_model: Optional[str] = config.get("AMAZON_BEDROCK_TITAN_EMBEDDING_MODEL")
        self.amazon_bedrock_titan_endpoint: Optional[str] = config.get("AMAZON_BEDROCK_TITAN_ENDPOINT")
        self.azure_openai_o1_text_model: Optional[str] = config.get("AZURE_OPENAI_O1_TEXT_MODEL")
        self.azure_openai_o1_embedding_model: Optional[str] = config.get("AZURE_OPENAI_O1_EMBEDDING_MODEL")
        self.azure_openai_o1_endpoint: Optional[str] = config.get("AZURE_OPENAI_O1_ENDPOINT")
        self.azure_openai_o1_api_key: Optional[str] = config.get("AZURE_OPENAI_O1_API_KEY")
        self.cloudflare_gemma_text_model: Optional[str] = config.get("CLOUDFLARE_GEMMA_TEXT_MODEL")
        self.cloudflare_gemma_endpoint: Optional[str] = config.get("CLOUDFLARE_GEMMA_ENDPOINT")
        self.cloudflare_api_key: Optional[str] = config.get("CLOUDFLARE_API_KEY")
        self.google_vertex_gemini_text_model: Optional[str] = config.get("GOOGLE_VERTEX_GEMINI_TEXT_MODEL")
        self.google_vertex_gemini_embedding_model: Optional[str] = config.get("GOOGLE_VERTEX_GEMINI_EMBEDDING_MODEL")
        self.google_vertex_gemini_location: Optional[str] = config.get("GOOGLE_VERTEX_GEMINI_LOCATION")
        self.google_vertex_gemini_endpoint: Optional[str] = config.get("GOOGLE_VERTEX_GEMINI_ENDPOINT")
        self.google_application_credentials: Optional[str] = config.get("GOOGLE_APPLICATION_CREDENTIALS")
        self.google_cloud_project: Optional[str] = config.get("GOOGLE_CLOUD_PROJECT")
        self.google_vertex_gemma_text_model: Optional[str] = config.get("GOOGLE_VERTEX_GEMMA_TEXT_MODEL")
        self.google_vertex_gemma_endpoint: Optional[str] = config.get("GOOGLE_VERTEX_GEMMA_ENDPOINT")
        self.google_vertex_gemma_location: Optional[str] = config.get("GOOGLE_VERTEX_GEMMA_LOCATION")
        self.ollama_gemma_text_model: Optional[str] = config.get("OLLAMA_GEMMA_TEXT_MODEL")
        self.ollama_gemma_embedding_model: Optional[str] = config.get("OLLAMA_GEMMA_EMBEDDING_MODEL")
        self.ollama_gemma_endpoint: Optional[str] = config.get("OLLAMA_GEMMA_ENDPOINT")
        self.ollama_llama_text_model: Optional[str] = config.get("OLLAMA_LLAMA_TEXT_MODEL")
        self.ollama_llama_embedding_model: Optional[str] = config.get("OLLAMA_LLAMA_EMBEDDING_MODEL")
        self.ollama_llama_endpoint: Optional[str] = config.get("OLLAMA_LLAMA_ENDPOINT")
        self.openai_o1_text_model: Optional[str] = config.get("OPENAI_O1_TEXT_MODEL")
        self.openai_o1_embedding_model: Optional[str] = config.get("OPENAI_O1_EMBEDDING_MODEL")
        self.openai_o1_endpoint: Optional[str] = config.get("OPENAI_O1_ENDPOINT")
        self.openai_o1_api_key: Optional[str] = config.get("OPENAI_O1_API_KEY")
        self.stream_enabled: bool = config.get("STREAM_ENABLED", "false").lower() == 'true'
        self.temperature: float = float(config.get("TEMPERATURE", 0.0))
        self.winston_logger_level: str = config.get("WINSTON_LOGGER_LEVEL", "debug")

def get_config() -> AppConfig:
    """
    Returns the configuration object with all necessary environment variables.
    """
    return AppConfig(config=os.environ)
