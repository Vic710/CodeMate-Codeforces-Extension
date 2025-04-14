import os
import json
import requests
import re
from dotenv import load_dotenv

load_dotenv()

# Load multiple Gemini API keys
GEMINI_KEYS = {
    "generate": os.getenv("GEMINI_KEY_1"),
    "evaluate": os.getenv("GEMINI_KEY_2")
}

def call_gemini(prompt_text: str, task: str = "generate") -> str:
    """
    Calls Gemini API using the appropriate API key for the given task.
    `task` should be either 'generate' or 'evaluate'.
    """
    api_key = GEMINI_KEYS.get(task)
    if not api_key:
        raise Exception(f"No API key set for task '{task}'.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt_text}
                ]
            }
        ]
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code != 200:
        raise Exception(f"Gemini API request failed with status code {response.status_code}.")

    try:
        data = response.json()
    except Exception as e:
        raise Exception("Error parsing Gemini JSON response: " + str(e))

    candidates = data.get("candidates", [])
    if not candidates:
        raise Exception("No candidates found in Gemini response.")

    try:
        parts = candidates[0].get("content", {}).get("parts", [])
        if parts:
            text = parts[0].get("text", "")
    except Exception as e:
        raise Exception("Error extracting text from Gemini candidate: " + str(e))

    if not text:
        raise Exception("Gemini returned an empty text output.")

    # Remove markdown code fences
    text = re.sub(r"^```(json)?\n", "", text)
    text = re.sub(r"\n```$", "", text)

    return text.strip()

def generate_hints(problem_text: str, solution_text: str) -> list:
    prompt = (
        "You are an AI assistant specialized in providing concise, incremental hints for competitive programming problems. "
        "Given a problem and its solution, generate exactly three hints that progressively make the problem easier. "
        "The hints must be ordered from least to most revealing and must be concise, without any extra commentary or explanation. "
        "Always check for hints being too obvious and not incremental. Make sure the hints leave a lot of room for user to think. "
        "Hints can be basic observations that the solution provided you with that the user might have missed or something guiding them towards correct approach. "
        "Return ONLY the JSON output in the EXACT format below, without any additional text:\n\n"
        "{\"hints\": [\"Hint 1\", \"Hint 2\", \"Hint 3\"]}\n\n"
        "Problem:\n" + problem_text + "\n\n"
        "Solution:\n" + solution_text + "\n\n"
        "Provide your answer now."
    )
    try:
        output = call_gemini(prompt, task="generate")
        hints_data = json.loads(output)
        return hints_data.get("hints", [])
    except Exception as e:
        print("Error parsing hints:", e)
        return []

def evaluate_hints(problem_text: str, solution_text: str, hints: list) -> list:
    prompt = (
        "I WANT OUTPUT ONLY IN JSON FORMAT BASED ON MY PROMPTS"
        "You are an AI expert in evaluating and refining hints for competitive programming problems. "
        "Given the problem description, its solution, and three hints, assess whether the hints are too obvious. "
        "Always check for hints being too obvious and not incremental. Make sure the hints leave a lot of room for user to think. "
        "If they are too obvious, provide revised hints that are incremental (ordered from least to most revealing) and concise. "
        "If the hints are acceptable, simply return them. "
        "Return ONLY the JSON output in the EXACT format below without any extra commentary or labels:\n\n"
        "{\"hints\": [\"Hint 1\", \"Hint 2\", \"Hint 3\"]}\n\n"
        "Problem:\n" + problem_text + "\n\n"
        "Solution:\n" + solution_text + "\n\n"
        "Current Hints:\n" + str(hints) + "\n\n"
        "Provide your answer now."
    )
    try:
        output = call_gemini(prompt, task="evaluate")
        # print("RAW GEMINI RESPONSE:")
        # print(output)
        revised_data = json.loads(output)
        return revised_data.get("hints", hints)
    except Exception as e:
        print("Error parsing revised hints:", e)
        return hints

def generate_and_evaluate_hints(problem_text: str, solution_text: str) -> list:
    hints = generate_hints(problem_text, solution_text)
    if hints:
        revised_hints = evaluate_hints(problem_text, solution_text, hints)
        return revised_hints
    return []
