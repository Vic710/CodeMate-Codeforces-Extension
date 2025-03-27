import os
import json
import requests
import re
from dotenv import load_dotenv

# Load environment variables from .env file.
load_dotenv()

# Retrieve the GEMINI API key.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise Exception("GEMINI_API_KEY not set in environment variables.")

# Gemini Flash endpoint URL.
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

def call_gemini(prompt_text: str) -> str:
    """
    Calls the Gemini API with the given prompt and returns the generated output as text.
    It extracts the content, removes markdown code fences, and returns the cleaned text.
    """
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
    
    response = requests.post(GEMINI_URL, headers=headers, json=payload)
    
    if response.status_code != 200:
        raise Exception(f"Gemini API request failed with status code {response.status_code}.")
    
    try:
        data = response.json()
    except Exception as e:
        raise Exception("Error parsing Gemini JSON response: " + str(e))
    
    candidates = data.get("candidates", [])
    if not candidates:
        raise Exception("No candidates found in Gemini response.")
    
    candidate = candidates[0]
    text = ""
    try:
        parts = candidate.get("content", {}).get("parts", [])
        if parts:
            text = parts[0].get("text", "")
    except Exception as e:
        raise Exception("Error extracting text from Gemini candidate: " + str(e))
    
    if not text:
        raise Exception("Gemini returned an empty text output.")
    
    # Remove markdown code fences if present (e.g., ```json ... ```).
    text = re.sub(r"^```(json)?\n", "", text)
    text = re.sub(r"\n```$", "", text)
    
    return text.strip()

def generate_hints(problem_text: str, solution_text: str) -> list:
    """
    Generate exactly three incremental and concise hints for a coding problem.
    The hints must be ordered from least to most revealing and must strictly follow the JSON format.
    """
    prompt = (
        "You are an AI assistant specialized in providing concise, incremental hints for competitive programming problems. "
        "Given a problem and its solution, generate exactly three hints that progressively make the problem easier. "
        "The hints must be ordered from least to most revealing and must be concise, without any extra commentary or explanation. "
        "Always check for hints being too obvious and not incremental. Make sure the hints leave a lot of room for user to think"
        "Hints can be basic observations that the solution provided you with that the user might have missed or something guiding them towards correct approach"
        "Return ONLY the JSON output in the EXACT format below, without any additional text:\n\n"
        "{\"hints\": [\"Hint 1\", \"Hint 2\", \"Hint 3\"]}\n\n"
        "Penalties: If the hints are too verbose, not incremental, or not properly labeled, penalize accordingly. "
        "Do not include any text outside the JSON object.\n\n"
        f"Problem:\n{problem_text}\n\n"
        f"Solution:\n{solution_text}\n\n"
        "Provide your answer now."
    )
    try:
        output = call_gemini(prompt)
        hints_data = json.loads(output)
        return hints_data.get("hints", [])
    except Exception as e:
        # Logging error to stderr if needed, but not printing JSON output.
        print("Error parsing hints:", e)
        return []

def evaluate_hints(problem_text: str, solution_text: str, hints: list) -> list:
    """
    Evaluate the current hints. If they are too obvious, return revised hints that are incremental and concise.
    If they are acceptable, return the same hints.
    The output must be in the EXACT JSON format specified.
    """
    prompt = (
        "You are an AI expert in evaluating and refining hints for competitive programming problems. "
        "Given the problem description, its solution, and three hints, assess whether the hints are too obvious. "
        "Always check for hints being too obvious and not incremental. Make sure the hints leave a lot of room for user to think"
        "Hints can be basic observations that the solution provided you with that the user might have missed or something guiding them towards correct approach"
        "If they are too obvious, provide revised hints that are incremental (ordered from least to most revealing) and concise. "
        "If the hints are acceptable, simply return them. "
        "Return ONLY the JSON output in the EXACT format below without any extra commentary or labels:\n\n"
        "{\"hints\": [\"Hint 1\", \"Hint 2\", \"Hint 3\"]}\n\n"
        "Penalties: Do not include extra text, commentary, or failure labels. The hints must be clearly and correctly labeled. "
        "If the hints are acceptable, simply return the original JSON output.\n\n"
        f"Problem:\n{problem_text}\n\n"
        f"Solution:\n{solution_text}\n\n"
        f"Current Hints:\n{hints}\n\n"
        "Provide your answer now."
    )
    try:
        output = call_gemini(prompt)
        revised_data = json.loads(output)
        return revised_data.get("hints", hints)
    except Exception as e:
        print("Error parsing revised hints:", e)
        return hints

def save_hints_to_file(hints: list, filename: str = "hints.json") -> None:
    """
    Save the final hints to a JSON file with proper labeling.
    """
    data = {"hints": hints}
    try:
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"Final hints saved to {filename}.")
    except Exception as e:
        print(f"Error saving hints to file: {e}")

# Example usage.
if __name__ == "__main__":
    problem = '''Given a string x
 of length n
 and a string s
 of length m
 (n⋅m≤25
), consisting of lowercase Latin letters, you can apply any number of operations to the string x
.

In one operation, you append the current value of x
 to the end of the string x
. Note that the value of x
 will change after this.

For example, if x=
"aba", then after applying operations, x
 will change as follows: "aba" →
 "abaaba" →
 "abaabaabaaba".

After what minimum number of operations s
 will appear in x
 as a substring? A substring of a string is defined as a contiguous segment of it.

Input
The first line of the input contains a single integer t
 (1≤t≤104
) — the number of test cases.

The first line of each test case contains two numbers n
 and m
 (1≤n⋅m≤25
) — the lengths of strings x
 and s
, respectively.

The second line of each test case contains the string x
 of length n
.

The third line of each test case contains the string s
 of length m
.

Output
For each test case, output a single number — the minimum number of operations after which s
 will appear in x
 as a substring. If this is not possible, output -1
.

Example
InputCopy
12
1 5
a
aaaaa
5 5
eforc
force
2 5
ab
ababa
3 5
aba
ababa
4 3
babb
bbb
5 1
aaaaa
a
4 2
aabb
ba
2 8
bk
kbkbkbkb
12 2
fjdgmujlcont
tf
2 2
aa
aa
3 5
abb
babba
1 19
m
mmmmmmmmmmmmmmmmmmm
OutputCopy
3
1
2
-1
1
0
1
3
1
0
2
5
Note
In the first test case of the example, after 2
 operations, the string will become "aaaa", and after 3
 operations, it will become "aaaaaaaa", so the answer is 3
.

In the second test case of the example, after applying 1
 operation, the string will become "eforceforc
", where the substring is highlighted in red.

In the fourth test case of the example, it can be shown that it is impossible to obtain the desired string as a substring.'''
    solution = '''1881A - Don't Try to Count

Idea: Vladosiya

Tutorial
1881A - Don't Try to Count
Note that the answer is always not greater than 5
. When n=1
, m=25
, the answer is either 5
 or -1
, it is easy to see that the answer cannot be greater.

This allows us to simply iterate over the number of operations, each time checking if s
 occurs in x
. The time complexity of this solution is O(25⋅n⋅m)
.

Solution
def solve():
    n, m = map(int, input().split())
    x = input()
    s = input()
    for i in range(6):
        if s in x:
            print(i)
            return
        x += x
    print(-1)


for _ in range(int(input())):
    solve()'''
    
    # Generate initial hints.
    hints = generate_hints(problem, solution)
    
    # Evaluate and adjust hints if needed.
    revised_hints = evaluate_hints(problem, solution, hints)
    
    # Save the final hints to a JSON file.
    save_hints_to_file(revised_hints)
