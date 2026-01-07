// Theme Manager
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.applyTheme();
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.currentTheme);
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        this.applyTheme();
    }

    getTheme() {
        return this.currentTheme;
    }
}

const themeManager = new ThemeManager();

// Listen to tool-wrapper theme changes
window.addEventListener('themeChanged', (e) => {
    themeManager.currentTheme = e.detail;
    themeManager.applyTheme();
});

// Listen to tool-wrapper language changes
window.addEventListener('languageChanged', (e) => {
    const newLang = e.detail;
    localStorage.setItem('lang', newLang);
    // Reload page to apply language changes
    location.reload();
});


// Configuration
// این Gist ID را با Gist ID خودتان جایگزین کنید (بعد از ایجاد Gist)
const SHARED_GIST_ID = 'a849e740120bdad160bc14c49873285b'; // Gist ID مشترک برای همه کاربران

// Token مشترک برای نوشتن روی Gist (اختیاری - اگر خالی باشد، کاربر باید Token خود را وارد کند)
// برای ایجاد Token: https://github.com/settings/tokens → Generate new token → دسترسی gist را فعال کنید
const SHARED_TOKEN = ''; // Token مشترک - اگر می‌خواهید همه بتوانند بنویسند، اینجا قرار دهید

const GITHUB_TOKEN_KEY = 'github_token';
const USERNAME_KEY = 'chat_username';
const POLL_INTERVAL = 2000; // 2 seconds

// State
let currentUsername = '';
let githubToken = '';
let gistId = SHARED_GIST_ID || '';
let messages = [];
let pollInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSavedData();
    setupEventListeners();
    checkSetup();
});

function loadSavedData() {
    currentUsername = localStorage.getItem(USERNAME_KEY) || '';
    // استفاده از Token مشترک یا Token شخصی کاربر
    githubToken = SHARED_TOKEN || localStorage.getItem(GITHUB_TOKEN_KEY) || '';
    // استفاده از Gist ID مشترک یا از localStorage
    gistId = SHARED_GIST_ID || localStorage.getItem('chat_gist_id') || '';

    if (currentUsername) {
        showChatInterface();
    }
}

function setupEventListeners() {
    document.getElementById('setUsernameBtn').addEventListener('click', setUsername);
    document.getElementById('usernameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') setUsername();
    });

    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    document.getElementById('saveTokenBtn').addEventListener('click', saveToken);
    document.getElementById('githubTokenInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveToken();
    });
}

function checkSetup() {
    // اگر Gist ID وجود دارد، می‌توانیم پیام‌ها را بخوانیم (بدون Token)
    if (gistId) {
        startPolling();
    }
    
    // برای ارسال پیام نیاز به Token است
    // اگر Token مشترک وجود دارد، نیازی به وارد کردن Token نیست
    if (!githubToken && !SHARED_TOKEN) {
        document.getElementById('setupSection').style.display = 'block';
    } else {
        document.getElementById('setupSection').style.display = 'none';
    }
    
    // اگر Gist ID نداریم و Token داریم، Gist ایجاد می‌کنیم
    if (!gistId && githubToken) {
        createGist();
    }
}

function saveToken() {
    const token = document.getElementById('githubTokenInput').value.trim();
    if (!token) {
        alert('لطفاً Token را وارد کنید');
        return;
    }

    // اگر Token مشترک وجود دارد، از آن استفاده می‌کنیم، در غیر این صورت از Token شخصی
    if (SHARED_TOKEN) {
        githubToken = SHARED_TOKEN;
    } else {
        githubToken = token;
        localStorage.setItem(GITHUB_TOKEN_KEY, token);
    }
    
    document.getElementById('setupSection').style.display = 'none';
    
    if (!gistId) {
        createGist();
    } else {
        startPolling();
    }
}

