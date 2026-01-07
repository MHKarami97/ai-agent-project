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


// ==================== Local Board Application ====================
// Main application logic for Local Bulletin Board

'use strict';

// ==================== Configuration ====================
const CONFIG = {
    STORAGE_KEY: 'localBoardMessages',
    NOTIFICATION_PERMISSION: 'localBoardNotification',
    DEVICE_ID_KEY: 'localBoardDeviceId',
    DEVICE_NAME_KEY: 'localBoardDeviceName',
    MESSAGE_VIEWS_KEY: 'localBoardMessageViews',
    MAX_MESSAGES: 100,
    TOAST_DURATION: 3000,
    PEERJS_CONFIG: {
        host: 'peerjs-server.herokuapp.com',
        secure: true,
        port: 443
    }
};

// ==================== State Management ====================
class AppState {
    constructor() {
        this.messages = this.loadMessages();
        this.currentFilter = 'همه';
        this.notificationsEnabled = this.checkNotificationPermission();
    }

    loadMessages() {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading messages:', error);
            return [];
        }
    }

    saveMessages() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.messages));
            return true;
        } catch (error) {
            console.error('Error saving messages:', error);
            showToast('خطا در ذخیره‌سازی پیام', 'error');
            return false;
        }
    }

    addMessage(message) {
        // Limit number of messages
        if (this.messages.length >= CONFIG.MAX_MESSAGES) {
            this.messages.shift(); // Remove oldest message
        }
        
        this.messages.unshift(message);
        this.saveMessages();
    }

    deleteMessage(id) {
        this.messages = this.messages.filter(msg => msg.id !== id);
        this.saveMessages();
    }

    clearAllMessages() {
        this.messages = [];
        this.saveMessages();
    }

    getFilteredMessages() {
        if (this.currentFilter === 'همه') {
            return this.messages;
        }
        return this.messages.filter(msg => msg.category === this.currentFilter);
    }

    checkNotificationPermission() {
        return localStorage.getItem(CONFIG.NOTIFICATION_PERMISSION) === 'granted';
    }

    setNotificationPermission(granted) {
        localStorage.setItem(CONFIG.NOTIFICATION_PERMISSION, granted ? 'granted' : 'denied');
        this.notificationsEnabled = granted;
    }
}

// ==================== Initialize State ====================
const appState = new AppState();

// ==================== DOM Elements ====================
const elements = {
    messageForm: document.getElementById('messageForm'),
    messageTitle: document.getElementById('messageTitle'),
    messageContent: document.getElementById('messageContent'),
    messageCategory: document.getElementById('messageCategory'),
    senderName: document.getElementById('senderName'),
    messagesList: document.getElementById('messagesList'),
    emptyState: document.getElementById('emptyState'),
    filterButtons: document.querySelectorAll('.filter-btn'),
    clearButton: document.getElementById('clearMessages'),
    notificationButton: document.getElementById('enableNotifications'),
    toast: document.getElementById('toast')
};

// ==================== Message Management ====================
class Message {
    constructor(title, content, category, sender) {
        this.id = Date.now() + Math.random().toString(36).substr(2, 9);
        this.title = title;
        this.content = content;
        this.category = category;
        this.sender = sender || 'ناشناس';
        this.timestamp = new Date().toISOString();
    }
}

function createMessage(title, content, category, sender) {
    const message = new Message(title, content, category, sender);
    appState.addMessage(message);
    
    // Mark as viewed by this device (creator always views their own message)
    markMessageAsViewed(message.id, getDeviceId(), getDeviceName());
    
    // Broadcast to connected peers
    if (p2pManager && p2pManager.connections.size > 0) {
        p2pManager.broadcastMessage(message);
    }
    
    // Send notification
    if (appState.notificationsEnabled) {
        sendNotification(message);
    }
    
    return message;
}

