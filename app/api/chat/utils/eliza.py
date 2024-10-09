# File: app/api/chat/utils/eliza.py

import logging
import re
import random
from typing import List, Dict

# Configure the logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)  # Set to DEBUG to capture all log levels
handler = logging.StreamHandler()
formatter = logging.Formatter('%(levelname)s:%(name)s:%(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

# Define the Eliza patterns with compiled regular expressions
eliza_patterns = [
    {"pattern": re.compile(r"I need (.*)", re.IGNORECASE), "response": "Why do you need $1?"},
    {"pattern": re.compile(r"I want (.*)", re.IGNORECASE), "response": "What would $1 change?"},
    {"pattern": re.compile(r"Why can'?t I ([^\?]*)\??", re.IGNORECASE), "response": "What’s stopping you?"},
    {"pattern": re.compile(r"Why don'?t you ([^\?]*)\??", re.IGNORECASE), "response": "Should I do $1?"},
    {"pattern": re.compile(r"Because (.*)", re.IGNORECASE), "response": "Is that the only reason?"},
    {"pattern": re.compile(r"I feel (.*)", re.IGNORECASE), "response": "What makes you feel $1?"},
    {"pattern": re.compile(r"Can you ([^\?]*)\??", re.IGNORECASE), "response": "Why would I try $1?"},
    {"pattern": re.compile(r"Can I ([^\?]*)\??", re.IGNORECASE), "response": "Why wouldn’t you?"},
    {"pattern": re.compile(r"You are (.*)", re.IGNORECASE), "response": "Who is $1?"},
    {"pattern": re.compile(r"Are you ([^\?]*)\??", re.IGNORECASE), "response": "Why ask?"},
    {"pattern": re.compile(r"What is (.*)", re.IGNORECASE), "response": "What is $1?"},
    {"pattern": re.compile(r"Who (.*)", re.IGNORECASE), "response": "Who?"},
    {"pattern": re.compile(r"How do I (.*)", re.IGNORECASE), "response": "What’s your plan?"},
    {"pattern": re.compile(r"How should I (.*)", re.IGNORECASE), "response": "Does it fit?"},
    {"pattern": re.compile(r"I think (.*)", re.IGNORECASE), "response": "When is $1?"},
    {"pattern": re.compile(r"Do you know (.*)\??", re.IGNORECASE), "response": "Where is $1?"},
    {"pattern": re.compile(r"Are you sure (.*)\??", re.IGNORECASE), "response": "Why does it matter?"},
    {"pattern": re.compile(r"Should I (.*)\??", re.IGNORECASE), "response": "What’s holding you back?"},
    {"pattern": re.compile(r"What if (.*)\??", re.IGNORECASE), "response": "What then?"},
    {"pattern": re.compile(r"Why is (.*)\??", re.IGNORECASE), "response": "How is $1?"},
    {"pattern": re.compile(r"I am (.*)", re.IGNORECASE), "response": "How long have you been feeling $1?"},
    {"pattern": re.compile(r"I can't (.*)", re.IGNORECASE), "response": "What would it take for you to approach $1?"},
    {"pattern": re.compile(r"I don't (.*)", re.IGNORECASE), "response": "What makes you resist $1?"},
    {"pattern": re.compile(r"I always (.*)", re.IGNORECASE), "response": "Why always $1?"},
    {"pattern": re.compile(r"I never (.*)", re.IGNORECASE), "response": "What would happen if you did?"},
    {"pattern": re.compile(r"Do you (.*)\??", re.IGNORECASE), "response": "Do I try $1? What do you think?"},
    {"pattern": re.compile(r"I feel like (.*)", re.IGNORECASE), "response": "Why do you feel like $1?"},
    {"pattern": re.compile(r"Is it possible (.*)\??", re.IGNORECASE), "response": "What makes you question it?"},
    {"pattern": re.compile(r"Could I (.*)\??", re.IGNORECASE), "response": "What would $1 achieve for you?"},
    {"pattern": re.compile(r"Why do I (.*)\??", re.IGNORECASE), "response": "What do you think?"},
    {"pattern": re.compile(r"What should I (.*)\??", re.IGNORECASE), "response": "What do you want to do?"},
    {"pattern": re.compile(r"My (.*)", re.IGNORECASE), "response": "Tell me more about $1."},
    {"pattern": re.compile(r"Am I (.*)", re.IGNORECASE), "response": "Do you believe you are $1?"},
    {"pattern": re.compile(r"It seems like (.*)", re.IGNORECASE), "response": "Why does it seem that $1?"},
    {"pattern": re.compile(r"Everyone (.*)", re.IGNORECASE), "response": "Are you sure everyone loves $1?"},
    {"pattern": re.compile(r"No one (.*)", re.IGNORECASE), "response": "How does that make you feel?"},
    {"pattern": re.compile(r"People (.*)", re.IGNORECASE), "response": "Who specifically?"},
    {"pattern": re.compile(r"What do you think\??", re.IGNORECASE), "response": "Why do you ask what I think?"},
    {"pattern": re.compile(r"Why can’t you (.*)\??", re.IGNORECASE), "response": "What’s preventing you from $1?"},
    {"pattern": re.compile(r"Do you believe (.*)\??", re.IGNORECASE), "response": "What does it mean if I believe $1?"},
]

def shuffle_array(array: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """
    Shuffle an array using Fisher-Yates shuffle algorithm.

    Args:
        array (List[Dict[str, str]]): The array to be shuffled.

    Returns:
        List[Dict[str, str]]: The shuffled array.
    """
    shuffled = array.copy()
    random.shuffle(shuffled)
    return shuffled

def get_random_placeholder() -> str:
    """
    Randomly returns either "this" or "that".

    Returns:
        str: A random placeholder, either "this" or "that".
    """
    return "this" if random.random() < 0.5 else "that"

async def generate_eliza_response(conversation: List[Dict[str, str]]) -> str:
    """
    Generate a response for the Eliza persona using only the most recent user message.
    If no pattern matches, a default response is returned.

    Args:
        conversation (List[Dict[str, str]]): The entire array of conversation messages.

    Returns:
        str: A concise Eliza-like response.
    """
    # Get the most recent user message
    latest_user_message = ""
    for msg in reversed(conversation):
        if msg.get('role') == 'user':
            latest_user_message = msg.get('content', "")
            break
    lowercased_input = latest_user_message.lower().strip()
    logger.debug(f"Processing input for Eliza: {lowercased_input}")

    # Shuffle patterns to ensure randomness in matching order
    shuffled_patterns = shuffle_array(eliza_patterns)

    # Try to match a pattern
    for rule in shuffled_patterns:
        match = rule["pattern"].match(latest_user_message)
        if match:
            logger.debug(f"Matched pattern: {rule['pattern'].pattern}")
            response = rule["response"]

            # Replace $1, $2, etc., with the corresponding matched groups
            def replace_placeholder(match_obj):
                index = int(match_obj.group(1))
                return match.group(index) if match.group(index) else get_random_placeholder()

            response = re.sub(r'\$(\d+)', replace_placeholder, response)
            response = response.strip()  # Remove leading/trailing whitespace
            response = re.sub(r'\s+', ' ', response)  # Replace multiple spaces/newlines with a single space
            logger.debug(f"Generated response: {response}")

            return response

    # Default response if no patterns matched
    logger.debug("No pattern matched. Using default response.")
    return "Can you tell me more about that?"

    # The following lines are commented out for now:
    # If no pattern matched, select a random response from existing patterns
    # random_pattern = random.choice(shuffled_patterns)
    # logger.debug(f"No pattern matched. Using random response: {random_pattern['response']}")

    # Generate the random response without a pattern match, using `get_random_placeholder()` for placeholders
    # random_response = re.sub(r"\\\d+", lambda _: get_random_placeholder(), random_pattern["response"])
    # return random_response
