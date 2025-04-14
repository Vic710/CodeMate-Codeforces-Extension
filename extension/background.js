chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'processCodeforcesProblem') {
    processCodeforcesProblem(message.tabId)
      .then(() => sendResponse({ success: true }))
      .catch(error => {
        console.error('Error processing problem:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
});

async function processCodeforcesProblem(tabId) {
  try {
    // Step 1: Extract problem and tutorial URL from problem page
    const [{ result: { problemText, tutorialUrl, problemCode } }] = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        const problemEl = document.querySelector('.problem-statement');
        const problemText = problemEl ? problemEl.innerText : document.body.innerText;

        const tutorialAnchor = Array.from(document.querySelectorAll('a')).find(a => /Tutorial/i.test(a.innerText));
        const tutorialUrl = tutorialAnchor ? tutorialAnchor.href : null;

        const urlParts = window.location.pathname.split('/');
        const problemCode = urlParts.at(-2) + urlParts.at(-1); // e.g., 2075B

        return { problemText, tutorialUrl, problemCode };
      }
    });

    if (!tutorialUrl) {
      throw new Error('Tutorial link not found');
    }

    // Send problem text to Flask server
    sendToServer({
      type: 'problem',
      problemCode: problemCode, 
      content: problemText
    });

    // Step 2: Open tutorial in hidden pinned tab
    const tutorialTab = await new Promise((resolve) => {
      chrome.tabs.create({ url: tutorialUrl, active: false, pinned: true }, (tab) => resolve(tab));
    });

    // Wait for the tutorial page to load and extract content
    await new Promise((resolve, reject) => {
      const listener = function(tabId, changeInfo) {
        if (tabId === tutorialTab.id && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });

    // Extract tutorial content
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tutorialTab.id },
      func: (problemCode) => {
        const bodyHTML = document.body.innerHTML;

        const lines = bodyHTML.split(/<hr ?\/?>/i); // CF separates posts by <hr>
        let capture = false;
        let htmlChunk = '';

        for (const block of lines) {
          if (block.includes(problemCode)) {
            capture = true;
          } else if (capture && block.match(/\b\d{4}[A-Z]\b/)) {
            break;
          }

          if (capture) htmlChunk += block + '<hr>';
        }

        const el = document.createElement('div');
        el.innerHTML = htmlChunk;
        const text = el.innerText;

        // Implement enhanced cleaning logic
        let cleanedText = text;
        
        // Find the starting position of the problem code
        let startIndex = -1;
        for (let i = 0; i < text.length - problemCode.length; i++) {
          let found = true;
          for (let j = 0; j < problemCode.length; j++) {
            if (text[i + j].toUpperCase() !== problemCode[j].toUpperCase()) {
              found = false;
              break;
            }
          }
          if (found) {
            startIndex = i;
            break;
          }
        }

        if (startIndex === -1) {
          return { 
            html: htmlChunk, 
            text: text,
            cleanedText: text // If we can't find a starting point, return the original text
          };
        }

        // Find ending markers:
        // 1. "comments" section
        // 2. Next problem indicator (typically a 4-digit number followed by a letter)
        let endIndex = text.length;
        
        const lower = text.toLowerCase();
        const commentIndex = lower.indexOf('comments', startIndex);
        if (commentIndex !== -1) {
          endIndex = commentIndex;
        }
        
        // Look for pattern of a problem code (like 1234A) after our starting point
        // This regex looks for 4 digits followed by an uppercase letter, typical CF problem code format
        const nextProblemMatch = text.slice(startIndex + problemCode.length).match(/\b\d{4}[A-Z]\b/);
        if (nextProblemMatch) {
          const nextProblemIndex = startIndex + problemCode.length + nextProblemMatch.index;
          
          // Use the earlier of the two end markers
          if (nextProblemIndex < endIndex) {
            endIndex = nextProblemIndex;
          }
        }

        // Extract the cleaned portion
        cleanedText = text.slice(startIndex, endIndex).trim();

        return { 
          html: htmlChunk, 
          text: text,
          cleanedText: cleanedText
        };
      },
      args: [problemCode]
    });

    // Send all data to the Flask server
    sendToServer({
      type: 'tutorial_html', 
      problemCode: problemCode, 
      content: result.html
    });
    
    sendToServer({
      type: 'tutorial_text', 
      problemCode: problemCode, 
      content: result.text
    });
    
    sendToServer({
      type: 'tutorial_clean', 
      problemCode: problemCode, 
      content: result.cleanedText
    });

    // Close the tutorial tab after processing
    setTimeout(() => chrome.tabs.remove(tutorialTab.id), 2000);

    return true;
  } catch (error) {
    console.error('Error in processCodeforcesProblem:', error);
    throw error;
  }
}

// Function to send data to the Flask server
function sendToServer(data) {
  const serverUrl = 'http://localhost:5000/save-data'; // Flask server URL
  
  return fetch(serverUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    return response.json();
  })
  .then(responseData => {
    console.log('✅ Data sent successfully:', responseData);
    return responseData;
  })
  .catch(error => {
    console.error('❌ Error sending data to server:', error);
    // Fallback to local download if server is unavailable
    if (data.type && data.problemCode && data.content) {
      const fileExtension = data.type.includes('html') ? 'html' : 'txt';
      const filename = `CF_${data.problemCode}_${data.type}.${fileExtension}`;
      const url = 'data:text/plain;charset=utf-8,' + encodeURIComponent(data.content);
      chrome.downloads.download({ filename, url, conflictAction: 'overwrite' });
    }
    throw error;
  });
}