function deleteMessage(id) {
    appState.deleteMessage(id);
    
    // Broadcast deletion to peers
    if (p2pManager && p2pManager.connections.size > 0) {
        p2pManager.broadcastMessageDeletion(id);
    }
    
    renderMessages();
    showToast('پیام با موفقیت حذف شد', 'success');
}

function clearAllMessages() {
    if (confirm('آیا از پاک کردن همه پیام‌ها اطمینان دارید؟')) {
        appState.clearAllMessages();
        renderMessages();
        showToast('تمام پیام‌ها حذف شدند', 'info');
    }
}

// ==================== Rendering ====================
function formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    
    // Less than a minute
    if (diff < 60000) {
        return 'همین الان';
    }
    
    // Less than an hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} دقیقه پیش`;
    }
    
    // Less than a day
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} ساعت پیش`;
    }
    
    // Format as date
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Intl.DateTimeFormat('fa-IR', options).format(date);
}

function createMessageCard(message) {
    const card = document.createElement('div');
    card.className = `message-card category-${message.category.replace(/\s+/g, '-')}`;
    card.setAttribute('data-id', message.id);
    
    // Get viewers for this message
    const viewers = getMessageViewers(message.id);
    const viewersHtml = viewers.length > 0 ? `
        <div class="message-viewers">
            <span class="viewers-label">👁️ دیده شده توسط:</span>
            <div class="viewers-list">
                ${viewers.map(v => `
                    <span class="viewer-badge seen">
                        <span class="icon">✓</span>
                        ${escapeHtml(v.deviceName)}
                    </span>
                `).join('')}
            </div>
        </div>
    ` : '';
    
    card.innerHTML = `
        <div class="message-header">
            <div>
                <h3 class="message-title">${escapeHtml(message.title)}</h3>
                <div class="message-meta">
                    <span class="message-category category-${message.category.replace(/\s+/g, '-')}">${message.category}</span>
                    <span class="message-time">${formatDate(message.timestamp)}</span>
                </div>
            </div>
        </div>
        <p class="message-content">${escapeHtml(message.content)}</p>
        <div class="message-footer">
            <span class="message-sender">👤 ${escapeHtml(message.sender)}</span>
            <button class="btn-delete" onclick="deleteMessage('${message.id}')">
                <span class="icon">🗑️</span>
                حذف
            </button>
        </div>
        ${viewersHtml}
    `;
    
    // Mark message as viewed by current device
    markMessageAsViewed(message.id, getDeviceId(), getDeviceName());
    
    return card;
}

function renderMessages() {
    const messages = appState.getFilteredMessages();
    elements.messagesList.innerHTML = '';
    
    if (messages.length === 0) {
        elements.emptyState.classList.add('show');
        elements.messagesList.style.display = 'none';
    } else {
        elements.emptyState.classList.remove('show');
        elements.messagesList.style.display = 'grid';
        
        messages.forEach(message => {
            const card = createMessageCard(message);
            elements.messagesList.appendChild(card);
        });
    }
}

// ==================== Filter Management ====================
function setFilter(filter) {
    appState.currentFilter = filter;
    
    // Update active button
    elements.filterButtons.forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    renderMessages();
}

// ==================== Notifications ====================
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showToast('مرورگر شما از اعلان‌ها پشتیبانی نمی‌کند', 'error');
        return false;
    }
    
    if (Notification.permission === 'granted') {
        appState.setNotificationPermission(true);
        updateNotificationButton();
        showToast('اعلان‌ها فعال هستند', 'success');
        return true;
    }
    
    if (Notification.permission === 'denied') {
        showToast('دسترسی به اعلان‌ها رد شده است', 'error');
        return false;
    }
    
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            appState.setNotificationPermission(true);
            updateNotificationButton();
            showToast('اعلان‌ها با موفقیت فعال شدند', 'success');
            return true;
        } else {
            appState.setNotificationPermission(false);
            showToast('دسترسی به اعلان‌ها رد شد', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        showToast('خطا در درخواست دسترسی', 'error');
        return false;
    }
}

function sendNotification(message) {
    if (!appState.notificationsEnabled || !('Notification' in window)) {
        return;
    }
    
    if (Notification.permission === 'granted') {
        try {
            const notification = new Notification('پیام جدید در تابلوی اعلانات', {
                body: `${message.title}\n${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">📋</text></svg>',
                badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">📋</text></svg>',
                tag: 'local-board-message',
                requireInteraction: false,
                lang: 'fa',
                dir: 'rtl'
            });
            
            notification.onclick = function() {
                window.focus();
                notification.close();
            };
            
            // Auto close after 5 seconds
            setTimeout(() => notification.close(), 5000);
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }
}

