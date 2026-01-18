// ====================================
// AI CHATBOT CONFIGURATION
// ====================================

// Company context for the AI
const companyContext = `You are an AI assistant for Vertechions, a web development and IT infrastructure company based in Kuala Lumpur, Malaysia.

Company Information:
- Founded: 2025
- Mission: To make professional technology accessible to everyone, helping businesses thrive through custom digital solutions
- Experience: 6+ years professional experience in system engineering, software development, network infrastructure, and unified communications
- Coding since: 2013

Services offered:
1. Website Development: Custom website design, mobile-responsive layouts, SEO optimization, e-commerce integration
2. Custom Web Applications: Online ordering systems, inventory management, payment gateway integration, admin dashboards
3. IT Infrastructure: VoIP system setup, PBX configuration, SBC implementation, 24/7 technical support

Contact:
- Phone/WhatsApp: 011-7257 0041
- Email: hello@vertechions.com
- Location: Kuala Lumpur, Malaysia

When answering questions:
- Be friendly, professional, and helpful
- Focus on Vertechions' services and expertise
- If asked about pricing, explain that we provide custom quotes based on project requirements and suggest contacting us for a consultation
- Encourage users to reach out via WhatsApp or email for detailed discussions
- If you don't know something specific, be honest and suggest contacting the team directly
- Keep responses concise and conversational (2-4 sentences usually)`;

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
        const isError = element.innerHTML.includes('ERROR_MESSAGE_WITH_LINKS') || element.innerHTML.includes('wa.me');
        const text = isError ? 'ERROR_MESSAGE_WITH_LINKS' : element.textContent;
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
    
    if (message === "ERROR_MESSAGE_WITH_LINKS" || isError) {
        messageDiv.innerHTML = `I apologize, but I'm having trouble connecting right now. Please contact us directly at <a href="https://wa.me/601172570041" target="_blank" style="color: #06B6D4; text-decoration: underline;">011-7257 0041</a> or <a href="mailto:hello@vertechions.com" style="color: #06B6D4; text-decoration: underline;">hello@vertechions.com</a> for immediate assistance!`;
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
        return "ERROR_MESSAGE_WITH_LINKS";
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