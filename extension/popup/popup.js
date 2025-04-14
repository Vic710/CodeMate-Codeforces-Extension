document.addEventListener('DOMContentLoaded', function() {
    const getHintsBtn = document.getElementById('get-hints-btn');
    const loading = document.getElementById('loading');
    const hintsContainer = document.getElementById('hints-container');
    const errorContainer = document.getElementById('error-container');
    const statusMessage = document.getElementById('status-message');
    
    const hint1Btn = document.getElementById('hint1-btn');
    const hint2Btn = document.getElementById('hint2-btn');
    const hint3Btn = document.getElementById('hint3-btn');
    
    const hint1Content = document.getElementById('hint1-content');
    const hint2Content = document.getElementById('hint2-content');
    const hint3Content = document.getElementById('hint3-content');
    
    const hint2Box = document.getElementById('hint2-box');
    const hint3Box = document.getElementById('hint3-box');
    
    let currentProblemCode = null;
    let hintsData = null;
  
    // Check server status on popup load
    checkServerStatus();
    
    // Setup event listeners
    getHintsBtn.addEventListener('click', handleGetHints);
    hint1Btn.addEventListener('click', () => toggleHint(hint1Btn, hint1Content, hint2Box));
    hint2Btn.addEventListener('click', () => toggleHint(hint2Btn, hint2Content, hint3Box));
    hint3Btn.addEventListener('click', () => toggleHint(hint3Btn, hint3Content));
    
    function toggleHint(button, content, nextBox = null) {
      // Toggle active class on button
      button.classList.toggle('active');
      
      // Toggle visibility of content
      if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        button.textContent = button.textContent.replace('Show', 'Hide');
        
        // Show next hint box if it exists
        if (nextBox) {
          nextBox.classList.remove('hidden');
        }
      } else {
        content.classList.add('hidden');
        button.textContent = button.textContent.replace('Hide', 'Show');
      }
    }
  
    function checkServerStatus() {
      fetch('http://localhost:5000/status')
        .then(response => {
          if (!response.ok) throw new Error('Server is not responding');
          return response.json();
        })
        .then(data => {
          statusMessage.innerHTML = `<p>Server is online. Ready to generate hints.</p>`;
        })
        .catch(error => {
          statusMessage.innerHTML = `
            <p>Server is offline. Please start the Flask server:</p>
            <code>cd backend && python app.py</code>
          `;
          getHintsBtn.disabled = true;
        });
    }
    
    function handleGetHints() {
      // Reset UI state
      resetUI();
      
      // Show loading spinner
      loading.classList.remove('hidden');
      getHintsBtn.disabled = true;
      
      // Get current tab info
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        
        // Check if we're on a Codeforces problem page
        if (!currentTab.url.includes('codeforces.com/problemset/problem/')) {
          showError('Please navigate to a Codeforces problem page first.');
          return;
        }
        
        // Extract problem code from URL
        const urlParts = new URL(currentTab.url).pathname.split('/');
        const problemNumber = urlParts[urlParts.length - 2];
        const problemLetter = urlParts[urlParts.length - 1];
        currentProblemCode = problemNumber + problemLetter;
        
        // Send message to background script to process the problem
        chrome.runtime.sendMessage({
          action: 'processCodeforcesProblem',
          tabId: currentTab.id
        }, function(response) {
          if (response && response.success) {
            // Poll the server for hints
            pollForHints(currentProblemCode);
          } else {
            showError('Failed to process the problem. Please try again.');
          }
        });
      });
    }
    
    function pollForHints(problemCode) {
      let attempts = 0;
      const maxAttempts = 30; // Maximum polling attempts (30 * 2 seconds = 60 seconds timeout)
      
      const checkHints = function() {
        if (attempts >= maxAttempts) {
          showError('Timeout waiting for hints generation. Please try again.');
          return;
        }
        
        attempts++;
        
        fetch(`http://localhost:5000/check-hints?problemCode=${problemCode}`)
          .then(response => {
            if (!response.ok) throw new Error('Server error');
            return response.json();
          })
          .then(data => {
            if (data.hintsAvailable) {
              // Hints are ready, get them and display
              getAndDisplayHints(problemCode);
            } else {
              // Hints not ready yet, poll again after delay
              setTimeout(checkHints, 2000);
            }
          })
          .catch(error => {
            setTimeout(checkHints, 2000);
          });
      };
      
      // Start polling
      checkHints();
    }
    
    function getAndDisplayHints(problemCode) {
      fetch(`http://localhost:5000/get-hints?problemCode=${problemCode}`)
        .then(response => {
          if (!response.ok) throw new Error('Failed to retrieve hints');
          return response.json();
        })
        .then(data => {
          if (data.hints && data.hints.length === 3) {
            // Store hints data
            hintsData = data.hints;
            
            // Display the hints UI
            displayHints(data.hints);
          } else {
            showError('Invalid hints data received. Please try again.');
          }
        })
        .catch(error => {
          showError('Error retrieving hints: ' + error.message);
        });
    }
    
    function displayHints(hints) {
      // Hide loading, show hints container
      loading.classList.add('hidden');
      hintsContainer.classList.remove('hidden');
      
      // Populate hint contents
      hint1Content.textContent = hints[0];
      hint2Content.textContent = hints[1];
      hint3Content.textContent = hints[2];
      
      // Re-enable the get hints button
      getHintsBtn.disabled = false;
      
      // Update status message
      statusMessage.innerHTML = `<p>Hints generated successfully for problem ${currentProblemCode}. Click on each hint to reveal it.</p>`;
    }
    
    function showError(message) {
      loading.classList.add('hidden');
      errorContainer.classList.remove('hidden');
      errorContainer.querySelector('p').textContent = message;
      getHintsBtn.disabled = false;
    }
    
    function resetUI() {
      // Hide results containers
      hintsContainer.classList.add('hidden');
      errorContainer.classList.add('hidden');
      
      // Reset hint buttons and content
      hint1Btn.textContent = 'Show Hint 1';
      hint2Btn.textContent = 'Show Hint 2';
      hint3Btn.textContent = 'Show Hint 3';
      
      hint1Btn.classList.remove('active');
      hint2Btn.classList.remove('active');
      hint3Btn.classList.remove('active');
      
      hint1Content.classList.add('hidden');
      hint2Content.classList.add('hidden');
      hint3Content.classList.add('hidden');
      
      hint2Box.classList.add('hidden');
      hint3Box.classList.add('hidden');
    }
  });