import { generateHint } from './api.js';

document.addEventListener('DOMContentLoaded', function() {
    const hintDisplay = document.getElementById('hint-display');
    const generateButton = document.getElementById('generate-hint');
    const loadingElement = document.getElementById('loading');
    const problemInfo = document.getElementById('problem-info');
    const problemTitle = document.getElementById('problem-title');
    const problemDifficulty = document.getElementById('problem-difficulty').querySelector('span');

    function showLoading(show) {
        loadingElement.classList.toggle('hidden', !show);
        generateButton.disabled = show;
    }

    function updateProblemInfo(problem) {
        if (problem.title) {
            problemTitle.textContent = problem.title;
            problemDifficulty.textContent = problem.difficulty || 'Unknown';
            problemInfo.classList.remove('hidden');
        }
    }

    function displayMessage(message, isError = false) {
        hintDisplay.innerHTML = `<p class="message ${isError ? 'error' : ''}">${message}</p>`;
    }

    generateButton.addEventListener("click", async () => {
        try {
            showLoading(true);
            displayMessage('Analyzing problem...');

            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab?.url || !tab.url.includes('codeforces.com/problemset/problem')) {
                throw new Error('Please open a Codeforces problem page first!');
            }

            const response = await fetch("http://localhost:3000/api/problem", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ url: tab.url })
            });

            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }

            const data = await response.json();
            updateProblemInfo(data.problem || {});
            displayMessage(data.hint || 'No hint available');

        } catch (error) {
            console.error("Error:", error);
            displayMessage(error.message, true);
        } finally {
            showLoading(false);
        }
    });
});