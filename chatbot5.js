const Chatbot = (function () {
  const config = {
    buttonColor: "#007bff",
    title: "Chatbot",
    welcomeMessage: "Hi! How can I assist you today?",
    apiHost: null,
  };

  // Inject CSS dynamically
  function loadStylesheet() {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/gh/parasrmehta/chatbot@main/chatbot.css"; // Adjust to correct CDN URL
    document.head.appendChild(link);
  }

  // Load CSS
  loadStylesheet();

  const container = document.createElement("div");
  container.className = "chatbot-container";

  const button = document.createElement("button");
  button.className = "chatbot-button";
  button.innerHTML = "??"; 
  button.title = "Open Chat";

  const chatWindow = document.createElement("div");
  chatWindow.className = "chatbot-window";

  const header = document.createElement("div");
  header.className = "chatbot-header";
  header.innerHTML = config.title;

  const closeBtn = document.createElement("button");
  closeBtn.className = "close-btn";
  closeBtn.innerHTML = "?";
  header.appendChild(closeBtn);

  const messages = document.createElement("div");
  messages.className = "chatbot-messages";

  const inputArea = document.createElement("div");
  inputArea.className = "chatbot-input";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Type your message...";

  const sendButton = document.createElement("button");
  sendButton.textContent = "Send";

  inputArea.appendChild(input);
  inputArea.appendChild(sendButton);
  chatWindow.appendChild(header);
  chatWindow.appendChild(messages);
  chatWindow.appendChild(inputArea);
  container.appendChild(button);
  container.appendChild(chatWindow);
  document.body.appendChild(container);

  addMessage(config.welcomeMessage, "bot-message");

  button.addEventListener("click", toggleChat);
  closeBtn.addEventListener("click", toggleChat);
  sendButton.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  function toggleChat() {
    chatWindow.classList.toggle("open");
  }

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user-message");
    input.value = "";

    if (config.apiHost) {
      fetch(config.apiHost, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })
        .then((response) => response.json())
        .then((data) => addMessage(data.reply || "Sorry, no response.", "bot-message"))
        .catch(() => addMessage("Error contacting server.", "bot-message"));
    } else {
      setTimeout(() => {
        addMessage("This is a simulated response!", "bot-message");
      }, 1000);
    }
  }

  function addMessage(text, className) {
    const message = document.createElement("div");
    message.className = `message ${className}`;
    message.textContent = text;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
  }

  return {
    init: (options) => {
      Object.assign(config, options);
      header.innerHTML = config.title;
      header.appendChild(closeBtn);
      button.style.backgroundColor = config.buttonColor;
      messages.innerHTML = "";
      addMessage(config.welcomeMessage, "bot-message");
      alert("hi"); // Fixed alert
    },
    destroy: () => {
      container.remove();
    },
  };
})();

export default Chatbot;
