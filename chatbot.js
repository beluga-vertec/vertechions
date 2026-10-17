// ====================================
// VERTECHIONS WEBSITE CHATBOT
// ====================================

const CHAT_HISTORY_KEY = 'vertechions_chat_history_v2';
const FALLBACK_REPLY = 'I can’t connect to the AI assistant right now. Please try again shortly, or email hello@vertechions.com.';

const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotWindow = document.getElementById('chatbotWindow');
const chatbotClose = document.getElementById('chatbotClose');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotInput = document.getElementById('chatbotInput');
const chatbotSend = document.getElementById('chatbotSend');

function addMessageToDOM(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;

    // Render plain text safely. Only the fallback contact address is linked.
    if (!isUser && message.includes('hello@vertechions.com')) {
        const parts = message.split('hello@vertechions.com');
        messageDiv.appendChild(document.createTextNode(parts[0]));
        const emailLink = document.createElement('a');
        emailLink.href = 'mailto:hello@vertechions.com';
        emailLink.textContent = 'hello@vertechions.com';
        emailLink.style.color = '#06B6D4';
        emailLink.style.textDecoration = 'underline';
        messageDiv.appendChild(emailLink);
        if (parts.length > 1) messageDiv.appendChild(document.createTextNode(parts.slice(1).join('hello@vertechions.com')));
    } else {
        messageDiv.textContent = message;
    }

    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function loadChatHistory() {
    try {
        const savedHistory = sessionStorage.getItem(CHAT_HISTORY_KEY);
        if (!savedHistory) return;
        const messages = JSON.parse(savedHistory);
        if (!Array.isArray(messages)) return;
        chatbotMessages.innerHTML = '';
        messages.slice(-30).forEach(msg => {
            if (typeof msg.text === 'string') addMessageToDOM(msg.text, Boolean(msg.isUser));
        });
    } catch (error) {
        console.warn('Could not load chatbot history:', error);
    }
}

function saveChatHistory() {
    try {
        const messages = Array.from(chatbotMessages.querySelectorAll('.message:not(.typing)'))
            .map(element => ({
                text: element.textContent || '',
                isUser: element.classList.contains('user')
            }))
            .slice(-30);
        sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    } catch (error) {
        console.warn('Could not save chatbot history:', error);
    }
}

function addMessage(message, isUser = false) {
    addMessageToDOM(message, isUser);
    saveChatHistory();
}

function showTypingIndicator() {
    removeTypingIndicator();
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot typing';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    chatbotMessages.appendChild(typingDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function removeTypingIndicator() {
    document.getElementById('typingIndicator')?.remove();
}

async function sendToAssistant(userMessage) {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ userMessage })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || 'The assistant could not respond.');
    }
    if (typeof data.reply !== 'string' || !data.reply.trim()) {
        throw new Error('The assistant returned an empty response.');
    }
    return data.reply.trim();
}

async function sendMessage() {
    if (!chatbotInput || !chatbotSend || chatbotSend.disabled) return;
    const message = chatbotInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    chatbotInput.value = '';
    chatbotSend.disabled = true;
    chatbotInput.disabled = true;
    showTypingIndicator();

    try {
        const reply = await sendToAssistant(message);
        removeTypingIndicator();
        addMessage(reply);
    } catch (error) {
        console.error('Vertechions chatbot error:', error);
        removeTypingIndicator();
        addMessage(FALLBACK_REPLY);
    } finally {
        chatbotSend.disabled = false;
        chatbotInput.disabled = false;
        chatbotInput.focus();
    }
}

if (chatbotToggle && chatbotWindow) {
    chatbotToggle.addEventListener('click', () => chatbotWindow.classList.toggle('active'));
}
if (chatbotClose && chatbotWindow) {
    chatbotClose.addEventListener('click', () => chatbotWindow.classList.remove('active'));
}
if (chatbotSend) chatbotSend.addEventListener('click', sendMessage);
if (chatbotInput) {
    chatbotInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    });
}

loadChatHistory();