function updateNotificationButton() {
    if (appState.notificationsEnabled) {
        elements.notificationButton.classList.add('active');
        elements.notificationButton.innerHTML = '<span class="icon">🔔</span> اعلان‌ها فعال است';
    } else {
        elements.notificationButton.classList.remove('active');
        elements.notificationButton.innerHTML = '<span class="icon">🔔</span> فعال‌سازی اعلان‌ها';
    }
}

// ==================== Toast Notifications ====================
function showToast(message, type = 'info') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, CONFIG.TOAST_DURATION);
}

// ==================== Utility Functions ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function resetForm() {
    elements.messageForm.reset();
    elements.messageTitle.focus();
}

// ==================== Event Listeners ====================
function initEventListeners() {
    // Form submission
    elements.messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = elements.messageTitle.value.trim();
        const content = elements.messageContent.value.trim();
        const category = elements.messageCategory.value;
        const sender = elements.senderName.value.trim();
        
        if (!title || !content) {
            showToast('لطفاً عنوان و متن پیام را وارد کنید', 'error');
            return;
        }
        
        createMessage(title, content, category, sender);
        renderMessages();
        resetForm();
        showToast('پیام با موفقیت ارسال شد', 'success');
        
        // Scroll to messages section
        elements.messagesList.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    
    // Filter buttons
    elements.filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setFilter(btn.dataset.filter);
        });
    });
    
    // Clear messages button
    elements.clearButton.addEventListener('click', clearAllMessages);
    
    // Notification button
    elements.notificationButton.addEventListener('click', requestNotificationPermission);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to submit form
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            if (document.activeElement === elements.messageTitle || 
                document.activeElement === elements.messageContent) {
                elements.messageForm.dispatchEvent(new Event('submit'));
            }
        }
    });
}