async function createGist() {
    // استفاده از Token مشترک یا Token شخصی
    const tokenToUse = SHARED_TOKEN || githubToken;
    if (!tokenToUse) return;

    try {
        // Gist را public می‌کنیم تا همه بتوانند بخوانند
        const response = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: {
                'Authorization': `token ${tokenToUse}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                description: 'Chat Messages Storage - Shared Chat Room',
                public: true, // Public برای اینکه همه بتوانند بخوانند
                files: {
                    'messages.json': {
                        content: JSON.stringify([], null, 2)
                    }
                }
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert('Token نامعتبر است. لطفاً Token جدیدی ایجاد کنید.');
                localStorage.removeItem(GITHUB_TOKEN_KEY);
                githubToken = '';
                document.getElementById('setupSection').style.display = 'block';
                return;
            }
            throw new Error('خطا در ایجاد Gist');
        }

        const data = await response.json();
        gistId = data.id;
        // ذخیره Gist ID برای استفاده بعدی
        localStorage.setItem('chat_gist_id', gistId);
        
        // نمایش Gist ID در رابط کاربری
        const gistIdDisplay = document.getElementById('gistIdDisplay');
        const gistIdInfo = document.getElementById('gistIdInfo');
        if (gistIdDisplay && gistIdInfo) {
            gistIdDisplay.textContent = gistId;
            gistIdInfo.style.display = 'block';
        }
        
        // نمایش Gist ID به کاربر برای به‌اشتراک‌گذاری
        alert(`✅ Gist با موفقیت ایجاد شد!\n\nGist ID: ${gistId}\n\nلطفاً این ID را در فایل script.js قرار دهید (خط 4، متغیر SHARED_GIST_ID) تا همه کاربران بتوانند از آن استفاده کنند.`);
        
        startPolling();
    } catch (error) {
        console.error('Error creating gist:', error);
        alert('خطا در اتصال به GitHub. لطفاً دوباره تلاش کنید.');
    }
}

async function loadMessages() {
    if (!gistId) return;

    try {
        // برای خواندن Gist public نیازی به Token نیست
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };
        
        // اگر Token داریم، از آن استفاده می‌کنیم (برای Gist private)
        if (githubToken) {
            headers['Authorization'] = `token ${githubToken}`;
        }

        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            headers: headers
        });

        if (!response.ok) {
            if (response.status === 404) {
                // Gist not found
                if (githubToken) {
                    // اگر Token داریم، Gist جدید ایجاد می‌کنیم
                    createGist();
                } else {
                    console.log('Gist پیدا نشد. برای ایجاد Gist نیاز به Token است.');
                }
                return;
            }
            if (response.status === 401 || response.status === 403) {
                // نیاز به Token برای خواندن Gist private
                console.log('برای خواندن این Gist نیاز به Token است.');
                return;
            }
            throw new Error('خطا در بارگذاری پیام‌ها');
        }

        const data = await response.json();
        const content = data.files['messages.json'].content;
        const loadedMessages = JSON.parse(content);

        // Only update if messages changed
        if (JSON.stringify(messages) !== JSON.stringify(loadedMessages)) {
            messages = loadedMessages;
            displayMessages();
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

async function saveMessage(message) {
    if (!gistId) return;
    
    // استفاده از Token مشترک یا Token شخصی
    const tokenToUse = SHARED_TOKEN || githubToken;
    if (!tokenToUse) {
        alert('برای ارسال پیام نیاز به GitHub Token است. لطفاً Token را وارد کنید.');
        return;
    }

    messages.push(message);

    try {
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${tokenToUse}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                files: {
                    'messages.json': {
                        content: JSON.stringify(messages, null, 2)
                    }
                }
            })
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('Token نامعتبر است یا دسترسی ندارید');
            }
            throw new Error('خطا در ذخیره پیام');
        }

        displayMessages();
    } catch (error) {
        console.error('Error saving message:', error);
        messages.pop(); // Remove message if save failed
        alert('خطا در ارسال پیام: ' + error.message);
    }
}

function setUsername() {
    const username = document.getElementById('usernameInput').value.trim();
    if (!username) {
        alert('لطفاً نام کاربری خود را وارد کنید');
        return;
    }

    currentUsername = username;
    localStorage.setItem(USERNAME_KEY, username);
    showChatInterface();
}

function logout() {
    currentUsername = '';
    localStorage.removeItem(USERNAME_KEY);
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('currentUser').style.display = 'none';
    document.getElementById('chatInputContainer').style.display = 'none';
    document.getElementById('messages').innerHTML = `
        <div class="welcome-message">
            <p>👋 به سیستم چت خوش آمدید!</p>
            <p>لطفاً ابتدا نام کاربری خود را وارد کنید.</p>
        </div>
    `;
    document.getElementById('usernameInput').value = '';
}

function showChatInterface() {
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('currentUser').style.display = 'flex';
    document.getElementById('usernameDisplay').textContent = currentUsername;
    
    // نمایش Gist ID اگر وجود دارد
    const gistIdDisplay = document.getElementById('gistIdDisplay');
    const gistIdInfo = document.getElementById('gistIdInfo');
    if (gistId && gistIdDisplay && gistIdInfo) {
        gistIdDisplay.textContent = gistId;
        gistIdInfo.style.display = 'block';
    }
    
    // اگر Token مشترک یا Token شخصی داریم، می‌توانیم بنویسیم
    const tokenToUse = SHARED_TOKEN || githubToken;
    if (tokenToUse) {
        document.getElementById('chatInputContainer').style.display = 'block';
    } else {
        document.getElementById('chatInputContainer').style.display = 'none';
        // نمایش پیام که برای ارسال نیاز به Token است
        const messagesDiv = document.getElementById('messages');
        if (!messagesDiv.querySelector('.welcome-message')) {
            const welcomeMsg = document.createElement('div');
            welcomeMsg.className = 'welcome-message';
            welcomeMsg.innerHTML = '<p>💬 شما می‌توانید پیام‌ها را ببینید</p><p>⚠️ برای ارسال پیام نیاز به GitHub Token دارید</p>';
            messagesDiv.appendChild(welcomeMsg);
        }
    }
    
    // Clear welcome message
    const messagesDiv = document.getElementById('messages');
    if (messagesDiv.querySelector('.welcome-message') && tokenToUse) {
        messagesDiv.innerHTML = '';
    }

    if (gistId) {
        loadMessages();
        startPolling();
    }
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();

    if (!text) return;
    if (!currentUsername) {
        alert('لطفاً ابتدا نام کاربری خود را وارد کنید');
        return;
    }
    
    // بررسی وجود Token (مشترک یا شخصی)
    const tokenToUse = SHARED_TOKEN || githubToken;
    if (!tokenToUse) {
        alert('لطفاً ابتدا GitHub Token را تنظیم کنید');
        document.getElementById('setupSection').style.display = 'block';
        return;
    }

    const message = {
        id: Date.now(),
        username: currentUsername,
        text: text,
        timestamp: new Date().toISOString()
    };

    input.value = '';
    saveMessage(message);
}

function displayMessages() {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';

    if (messages.length === 0) {
        messagesDiv.innerHTML = '<div class="welcome-message"><p>هنوز پیامی ارسال نشده است. اولین پیام را شما بفرستید! 🎉</p></div>';
        return;
    }

    messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.username === currentUsername ? 'own' : 'other'}`;

        const time = new Date(msg.timestamp);
        const timeString = time.toLocaleTimeString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-username">${escapeHtml(msg.username)}</span>
                <span class="message-time">${timeString}</span>
            </div>
            <div class="message-content">${escapeHtml(msg.text)}</div>
        `;

        messagesDiv.appendChild(messageDiv);
    });

    // Scroll to bottom
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function startPolling() {
    if (pollInterval) {
        clearInterval(pollInterval);
    }
    loadMessages(); // Load immediately
    pollInterval = setInterval(loadMessages, POLL_INTERVAL);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (pollInterval) {
        clearInterval(pollInterval);
    }
});


