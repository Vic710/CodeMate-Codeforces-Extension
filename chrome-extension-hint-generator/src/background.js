// This file contains the background script for the Chrome extension. It manages events and can handle long-running tasks. It may include functions to fetch hints from a web source.

const hints = [
    "Hint 1: Remember to check your syntax.",
    "Hint 2: Use console.log to debug your code.",
    "Hint 3: Break your problem into smaller parts.",
    "Hint 4: Don't forget to test your code frequently.",
    "Hint 5: Read the documentation for the libraries you use."
];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getHint") {
        const hint = hints[Math.floor(Math.random() * hints.length)];
        sendResponse({ hint: hint });
    }
});