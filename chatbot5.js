const Chatbot = (function () {
    const config = {
        buttonColor: "#007bff",
        title: "Fusion Assistant",
        welcomeMessage: "I am your Fusion Assistant, how may I help you?",
        apiHost: null,
    };

    // Hardcoded Grok API key (recommended for CSP compliance)
    const GROQ_API_KEY = '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';

    // DOM Elements
    let messagesContainer, chatWindow;

    // Inject CSS dynamically
    function loadStylesheet() {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdn.jsdelivr.net/gh/Jay-Raval48/chatbot@latest/chatbot.css";
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
        const response = await askGroq(text);
        addMessage(response, "bot-message");
    } catch (error) {
        addMessage("Sorry, I couldn’t process your request.", "bot-message");
    }
}

    // Grok API Integration
    async function askGroq(question) {
        const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
        try {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "system",
                            content: "You are a helpful assistant. Format your responses using markdown."
                        },
                        { role: "user", content: question }
                    ]
                })
            });
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Error calling Groq API:', error);
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
        formattedText += '</span></div>';
        container.innerHTML = formattedText;
        return container;
    }

    // Oracle Report Integration
    async function runOracleReport(reportPath, parameters) {
        const endpoint = "https://fa-elzx-dev10-saasfaprod1.fa.ocs.oraclecloud.com/xmlpserver/services/v2/ReportService?wsdl";
        const username = "ritu.bhalavat@mastek.com";
        const password = "Welcome@123";
        
        const parameterXML = generateParameterXML(parameters);
        
        const payload = `
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v2="http://xmlns.oracle.com/oxp/service/v2">
                <soapenv:Body>
                    <v2:runReport>
                        <v2:reportRequest>
                            ${parameterXML}
                            <v2:attributeFormat>csv</v2:attributeFormat>
                            <v2:reportAbsolutePath>${reportPath}</v2:reportAbsolutePath>
                        </v2:reportRequest>
                        <v2:userID>${username}</v2:userID>
                        <v2:password>${password}</v2:password>
                    </v2:runReport>
                </soapenv:Body>
            </soapenv:Envelope>
        `;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': 'runReport'
            },
            body: payload
        });
        return await response.text();
    }

    function generateParameterXML(parameters) {
        if (!parameters) return "";
        let parameterXML = "<v2:parameterNameValues><v2:listOfParamNameValues>";
        for (const [name, value] of Object.entries(parameters)) {
            parameterXML += `
                <v2:item>
                    <v2:name>${name}</v2:name>
                    <v2:values><v2:item>${value}</v2:item></v2:values>
                </v2:item>`;
        }
        parameterXML += "</v2:listOfParamNameValues></v2:parameterNameValues>";
        return parameterXML;
    }

    async function processReportData(reportText) {
        const reportData = atob(reportText.match(/<reportBytes>(.*?)<\/reportBytes>/s)[1]);
        const rows = reportData.split("\n")
            .filter(row => row.trim())
            .map(row => row.split(',').map(cell => cell.replace(/^"|"$/g, '')));
        const headers = rows[0];
        return rows.slice(1).map(row => {
            const rowData = {};
            headers.forEach((header, i) => rowData[header] = row[i] || '');
            return rowData;
        });
    }

    // Display Analysis Result
    function displayAnalysisResult(type, data) {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'analysis-result';
        let resultHtml = '<div class="result-container">';
        
        switch (type) {
            case 'lastPrice':
                if (data.length > 0) {
                    const lastPO = data[0];
                    resultHtml += `
                        <div class="result-card">
                            <h3>Last Purchase Details</h3>
                            <table class="result-table">
                                <tr><td><strong>PO Number</strong></td><td>${lastPO.PO_NUM}</td></tr>
                                <tr><td><strong>Price</strong></td><td>$${parseFloat(lastPO.PO_UNIT_PRICE).toFixed(2)}</td></tr>
                                <tr><td><strong>Date</strong></td><td>${lastPO.PO_DATE.split('T')[0]}</td></tr>
                                <tr><td><strong>Vendor</strong></td><td>${lastPO.VENDOR_NAME}</td></tr>
                            </table>
                        </div>`;
                }
                break;
            case 'lastThree':
                const lastThree = data.slice(0, 3);
                resultHtml += `
                    <div class="result-card">
                        <h3>Last 3 Purchase Orders</h3>
                        <table class="result-table">
                            <thead><tr><th>PO Number</th><th>Price</th><th>Date</th><th>Vendor</th></tr></thead>
                            <tbody>${lastThree.map(row => `
                                <tr>
                                    <td>${row.PO_NUM}</td>
                                    <td>$${parseFloat(row.PO_UNIT_PRICE).toFixed(2)}</td>
                                    <td>${row.PO_DATE.split('T')[0]}</td>
                                    <td>${row.VENDOR_NAME}</td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>`;
                break;
            case 'priceHistory':
                const prices = data.map(row => parseFloat(row.PO_UNIT_PRICE));
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
        resultHtml += '</div>';
        resultDiv.innerHTML = resultHtml;
        messagesContainer.appendChild(resultDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Show Options
    function showOptions() {
        messagesContainer.innerHTML = '';
        addMessage(config.welcomeMessage, "bot-message");
        
        const tilesContainer = document.createElement('div');
        tilesContainer.className = 'tiles-container';
        
        const tiles = [
            { name: 'PO Assisto', handler: showPOInput },
            { name: 'Item Assisto', handler: () => addMessage("Not implemented yet", "bot-message") },
            { name: 'SO Assisto', handler: () => addMessage("Not implemented yet", "bot-message") },
            { name: 'Costing Assisto', handler: () => addMessage("Not implemented yet", "bot-message") }
        ];

        tiles.forEach(tile => {
            const tileElement = document.createElement('button');
            tileElement.className = 'tile-button';
            tileElement.textContent = tile.name;
            tileElement.addEventListener('click', tile.handler);
            tilesContainer.appendChild(tileElement);
        });

        messagesContainer.appendChild(tilesContainer);
    }

    // Show PO Input Form
    function showPOInput() {
        messagesContainer.innerHTML = '';
        const inputContainer = document.createElement('div');
        inputContainer.className = 'po-input-container';

        const itemLabel = document.createElement('label');
        itemLabel.textContent = 'Item Number:';
        const itemInput = document.createElement('input');
        itemInput.type = 'text';
        itemInput.placeholder = 'Enter item number...';

        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'analysis-buttons';

        const analyses = [
            { text: 'Last Purchase Price', type: 'lastPrice' },
            { text: 'Last 3 POs', type: 'lastThree' },
            { text: 'Price History', type: 'priceHistory' }
        ];

        analyses.forEach(analysis => {
            const button = document.createElement('button');
            button.className = 'analysis-button';
            button.textContent = analysis.text;
            button.addEventListener('click', async () => {
                const itemNumber = itemInput.value.trim();
                if (!itemNumber) {
                    addMessage("Please enter an item number", "bot-message");
                    return;
                }

                addMessage(`${analysis.text} for item ${itemNumber}`, "user-message");
                button.disabled = true;
                button.textContent = 'Analyzing...';

                try {
                    const parameters = { p_inventory_item_id: itemNumber };
                    const response = await runOracleReport('/Custom/SCM AI Agent/PO_RM.xdo', parameters);
                    const dataRows = await processReportData(response);
                    displayAnalysisResult(analysis.type, dataRows);
                } catch (error) {
                    addMessage('Error: ' + error.message, "bot-message");
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

    // Public API
    return {
        init: (options) => {
            loadStylesheet();
            Object.assign(config, options);
            header.innerHTML = config.title;
            header.appendChild(closeBtn);
            button.style.backgroundColor = config.buttonColor;
            showOptions();
        },
        destroy: () => {
            container.remove();
        }
    };
})();

export default Chatbot;
