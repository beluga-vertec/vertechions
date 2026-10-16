// ====================================
// AI CHATBOT CONFIGURATION
// ====================================

// Company context for the AI
const companyContext = `You are an AI assistant for Vertechions, a specialist remote VoIP and SIP engineering support service for telecom providers, hosted PBX operators, managed service providers, and unified communications integrators.

Services offered:
1. SIP and call-flow diagnostics: registration failures, call setup problems, call drops, SIP 4xx/5xx responses, and routing investigations.
2. RTP and audio troubleshooting: one-way/no audio, SDP, NAT/firewall behaviour, packet capture review, and SIP ladder analysis.
3. SBC and UC interoperability: investigation involving SIP trunks, session border controllers, PBX platforms, and Microsoft Teams voice.
4. Technical overflow support: remote incident investigation and concise written findings / recommended next checks.
5. Website development and web applications are secondary services.

Contact:
- Email: hello@vertechions.com
- Location: Kuala Lumpur, Malaysia

When answering questions:
- Be friendly, professional, and technically precise.
- Focus primarily on VoIP, SIP, RTP, SBC, PBX, and unified communications troubleshooting.
- Do not claim 24/7 availability or guarantee a resolution.
- If asked about pricing, explain that scope and pricing depend on the incident and ask the person to email hello@vertechions.com.
- Encourage users to contact us by email; do not mention WhatsApp or a public phone number.
- Remind users not to share passwords, credentials, or confidential customer data.
- If you don't know something specific, be honest and suggest contacting us by email.
- Keep responses concise and conversational (2-4 sentences usually).`;

// ====================================
// CHATBOT FUNCTIONALITY
// ====================================

// Get DOM elements
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotWindow = document.getElementById('chatbotWindow');
const chatbotClose = document.getElementById('chatbotClose');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotInput = document.getElementById('chatbotInput');
const chatbotSend = document.getElementById('chatbotSend');

// Session storage key for chat history
const CHAT_HISTORY_KEY = 'vertechions_chat_history';

// Load chat history from sessionStorage when page loads
function loadChatHistory() {
    const savedHistory = sessionStorage.getItem(CHAT_HISTORY_KEY);
    if (savedHistory) {
        try {
            const messages = JSON.parse(savedHistory);
            chatbotMessages.innerHTML = '';
            messages.forEach(msg => {
                addMessageToDOM(msg.text, msg.isUser, msg.isError);
            });
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }
}

// Save chat history to sessionStorage
function saveChatHistory() {
    const messages = [];
    const messageElements = chatbotMessages.querySelectorAll('.message:not(.typing)');
    messageElements.forEach(element => {
        const isUser = element.classList.contains('user');
        const isError = element.innerHTML.includes('CONTACT_BY_EMAIL_ONLY');
        const text = isError ? 'CONTACT_BY_EMAIL_ONLY' : element.textContent;
        messages.push({ text, isUser, isError });
    });
    sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
}

// Toggle chatbot window
chatbotToggle.addEventListener('click', () => {
    chatbotWindow.classList.toggle('active');
});

// Close chatbot window
chatbotClose.addEventListener('click', () => {
    chatbotWindow.classList.remove('active');
});

// Add message to DOM only (without saving)
function addMessageToDOM(message, isUser = false, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    if (message === "CONTACT_BY_EMAIL_ONLY" || isError) {
        messageDiv.innerHTML = `I’m having trouble connecting right now. Please email <a href="mailto:hello@vertechions.com" style="color: #06B6D4; text-decoration: underline;">hello@vertechions.com</a> and describe the issue you need help investigating.`;
    } else {
        messageDiv.textContent = message;
    }
    
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Add message to chat and save to history
function addMessage(message, isUser = false) {
    addMessageToDOM(message, isUser);
    saveChatHistory();
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot typing';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    chatbotMessages.appendChild(typingDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Send message to YOUR Vercel API endpoint (not directly to Gemini)
async function sendToGemini(userMessage) {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userMessage: userMessage,
                context: companyContext
            })
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Error calling API:', error);
        return "CONTACT_BY_EMAIL_ONLY";
    }
}

// Send message function
async function sendMessage() {
    const message = chatbotInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    chatbotInput.value = '';
    chatbotSend.disabled = true;

    showTypingIndicator();

    const response = await sendToGemini(message);
    
    removeTypingIndicator();
    addMessage(response);
    
    chatbotSend.disabled = false;
    chatbotInput.focus();
}

// Load chat history when page loads
loadChatHistory();