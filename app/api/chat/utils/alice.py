import re
import random
import logging
from typing import List, Dict, Any

# Configure logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)  # Adjust the logging level as needed
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

# Define the patterns and responses
alice_patterns = [
    {"pattern": re.compile(r"Hello|Hi|Hey", re.IGNORECASE), "response": "Hello! How can I assist with your project today?"},
    {"pattern": re.compile(r"How are you\??", re.IGNORECASE), "response": "Doing great! How’s your project coming along?"},
    {"pattern": re.compile(r"What is your name\??", re.IGNORECASE), "response": "I’m Alice, here to support your project planning."},
    {"pattern": re.compile(r"Who (.*)", re.IGNORECASE), "response": "Who exactly are you referring to?"},
    {"pattern": re.compile(r"Can you help me with (.*)", re.IGNORECASE), "response": "I can assist with \\1. Which SDG does it relate to?"},
    {"pattern": re.compile(r"What can you do\??", re.IGNORECASE), "response": "I provide project planning, analysis, and impact guidance."},
    {"pattern": re.compile(r"Goodbye|Bye", re.IGNORECASE), "response": "Goodbye! Best of luck!"},
    {"pattern": re.compile(r"Who are you\??", re.IGNORECASE), "response": "I’m Alice, your project assistant."},
    {"pattern": re.compile(r"Why is (.*)", re.IGNORECASE), "response": "Why do you think \\1?"},
    {"pattern": re.compile(r"Where is (.*)\??", re.IGNORECASE), "response": "Are you looking for \\1 specifically?"},
    {"pattern": re.compile(r"What time is it\??", re.IGNORECASE), "response": "I’m not a clock, but time is valuable! How’s your project going?"},
    {"pattern": re.compile(r"How do you work\??", re.IGNORECASE), "response": "I analyze your project inputs and provide guidance."},
    {"pattern": re.compile(r"What’s your purpose\??", re.IGNORECASE), "response": "I’m here to help you achieve your project’s goals."},
    {"pattern": re.compile(r"Tell me a joke", re.IGNORECASE), "response": "Why did the project manager break up with the timeline? It was too controlling!"},
    {"pattern": re.compile(r"What is the SDG (.*)\??", re.IGNORECASE), "response": "The SDG about \\1 focuses on sustainable development. Let’s discuss it in context!"},
    {"pattern": re.compile(r"Explain (.*) to me\??", re.IGNORECASE), "response": "I can break down \\1 if it relates to project goals."},
    {"pattern": re.compile(r"Can we talk about (.*)\??", re.IGNORECASE), "response": "Sure! Let’s dive into \\1."},
    {"pattern": re.compile(r"I don’t understand (.*)", re.IGNORECASE), "response": "Can you elaborate more on \\1?"},
    {"pattern": re.compile(r"How should I start (.*)\??", re.IGNORECASE), "response": "Begin by defining your project’s objectives clearly."},
    {"pattern": re.compile(r"Why don’t you (.*)\??", re.IGNORECASE), "response": "That’s an interesting idea! Should we consider \\1?"},
    {"pattern": re.compile(r"Can you recommend (.*)\??", re.IGNORECASE), "response": "For \\1, I’d suggest evaluating your project’s impact first."},
    {"pattern": re.compile(r"Should we include (.*)\??", re.IGNORECASE), "response": "If \\1 aligns with your project goals, it’s worth considering."},
    {"pattern": re.compile(r"What’s the best way to (.*)\??", re.IGNORECASE), "response": "The best approach to \\1 is to break it down into manageable steps."},
    {"pattern": re.compile(r"Do you think (.*)\??", re.IGNORECASE), "response": "It depends on the context. Let’s explore \\1 further!"},
    {"pattern": re.compile(r"How do you handle (.*)\??", re.IGNORECASE), "response": "I process \\1 based on project context and objectives."},
]

def shuffle_array(array: List[Any]) -> List[Any]:
    """
    Shuffle an array using Fisher-Yates shuffle algorithm.

    Args:
        array (List[Any]): The array to be shuffled.

    Returns:
        List[Any]: The shuffled array.
    """
    shuffled = array.copy()
    for i in range(len(shuffled) - 1, 0, -1):
        j = random.randint(0, i)
        shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
    return shuffled

def get_random_placeholder() -> str:
    """
    Randomly returns either "this" or "that".

    Returns:
        str: A random placeholder, either "this" or "that".
    """
    return random.choice(["this", "that"])

async def generate_alice_response(conversation: List[Dict[str, str]]) -> str:
    """
    Generate a concise response for the Alice persona using only the most recent user message.
    If no pattern matches, a default response is returned.

    Args:
        conversation (List[Dict[str, str]]): The entire array of conversation messages.

    Returns:
        str: A simulated Alice-like response with system context.
    """
    # Get the most recent user message
    latest_user_message = ""
    for msg in reversed(conversation):
        if msg.get("role") == "user":
            latest_user_message = msg.get("content", "")
            break
    lowercased_input = latest_user_message.lower().strip()
    logger.debug(f"Processing input for Alice: {lowercased_input}")

    # Shuffle patterns to ensure randomness in matching order
    shuffled_patterns = shuffle_array(alice_patterns)

    # Try to match a pattern
    for rule in shuffled_patterns:
        match = rule["pattern"].search(latest_user_message)
        if match:
            logger.debug(f"Matched pattern: {rule['pattern'].pattern}")
            # Replace placeholders in the response; use `get_random_placeholder()` if no match is found
            response = rule["response"]

            # Replace backreferences (\1, \2, etc.) with matched groups
            response = re.sub(r"\\(\d+)", lambda m: match.group(int(m.group(1))) if m.group(int(m.group(1))) else get_random_placeholder(), response)

            # Sanitize and format the response
            response = response.strip()  # Remove leading/trailing whitespace
            response = re.sub(r"\s+", " ", response)  # Replace multiple spaces/newlines with a single space
            logger.debug(f"Generated response: {response}")

            return response

    # If no pattern matched, return a default response
    logger.debug("No pattern matched. Returning default response.")
    return "I'm not sure I understand. Could you please provide more context?"

    # The following lines are commented out for now:
    # If no pattern matched, select a random response from existing patterns
    # random_pattern = random.choice(shuffled_patterns)
    # logger.debug(f"No pattern matched. Using random response: {random_pattern['response']}")

    # Generate the random response without a pattern match, using `get_random_placeholder()` for placeholders
    # random_response = re.sub(r"\\\d+", lambda _: get_random_placeholder(), random_pattern["response"])
    # return random_response
