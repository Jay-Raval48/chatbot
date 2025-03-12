// Import only the Groq client, which is browser-compatible
import { ChatGroq } from "https://cdn.jsdelivr.net/npm/@langchain/groq@0.1.0/dist/index.js";

// Load CSS dynamically
function loadStylesheet() {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/gh/Jay-Raval48/chatbot@latest/chatbot.css";
    document.head.appendChild(link);
}

// Hardcoded API key (move to server or build tool in production)
const GROQ_API_KEY = "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";

const ChatbotAgent = (function () {
    const config = {
        buttonColor: "#007bff",
        title: "Fusion Assistant",
        welcomeMessage: "I am your Fusion Assistant, how may I help you?",
    };

    let messagesContainer, chatWindow, ws;

    // WebSocket setup for server communication
    function initWebSocket() {
        ws = new WebSocket("ws://localhost:3000"); // Adjust to your server URL
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "reportResult") {
                const dataRows = handleReportResult(data.result);
                displayAnalysisResult(currentAnalysisType, dataRows); // Use stored analysis type
            } else if (data.type === "error") {
                addMessage(`Error: ${data.message}`, "bot-message");
            }
        };
        ws.onerror = (error) => console.error("WebSocket error:", error);
    }

    // Chatbot UI Setup
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
            showOptions();
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
        messagesContainer.appendChild(message);
        messages.scrollTop = messages.scrollHeight;
    }

    // Grok Client Setup
    const llm = new ChatGroq({
        apiKey: GROQ_API_KEY,
        model: "llama-3.3-70b-versatile",
    });

    // Simplified Agent Logic
    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        addMessage(text, "user-message");
        input.value = "";

        try {
            if (text.toLowerCase().includes("report") || text.toLowerCase().includes("po")) {
                // For simplicity, assume PO Assisto-like behavior; refine with NLP if needed
                addMessage("Please use the PO Assisto tile for reports.", "bot-message");
            } else {
                const response = await llm.invoke([
                    { role: "system", content: "You are a helpful Fusion Assistant. Use markdown for responses." },
                    { role: "user", content: text },
                ]);
                addMessage(response.content, "bot-message");
            }
        } catch (error) {
            addMessage("Sorry, I couldn’t process your request.", "bot-message");
            console.error(error);
        }
    }

    function formatLLMResponse(text) {
        const container = document.createElement("div");
        container.className = "formatted-response";
        let formattedText = text
            .replace(/^(\*|-)\s/gm, '<div class="list-item"><span class="bullet">•</span><span class="list-content">')
            .replace(/\n(\*|-)\s/gm, '</span></div><div class="list-item"><span class="bullet">•</span><span class="list-content">')
            .replace(/\n\n/g, '</p><p class="response-paragraph">')
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>')
            .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        if (!formattedText.startsWith("<")) {
            formattedText = `<p class="response-paragraph">${formattedText}</p>`;
        }
        formattedText += formattedText.includes("list-item") ? "</span></div>" : "";
        container.innerHTML = formattedText;
        return container;
    }

    function showOptions() {
        messagesContainer.innerHTML = "";
        addMessage(config.welcomeMessage, "bot-message");

        const tilesContainer = document.createElement("div");
        tilesContainer.className = "tiles-container";

        const tiles = [
            { name: "PO Assisto", handler: showPOInput },
            { name: "Item Assisto", handler: () => addMessage("Not implemented yet", "bot-message") },
            { name: "SO Assisto", handler: () => addMessage("Not implemented yet", "bot-message") },
            { name: "Costing Assisto", handler: () => addMessage("Not implemented yet", "bot-message") },
        ];

        tiles.forEach((tile) => {
            const tileElement = document.createElement("button");
            tileElement.className = "tile-button";
            tileElement.textContent = tile.name;
            tileElement.addEventListener("click", tile.handler);
            tilesContainer.appendChild(tileElement);
        });

        messagesContainer.appendChild(tilesContainer);
        messages.scrollTop = messages.scrollHeight;
    }

    let currentAnalysisType = null; // Store the current analysis type for WebSocket response

    function showPOInput() {
        messagesContainer.innerHTML = "";
        const inputContainer = document.createElement("div");
        inputContainer.className = "po-input-container";

        const itemLabel = document.createElement("label");
        itemLabel.textContent = "Item Number:";
        const itemInput = document.createElement("input");
        itemInput.type = "text";
        itemInput.placeholder = "Enter item number...";

        const buttonsContainer = document.createElement("div");
        buttonsContainer.className = "analysis-buttons";

        const analyses = [
            { text: "Last Purchase Price", type: "lastPrice" },
            { text: "Last 3 POs", type: "lastThree" },
            { text: "Price History", type: "priceHistory" },
        ];

        analyses.forEach((analysis) => {
            const button = document.createElement("button");
            button.className = "analysis-button";
            button.textContent = analysis.text;
            button.addEventListener("click", async () => {
                const itemNumber = itemInput.value.trim();
                if (!itemNumber) {
                    addMessage("Please enter an item number", "bot-message");
                    return;
                }

                addMessage(`${analysis.text} for item ${itemNumber}`, "user-message");
                button.disabled = true;
                button.textContent = "Analyzing...";

                try {
                    const parameters = { p_inventory_item_id: itemNumber };
                    const reportPath = "/Custom/SCM AI Agent/PO_RM.xdo";
                    currentAnalysisType = analysis.type; // Store for WebSocket response
                    ws.send(JSON.stringify({ type: "runReport", reportPath, parameters }));
                } catch (error) {
                    addMessage("Error: " + error.message, "bot-message");
                } finally {
                    button.disabled = false;
                    button.textContent = analysis.text;
                }
            });
            buttonsContainer.appendChild(button);
        });

        inputContainer.appendChild(itemLabel);
        inputContainer.appendChild(itemInput);
        inputContainer.appendChild(buttonsContainer);
        messagesContainer.appendChild(inputContainer);
    }

    function handleReportResult(reportText) {
        const reportData = atob(reportText.match(/<reportBytes>(.*?)<\/reportBytes>/s)[1]);
        const rows = reportData
            .split("\n")
            .filter((row) => row.trim())
            .map((row) => row.split(",").map((cell) => cell.replace(/^"|"$/g, "")));
        const headers = rows[0];
        return rows.slice(1).map((row) => {
            const rowData = {};
            headers.forEach((header, i) => (rowData[header] = row[i] || ""));
            return rowData;
        });
    }

    function displayAnalysisResult(type, data) {
        const resultDiv = document.createElement("div");
        resultDiv.className = "analysis-result";
        let resultHtml = '<div class="result-container">';

        switch (type) {
            case "lastPrice":
                if (data.length > 0) {
                    const lastPO = data[0];
                    resultHtml += `
                        <div class="result-card">
                            <h3>Last Purchase Details</h3>
                            <table class="result-table">
                                <tr><td><strong>PO Number</strong></td><td>${lastPO.PO_NUM}</td></tr>
                                <tr><td><strong>Price</strong></td><td>$${parseFloat(lastPO.PO_UNIT_PRICE).toFixed(2)}</td></tr>
                                <tr><td><strong>Date</strong></td><td>${lastPO.PO_DATE.split("T")[0]}</td></tr>
                                <tr><td><strong>Vendor</strong></td><td>${lastPO.VENDOR_NAME}</td></tr>
                            </table>
                        </div>`;
                }
                break;
            case "lastThree":
                const lastThree = data.slice(0, 3);
                resultHtml += `
                    <div class="result-card">
                        <h3>Last 3 Purchase Orders</h3>
                        <table class="result-table">
                            <thead><tr><th>PO Number</th><th>Price</th><th>Date</th><th>Vendor</th></tr></thead>
                            <tbody>${lastThree
                                .map(
                                    (row) => `
                                <tr>
                                    <td>${row.PO_NUM}</td>
                                    <td>$${parseFloat(row.PO_UNIT_PRICE).toFixed(2)}</td>
                                    <td>${row.PO_DATE.split("T")[0]}</td>
                                    <td>${row.VENDOR_NAME}</td>
                                </tr>`
                                )
                                .join("")}
                            </tbody>
                        </table>
                    </div>`;
                break;
            case "priceHistory":
                const prices = data.map((row) => parseFloat(row.PO_UNIT_PRICE));
                resultHtml += `
                    <div class="result-card">
                        <h3>Price History Analysis</h3>
                        <table class="result-table">
                            <tr><td><strong>Highest Price</strong></td><td>$${Math.max(...prices).toFixed(2)}</td></tr>
                            <tr><td><strong>Lowest Price</strong></td><td>$${Math.min(...prices).toFixed(2)}</td></tr>
                            <tr><td><strong>Current Price</strong></td><td>$${prices[0].toFixed(2)}</td></tr>
                        </table>
                    </div>`;
                break;
        }
        resultHtml += "</div>";
        resultDiv.innerHTML = resultHtml;
        messagesContainer.appendChild(resultDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    return {
        init: (options) => {
            loadStylesheet();
            Object.assign(config, options);
            header.innerHTML = config.title;
            header.appendChild(closeBtn);
            button.style.backgroundColor = config.buttonColor;
            chatWindow.classList.add("open");
            showOptions();
            initWebSocket();
        },
        destroy: () => {
            container.remove();
            if (ws) ws.close();
        },
    };
})();

export default ChatbotAgent;
