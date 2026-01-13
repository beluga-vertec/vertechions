// ====================================
// AI CHATBOT CONFIGURATION
// ====================================

// Replace with your actual Gemini API key
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

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

// Toggle chatbot window
chatbotToggle.addEventListener('click', () => {
    chatbotWindow.classList.toggle('active');
    if (chatbotWindow.classList.contains('active')) {
        chatbotInput.focus();
    }
});

// Close chatbot window
chatbotClose.addEventListener('click', () => {
    chatbotWindow.classList.remove('active');
});

// Add message to chat
function addMessage(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    // Check if this is the error message that needs clickable links
    if (message === "ERROR_MESSAGE_WITH_LINKS") {
        messageDiv.innerHTML = `I apologize, but I'm having trouble connecting right now. Please contact us directly at <a href="https://wa.me/601172570041" target="_blank" style="color: #06B6D4; text-decoration: underline;">011-7257 0041</a> or <a href="mailto:hello@vertechions.com" style="color: #06B6D4; text-decoration: underline;">hello@vertechions.com</a> for immediate assistance!`;
    } else {
        messageDiv.textContent = message;
    }
    
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
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

// Send message to Gemini API
async function sendToGemini(userMessage) {
    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${companyContext}\n\nUser question: ${userMessage}\n\nProvide a helpful, concise response:`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500,
                }
            })
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        // Return a special marker that will be converted to clickable links
        return "ERROR_MESSAGE_WITH_LINKS";
    }
}

// Send message function
async function sendMessage() {
    const message = chatbotInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, true);
    chatbotInput.value = '';
    chatbotSend.disabled = true;

    // Show typing indicator
    showTypingIndicator();

    // Get AI response
    const response = await sendToGemini(message);
    
    // Remove typing indicator and add bot response
    removeTypingIndicator();
    addMessage(response);
    
    chatbotSend.disabled = false;
    chatbotInput.focus();
}

// Check if API key is set
if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    console.warn('⚠️ Gemini API key not configured. Please add your API key in chatbot.js to enable the chatbot.');
}