// ==================== Device Management ====================
function getDeviceId() {
    let deviceId = localStorage.getItem(CONFIG.DEVICE_ID_KEY);
    if (!deviceId) {
        deviceId = 'device-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(CONFIG.DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
}

function getDeviceName() {
    let deviceName = localStorage.getItem(CONFIG.DEVICE_NAME_KEY);
    if (!deviceName) {
        deviceName = prompt('نام دستگاه خود را وارد کنید:', 'دستگاه ' + Math.floor(Math.random() * 1000));
        if (deviceName) {
            localStorage.setItem(CONFIG.DEVICE_NAME_KEY, deviceName);
        }
    }
    return deviceName || 'ناشناس';
}

// ==================== Message Views Tracking ====================
function getMessageViews() {
    try {
        const views = localStorage.getItem(CONFIG.MESSAGE_VIEWS_KEY);
        return views ? JSON.parse(views) : {};
    } catch (error) {
        console.error('Error loading message views:', error);
        return {};
    }
}

function saveMessageViews(views) {
    try {
        localStorage.setItem(CONFIG.MESSAGE_VIEWS_KEY, JSON.stringify(views));
    } catch (error) {
        console.error('Error saving message views:', error);
    }
}

function markMessageAsViewed(messageId, deviceId, deviceName) {
    const views = getMessageViews();
    if (!views[messageId]) {
        views[messageId] = [];
    }
    
    // Check if this device already viewed
    const alreadyViewed = views[messageId].find(v => v.deviceId === deviceId);
    if (!alreadyViewed) {
        views[messageId].push({
            deviceId: deviceId,
            deviceName: deviceName,
            timestamp: new Date().toISOString()
        });
        saveMessageViews(views);
    }
}

function getMessageViewers(messageId) {
    const views = getMessageViews();
    return views[messageId] || [];
}

// ==================== P2P Connection Manager ====================
class P2PManager {
    constructor() {
        this.peer = null;
        this.connections = new Map();
        this.roomCode = null;
        this.isHost = false;
        this.deviceId = getDeviceId();
        this.deviceName = getDeviceName();
    }

    async startSharing() {
        try {
            // Generate a simple 6-character room code
            this.roomCode = this.generateRoomCode();
            this.isHost = true;

            // Initialize PeerJS with room code as ID
            this.peer = new Peer('room-' + this.roomCode, CONFIG.PEERJS_CONFIG);

            this.peer.on('open', (id) => {
                console.log('Peer opened with ID:', id);
                updateConnectionStatus('online');
                showToast('اشتراک‌گذاری شروع شد', 'success');
                showRoomCodeModal(this.roomCode);
                
                // Enable room code button
                document.getElementById('showRoomCode').style.display = 'inline-flex';
            });

            this.peer.on('connection', (conn) => {
                this.handleConnection(conn);
            });

            this.peer.on('error', (err) => {
                console.error('Peer error:', err);
                showToast('خطا در اتصال: ' + err.message, 'error');
                updateConnectionStatus('offline');
            });

        } catch (error) {
            console.error('Error starting sharing:', error);
            showToast('خطا در شروع اشتراک‌گذاری', 'error');
        }
    }

    async joinRoom(roomCode) {
        try {
            if (!roomCode || roomCode.length !== 6) {
                showToast('کد اتاق نامعتبر است', 'error');
                return;
            }

            roomCode = roomCode.toUpperCase();
            updateConnectionStatus('connecting');

            // Initialize peer with a unique ID
            this.peer = new Peer('peer-' + this.deviceId, CONFIG.PEERJS_CONFIG);

            this.peer.on('open', (id) => {
                console.log('Connecting to room:', roomCode);
                
                // Connect to the room host
                const conn = this.peer.connect('room-' + roomCode, {
                    reliable: true,
                    metadata: {
                        deviceId: this.deviceId,
                        deviceName: this.deviceName
                    }
                });

                this.handleConnection(conn);

                conn.on('open', () => {
                    updateConnectionStatus('online');
                    showToast('با موفقیت به اتاق متصل شدید', 'success');
                    closeModal();
                    
                    // Request all messages from host
                    conn.send({
                        type: 'request-messages',
                        deviceId: this.deviceId,
                        deviceName: this.deviceName
                    });
                });
            });

            this.peer.on('error', (err) => {
                console.error('Connection error:', err);
                showToast('خطا در اتصال به اتاق', 'error');
                updateConnectionStatus('offline');
            });

        } catch (error) {
            console.error('Error joining room:', error);
            showToast('خطا در اتصال به اتاق', 'error');
        }
    }

    handleConnection(conn) {
        console.log('New connection:', conn.peer);
        
        conn.on('open', () => {
            this.connections.set(conn.peer, conn);
            updatePeersCount(this.connections.size);
            
            // Send existing messages to new peer
            if (this.isHost) {
                conn.send({
                    type: 'all-messages',
                    messages: appState.messages,
                    views: getMessageViews()
                });
            }
        });

        conn.on('data', (data) => {
            this.handleMessage(data, conn);
        });

        conn.on('close', () => {
            this.connections.delete(conn.peer);
            updatePeersCount(this.connections.size);
            showToast('یک دستگاه قطع شد', 'info');
        });

        conn.on('error', (err) => {
            console.error('Connection error:', err);
            this.connections.delete(conn.peer);
            updatePeersCount(this.connections.size);
        });
    }

    handleMessage(data, conn) {
        console.log('Received message:', data);

        switch (data.type) {
            case 'new-message':
                // Add message to local storage
                const message = data.message;
                const existingMessage = appState.messages.find(m => m.id === message.id);
                if (!existingMessage) {
                    appState.messages.unshift(message);
                    appState.saveMessages();
                    renderMessages();
                    
                    // Mark as viewed by this device
                    markMessageAsViewed(message.id, this.deviceId, this.deviceName);
                    
                    // Send view confirmation back
                    conn.send({
                        type: 'message-viewed',
                        messageId: message.id,
                        deviceId: this.deviceId,
                        deviceName: this.deviceName
                    });

                    // Show notification
                    if (appState.notificationsEnabled) {
                        sendNotification(message);
                    }
                    showToast('پیام جدید از ' + (data.senderDevice || 'دستگاه دیگر'), 'info');
                }
                break;

            case 'all-messages':
                // Merge messages from host
                const incomingMessages = data.messages || [];
                incomingMessages.forEach(msg => {
                    const exists = appState.messages.find(m => m.id === msg.id);
                    if (!exists) {
                        appState.messages.push(msg);
                    }
                });
                appState.saveMessages();
                
                // Merge views
                if (data.views) {
                    const localViews = getMessageViews();
                    Object.assign(localViews, data.views);
                    saveMessageViews(localViews);
                }
                
                renderMessages();
                showToast(`${incomingMessages.length} پیام دریافت شد`, 'success');
                break;

            case 'request-messages':
                // Send all messages to requester
                if (this.isHost) {
                    conn.send({
                        type: 'all-messages',
                        messages: appState.messages,
                        views: getMessageViews()
                    });
                }
                break;

            case 'message-viewed':
                // Update view tracking
                markMessageAsViewed(data.messageId, data.deviceId, data.deviceName);
                renderMessages();
                break;

            case 'delete-message':
                // Sync message deletion
                appState.deleteMessage(data.messageId);
                renderMessages();
                showToast('پیام توسط دستگاه دیگر حذف شد', 'info');
                break;
        }
    }

    broadcastMessage(message) {
        const data = {
            type: 'new-message',
            message: message,
            senderDevice: this.deviceName
        };

        this.connections.forEach((conn) => {
            try {
                conn.send(data);
            } catch (error) {
                console.error('Error sending to peer:', error);
            }
        });
    }

    broadcastMessageDeletion(messageId) {
        const data = {
            type: 'delete-message',
            messageId: messageId
        };

        this.connections.forEach((conn) => {
            try {
                conn.send(data);
            } catch (error) {
                console.error('Error sending deletion to peer:', error);
            }
        });
    }

    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    disconnect() {
        if (this.peer) {
            this.peer.disconnect();
            this.peer.destroy();
            this.peer = null;
        }
        this.connections.clear();
        this.roomCode = null;
        this.isHost = false;
        updateConnectionStatus('offline');
        updatePeersCount(0);
        document.getElementById('showRoomCode').style.display = 'none';
    }
}

// Initialize P2P Manager
const p2pManager = new P2PManager();

// ==================== P2P UI Functions ====================
function updateConnectionStatus(status) {
    const indicator = document.getElementById('connectionStatus');
    const dot = indicator.querySelector('.status-dot');
    const text = indicator.querySelector('.status-text');

    dot.className = 'status-dot ' + status;
    
    switch (status) {
        case 'online':
            text.textContent = 'آنلاین';
            break;
        case 'connecting':
            text.textContent = 'در حال اتصال...';
            break;
        default:
            text.textContent = 'آفلاین';
    }
}

function updatePeersCount(count) {
    document.getElementById('peersCount').textContent = count;
}

function showRoomCodeModal(roomCode) {
    const modal = document.getElementById('roomModal');
    const modalTitle = document.getElementById('modalTitle');
    const roomCodeDisplay = document.getElementById('roomCodeDisplay');
    const joinRoomInput = document.getElementById('joinRoomInput');
    
    modalTitle.textContent = 'کد اتاق شما';
    document.getElementById('roomCode').textContent = roomCode;
    roomCodeDisplay.style.display = 'block';
    joinRoomInput.style.display = 'none';
    
    modal.classList.add('show');
}

function showJoinRoomModal() {
    const modal = document.getElementById('roomModal');
    const modalTitle = document.getElementById('modalTitle');
    const roomCodeDisplay = document.getElementById('roomCodeDisplay');
    const joinRoomInput = document.getElementById('joinRoomInput');
    
    modalTitle.textContent = 'اتصال به اتاق';
    roomCodeDisplay.style.display = 'none';
    joinRoomInput.style.display = 'flex';
    document.getElementById('roomCodeInput').value = '';
    
    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('roomModal');
    modal.classList.remove('show');
}

// ==================== Initialization ====================
function init() {
    console.log('Initializing Local Board Application...');
    
    // Initialize event listeners
    initEventListeners();
    initP2PEventListeners();
    
    // Update notification button state
    updateNotificationButton();
    
    // Render initial messages
    renderMessages();
    
    // Focus on title input
    elements.messageTitle.focus();
    
    console.log('Application initialized successfully!');
    console.log(`Loaded ${appState.messages.length} messages from storage`);
    console.log('Device ID:', getDeviceId());
    console.log('Device Name:', getDeviceName());
}

function initP2PEventListeners() {
    // Start sharing button
    document.getElementById('startSharing').addEventListener('click', () => {
        p2pManager.startSharing();
    });

    // Show room code button
    document.getElementById('showRoomCode').addEventListener('click', () => {
        if (p2pManager.roomCode) {
            showRoomCodeModal(p2pManager.roomCode);
        }
    });

    // Join room button
    document.getElementById('joinRoom').addEventListener('click', () => {
        showJoinRoomModal();
    });

    // Copy room code button
    document.getElementById('copyRoomCode').addEventListener('click', () => {
        const roomCode = document.getElementById('roomCode').textContent;
        navigator.clipboard.writeText(roomCode).then(() => {
            showToast('کد اتاق کپی شد', 'success');
        }).catch(() => {
            showToast('خطا در کپی کد', 'error');
        });
    });

    // Join room confirmation button
    document.getElementById('joinRoomBtn').addEventListener('click', () => {
        const roomCode = document.getElementById('roomCodeInput').value.trim();
        if (roomCode) {
            p2pManager.joinRoom(roomCode);
        } else {
            showToast('لطفاً کد اتاق را وارد کنید', 'error');
        }
    });

    // Close modal button
    document.getElementById('closeModal').addEventListener('click', closeModal);

    // Close modal on outside click
    document.getElementById('roomModal').addEventListener('click', (e) => {
        if (e.target.id === 'roomModal') {
            closeModal();
        }
    });

    // Enter key to join room
    document.getElementById('roomCodeInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('joinRoomBtn').click();
        }
    });
}

// ==================== Initialization ====================
function init() {
    console.log('Initializing Local Board Application...');
    
    // Initialize event listeners
    initEventListeners();
    
    // Update notification button state
    updateNotificationButton();
    
    // Render initial messages
    renderMessages();
    
    // Focus on title input
    elements.messageTitle.focus();
    
    console.log('Application initialized successfully!');
    console.log(`Loaded ${appState.messages.length} messages from storage`);
}

// ==================== Start Application ====================
// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ==================== Service Worker (Optional) ====================
// Register service worker if available for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker can be added later if needed
        console.log('Service Worker support detected');
    });
}

// ==================== Expose functions to global scope ====================
window.deleteMessage = deleteMessage;
window.clearAllMessages = clearAllMessages;

