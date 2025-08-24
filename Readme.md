# Codeforces Hint Helper

A Chrome extension and Flask backend that provides incremental hints for Codeforces problems without spoiling the solution.

## Features

- Automatically extracts problem statements and tutorials from Codeforces
- Generates three progressive hints using AI
- Provides hints in a step-by-step manner to guide your problem-solving
- Clean and intuitive user interface

## Installation

### Backend Setup

1. Clone this repository
2. Navigate to the backend directory:
   ```
   cd codeforces-hint-helper/backend
   ```
3. Install the required packages:
   ```
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the root directory with your Gemini API keys:
   ```
   GEMINI_KEY_1=your_first_api_key_here
   GEMINI_KEY_2=your_second_api_key_here
   ```
5. Start the Flask server:
   ```
   python app.py
   ```

### Chrome Extension Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked" and select the `extension` directory from this repository
4. The extension should now appear in your Chrome toolbar

## Usage

1. Navigate to any Codeforces problem page (e.g., `codeforces.com/problemset/problem/1234/A`)
2. Click the Codeforces Hint Helper icon in your Chrome toolbar
3. Click the "Get Hints" button
4. Wait for the hints to be generated (this may take a few seconds)
5. Click on "Show Hint 1" to reveal the first hint
6. After reading the first hint, continue to the second and third hints if needed

## How It Works

1. The extension extracts the problem statement from the Codeforces page
2. It then finds and extracts the solution approach from the problem's tutorial
3. The Flask backend uses Gemini API to generate three progressive hints
4. The hints are provided to you in incremental steps, allowing you to solve the problem with just enough guidance

## Development

### Directory Structure

```
codeforces-hint-helper/
├── backend/
│   ├── app.py
│   ├── hints.py
│   └── requirements.txt
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   └── images/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── README.md
└── .env
```
