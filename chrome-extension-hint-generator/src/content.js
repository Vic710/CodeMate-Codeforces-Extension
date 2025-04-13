// This file contains the content script that interacts with the web pages and listens for messages from the background script.

let hints = [
    "Hint 1: Remember to check your syntax.",
    "Hint 2: Use console.log to debug your code.",
    "Hint 3: Break your problem into smaller parts.",
    "Hint 4: Don't forget to test your code frequently.",
    "Hint 5: Read the documentation for the libraries you are using."
];

let currentHintIndex = 0;

function displayHint() {
    if (currentHintIndex < hints.length) {
        alert(hints[currentHintIndex]);
        currentHintIndex++;
    } else {
        alert("No more hints available.");
        currentHintIndex = 0; // Reset to allow cycling through hints again
    }
}

// Listen for messages from the popup script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getHint") {
        displayHint();
        sendResponse({status: "hintDisplayed"});
    }
});