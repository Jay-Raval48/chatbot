// Oracle Fusion-specific integration approach
(function() {
  // CONFIGURATION
  var API_KEY = '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';
  var MODEL_NAME = 'llama-3.3-70b-versatile';
  
  // Wait for Oracle ADF to be fully loaded
  function waitForAdfReady() {
    if (window.AdfPage && window.AdfPage.PAGE) {
      console.log("Oracle ADF detected, proceeding with chatbot initialization");
      initializeChatbot();
    } else {
      console.log("Waiting for Oracle ADF to load...");
      setTimeout(waitForAdfReady, 500);
    }
  }
  
  function initializeChatbot() {
    console.log("Starting chatbot initialization");
    
    // Create simple minimal chatbot (avoiding React dependencies)
    // This is a stripped-down version that doesn't require React
    createMinimalChatbot();
    
    console.log("Chatbot UI created");
  }
  
  function createMinimalChatbot() {
    // Create chatbot icon
    var chatIcon = document.createElement('div');
    chatIcon.id = 'fusion-chatbot-icon';
    chatIcon.innerHTML = '<svg width="40" height="40" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#4263EB"></circle><path d="M7 11H17M7 16H13" stroke="white" stroke-width="1.5" stroke-linecap="round"></path></svg>';
    chatIcon.style.cssText = 'position:fixed;bottom:20px;right:20px;width:50px;height:50px;border-radius:50%;background:white;box-shadow:0 2px 10px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;z-index:99999;cursor:pointer;';
    
    // Create chat window (hidden initially)
    var chatWindow = document.createElement('div');
    chatWindow.id = 'fusion-chatbot-window';
    chatWindow.style.cssText = 'position:fixed;bottom:80px;right:20px;width:350px;height:500px;background:white;border-radius:12px;box-shadow:0 5px 25px rgba(0,0,0,0.2);display:none;flex-direction:column;overflow:hidden;z-index:99999;';
    
    // Create chat header
    var chatHeader = document.createElement('div');
    chatHeader.style.cssText = 'padding:15px;background:#4263EB;color:white;display:flex;justify-content:space-between;align-items:center;';
    chatHeader.innerHTML = '<h3 style="margin:0;font-size:16px;font-weight:600;">Chat Assistant</h3><button style="background:transparent;border:none;color:white;font-size:24px;cursor:pointer;">×</button>';
    
    // Create chat body
    var chatBody = document.createElement('div');
    chatBody.style.cssText = 'flex:1;padding:15px;overflow-y:auto;background:#f8f9fa;display:flex;flex-direction:column;';
    chatBody.innerHTML = '<div style="color:#6c757d;text-align:center;margin:auto 0;font-style:italic;">Send a message to start chatting!</div>';
    
    // Create chat input area
    var chatInput = document.createElement('div');
    chatInput.style.cssText = 'display:flex;padding:10px 15px;background:white;border-top:1px solid #e9ecef;';
    chatInput.innerHTML = '<textarea style="flex:1;border:1px solid #ced4da;border-radius:20px;padding:10px 15px;resize:none;font-family:inherit;font-size:14px;outline:none;min-height:40px;" placeholder="Type your message..."></textarea><button style="margin-left:10px;width:40px;height:40px;border-radius:50%;background:#4263EB;color:white;border:none;display:flex;justify-content:center;align-items:center;cursor:pointer;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></button>';
    
    // Assemble everything
    chatWindow.appendChild(chatHeader);
    chatWindow.appendChild(chatBody);
    chatWindow.appendChild(chatInput);
    
    // Add to page
    document.body.appendChild(chatIcon);
    document.body.appendChild(chatWindow);
    
    // Add event listeners
    chatIcon.addEventListener('click', function() {
      chatWindow.style.display = chatWindow.style.display === 'none' ? 'flex' : 'none';
    });
    
    chatHeader.querySelector('button').addEventListener('click', function() {
      chatWindow.style.display = 'none';
    });
    
    // Setup chat functionality
    var textarea = chatInput.querySelector('textarea');
    var sendButton = chatInput.querySelector('button');
    
    sendButton.addEventListener('click', function() {
      sendMessage();
    });
    
    textarea.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    
    function sendMessage() {
      var text = textarea.value.trim();
      if (!text) return;
      
      // Clear input
      textarea.value = '';
      
      // Add user message
      addMessage('user', text);
      
      // Show typing indicator
      var loadingMsg = addMessage('bot', '<span style="opacity:0.5">Typing...</span>');
      
      // Call Groq API
      callGroqAPI(text, function(response) {
        // Remove typing indicator
        loadingMsg.remove();
        
        // Add bot response
        addMessage('bot', response || "Sorry, I couldn't generate a response.");
      });
    }
    
    function addMessage(sender, text) {
      // Remove empty state if it exists
      var emptyState = chatBody.querySelector('div[style*="font-style:italic"]');
      if (emptyState) {
        chatBody.removeChild(emptyState);
      }
      
      var msgDiv = document.createElement('div');
      var align = sender === 'user' ? 'flex-end' : 'flex-start';
      var bgColor = sender === 'user' ? '#4263EB' : '#e9ecef';
      var textColor = sender === 'user' ? 'white' : '#212529';
      var borderRadius = sender === 'user' ? '18px 18px 5px 18px' : '18px 18px 18px 5px';
      
      msgDiv.style.cssText = `align-self:${align};max-width:80%;padding:10px 15px;background:${bgColor};color:${textColor};border-radius:${borderRadius};margin-bottom:10px;`;
      msgDiv.innerHTML = text;
      
      chatBody.appendChild(msgDiv);
      chatBody.scrollTop = chatBody.scrollHeight;
      
      return msgDiv;
    }
    
    function callGroqAPI(message, callback) {
      // Create a simple XHR request (avoiding fetch for maximum compatibility)
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "https://api.groq.com/openai/v1/chat/completions", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Authorization", "Bearer " + API_KEY);
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              var response = JSON.parse(xhr.responseText);
              callback(response.choices[0]?.message?.content);
            } catch (e) {
              console.error("Error parsing API response:", e);
              callback("Sorry, there was an error processing the response.");
            }
          } else {
            console.error("API error:", xhr.status, xhr.statusText);
            callback("Sorry, there was an error connecting to the AI service.");
          }
        }
      };
      
      var data = JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 800
      });
      
      xhr.send(data);
    }
  }
  
  // Start the process
  console.log("Starting Oracle Fusion chatbot integration");
  if (typeof AdfPage !== 'undefined') {
    // If ADF is already loaded
    initializeChatbot();
  } else {
    // Wait for ADF or just start after a delay
    setTimeout(initializeChatbot, 2000);
  }
})();
