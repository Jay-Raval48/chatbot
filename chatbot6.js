const Chatbot = (function () {
    const config = {
        buttonColor: "#007bff",
        title: "Fusion Assistant",
        welcomeMessage: "I am your Fusion Assistant, how may I help you?",
    };

    // DOM Elements
    let messagesContainer, chatWindow;

    // Inject CSS dynamically
    function loadStylesheet() {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdn.jsdelivr.net/gh/Jay-Raval48/chatbot/chatbot.css";
        document.head.appendChild(link);
    }

    // Create chatbot structure
    const container = document.createElement("div");
    container.className = "chatbot-container";

    const button = document.createElement("button");
    button.className = "chatbot-button";
    button.innerHTML = "💬";
    button.title = "Open Chat";

    chatWindow = document.createElement("div");
    chatWindow.className = "chatbot-window";

    const header = document.createElement("div");
    header.className = "chatbot-header";
    header.innerHTML = config.title;

    const closeBtn = document.createElement("button");
    closeBtn.className = "close-btn";
    closeBtn.innerHTML = "×";

    const messages = document.createElement("div");
    messages.className = "chatbot-messages";
    messagesContainer = messages;

    const inputArea = document.createElement("div");
    inputArea.className = "chatbot-input";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type your message...";

    const sendButton = document.createElement("button");
    sendButton.textContent = "Send";

    // Assemble DOM
    inputArea.appendChild(input);
    inputArea.appendChild(sendButton);
    header.appendChild(closeBtn);
    chatWindow.appendChild(header);
    chatWindow.appendChild(messages);
    chatWindow.appendChild(inputArea);
    container.appendChild(button);
    container.appendChild(chatWindow);
    document.body.appendChild(container);

    // Event Listeners
    button.addEventListener("click", toggleChat);
    closeBtn.addEventListener("click", toggleChat);
    sendButton.addEventListener("click", sendMessage);
    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    function toggleChat() {
        chatWindow.classList.toggle("open");
        if (chatWindow.classList.contains("open") && !messagesContainer.children.length) {
            addMessage(config.welcomeMessage, "bot-message");
        }
    }

    function addMessage(text, className) {
        const message = document.createElement("div");
        message.className = `message ${className}`;
        if (className === "bot-message") {
            const formatted = formatLLMResponse(text);
            message.appendChild(formatted);
        } else {
            message.textContent = text;
        }
        messages.appendChild(message);
        messages.scrollTop = messages.scrollHeight;
    }

    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        addMessage(text, "user-message");
        input.value = "";

        try {
            const response = await askAgent(text);
            addMessage(response, "bot-message");
        } catch (error) {
            addMessage("Sorry, I couldn’t process your request.", "bot-message");
            console.error('Error:', error);
        }
    }

    // LangChain Agent Integration
    async function askAgent(question) {
        const AGENT_API_URL = 'http://localhost:8000/query/';
        try {
            const response = await fetch(AGENT_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: question }),
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Error calling LangChain Agent:', error);
            throw error;
        }
    }

    function formatLLMResponse(text) {
        const container = document.createElement('div');
        container.className = 'formatted-response';
        let formattedText = text
            .replace(/^(\*|-)\s/gm, '<div class="list-item"><span class="bullet">•</span><span class="list-content">')
            .replace(/\n(\*|-)\s/gm, '</span></div><div class="list-item"><span class="bullet">•</span><span class="list-content">')
            .replace(/\n\n/g, '</p><p class="response-paragraph">')
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>')
            .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        if (!formattedText.startsWith('<')) {
            formattedText = `<p class="response-paragraph">${formattedText}</p>`;
        }
        formattedText += formattedText.includes('list-item') ? '</span></div>' : '';
        container.innerHTML = formattedText;
        return container;
    }

    // Public API
    return {
        init: (options) => {
            loadStylesheet();
            Object.assign(config, options);
            header.innerHTML = config.title;
            header.appendChild(closeBtn);
            button.style.backgroundColor = config.buttonColor;
            chatWindow.classList.add("open"); // Open chat by default
            addMessage(config.welcomeMessage, "bot-message");
        },
        destroy: () => {
            container.remove();
        }
    };
})();

export default Chatbot;
