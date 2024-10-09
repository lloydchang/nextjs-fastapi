# File: app/api/chat/route.py

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from typing import List, Dict, Any
import json
import asyncio
import random
import re
from app.api.chat.utils.config import get_config
from app.api.chat.utils.eliza import generate_eliza_response
from app.api.chat.controllers.ollama.gemma import handle_text_with_ollama_gemma_text_model
from app.api.chat.controllers.cloudflare.gemma import handle_text_with_cloudflare_gemma_text_model
from app.api.chat.controllers.google.vertex.gemma import handle_text_with_google_vertex_gemma_text_model
from app.api.chat.utils.sanitize import sanitize_input
from app.api.chat.utils.prompt import system_prompt
from app.api.chat.utils.logger import logger

# Initialize FastAPI app
app = FastAPI(docs_url="/api/chat/docs", redoc_url="/api/chat/redoc", openapi_url="/api/chat/openapi.json")

config = get_config()

last_responses: Dict[str, str] = {}

def shuffle_array(array: List[Any]) -> List[Any]:
    shuffled = array.copy()
    random.shuffle(shuffled)
    return shuffled

def safe_stringify(obj: Dict[str, Any]) -> str:
    return json.dumps(obj).replace("\n", "\\n").replace("\u2028", "").replace("\u2029", "")

def create_filtered_context(persona: str, messages: List[Dict[str, Any]]) -> str:
    filtered = [
        msg for msg in messages if msg.get('persona') != persona
    ]
    formatted = []
    for msg in filtered:
        content = re.sub(re.escape(persona), '', msg.get('content', ''), flags=re.IGNORECASE)
        role = 'User' if msg.get('role') == 'user' else msg.get('persona', 'Unknown')
        sanitized_content = sanitize_input(content)
        formatted.append(f"{role}: {sanitized_content}")
    return '\n'.join(formatted)

async def create_combined_stream(messages: List[Dict[str, str]]):
    async def event_generator():
        try:
            for msg in messages:
                formatted_message = safe_stringify(msg)
                yield f"data: {formatted_message}\n\n"
                logger.debug(f"Streaming message: {formatted_message}")
            await asyncio.sleep(0.1)  # Ensure the generator doesn't close immediately
        except Exception as e:
            error_message = str(e)
            logger.error(f"Error in stream: {error_message}")
            yield f'data: {{"error": "{error_message}"}}\n\n'

    return event_generator()

@app.post("/api/chat")
async def chat_route(request: Request):
    try:
        logger.debug("Handling POST request")

        body = await request.json()
        messages = body.get("messages")
        logger.debug(f"Received messages: {json.dumps(messages)}")

        if not isinstance(messages, list):
            logger.warn('Invalid request format: messages is not an array.')
            return JSONResponse({"error": 'Invalid request format. "messages" must be an array.'}, status_code=400)

        recent_messages = messages[-3:]

        response_functions = [
            {
                "persona": "Eliza",
                "generate": lambda: generate_eliza_response([{"role": "system", "content": system_prompt}] + recent_messages)
            },
            {
                "persona": "Ollama Gemma",
                "generate": lambda: (
                    handle_text_with_ollama_gemma_text_model(
                        {"user_prompt": create_filtered_context("Gemma", recent_messages),
                         "text_model": config.get("ollamaGemmaTextModel")},
                        config
                    ) if config.get("ollamaGemmaTextModel") else None
                )
            },
            {
                "persona": "Cloudflare Gemma",
                "generate": lambda: (
                    handle_text_with_cloudflare_gemma_text_model(
                        {"user_prompt": create_filtered_context("Gemma", recent_messages),
                         "text_model": config.get("cloudflareGemmaTextModel")},
                        config
                    ) if config.get("cloudflareGemmaTextModel") else None
                )
            },
            {
                "persona": "Google Vertex Gemma",
                "generate": lambda: (
                    handle_text_with_google_vertex_gemma_text_model(
                        {"user_prompt": create_filtered_context("Gemma", recent_messages),
                         "text_model": config.get("googleVertexGemmaTextModel")},
                        config
                    ) if config.get("googleVertexGemmaTextModel") else None
                )
            },
        ]

        shuffled_responses = shuffle_array(response_functions)

        tasks = [asyncio.create_task(res["generate"]()) for res in shuffled_responses if res["generate"] is not None]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        responses = []
        for res, func in zip(results, shuffled_responses):
            persona = func["persona"]
            if isinstance(res, Exception):
                logger.error(f"{persona} is unavailable: {str(res)}")
            elif res is not None and res != last_responses.get(persona):
                responses.append({"persona": persona, "message": res})
                last_responses[persona] = res

        combined_stream = create_combined_stream(responses)
        return StreamingResponse(combined_stream, media_type="text/event-stream", headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        })

    except Exception as e:
        error_message = str(e)
        logger.error(f"Error: {error_message}")
        return JSONResponse({"error": error_message}, status_code=500)
