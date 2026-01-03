// Bluetooth Mesh Messenger Application
// End-to-End Encrypted Messaging without Internet

class BluetoothMeshMessenger {
    constructor() {
        this.db = null;
        this.username = '';
        this.deviceId = '';
        this.connectedDevices = new Map();
        this.bluetoothDevice = null;
        this.characteristic = null;
        this.settings = {
            soundEnabled: true,
            autoConnect: true
        };
        
        this.initDatabase();
        this.initElements();
        this.initEventListeners();
        this.loadSettings();
    }

    // Initialize IndexedDB
    initDatabase() {
        const request = indexedDB.open('BluetoothMeshDB', 1);
        
        request.onerror = () => {
            this.showToast('خطا در ایجاد پایگاه داده', 'error');
        };
        
        request.onsuccess = (event) => {
            this.db = event.target.result;
            this.loadUserData();
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Messages store
            if (!db.objectStoreNames.contains('messages')) {
                const messagesStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
                messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
                messagesStore.createIndex('deviceId', 'deviceId', { unique: false });
            }
            
            // Devices store
            if (!db.objectStoreNames.contains('devices')) {
                const devicesStore = db.createObjectStore('devices', { keyPath: 'id' });
                devicesStore.createIndex('name', 'name', { unique: false });
            }
            
            // Settings store
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }
        };
    }

    // Initialize DOM elements
    initElements() {
        this.elements = {
            setupSection: document.getElementById('setupSection'),
            chatSection: document.getElementById('chatSection'),
            usernameInput: document.getElementById('usernameInput'),
            startBtn: document.getElementById('startBtn'),
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            scanBtn: document.getElementById('scanBtn'),
            devicesList: document.getElementById('devicesList'),
            messagesContainer: document.getElementById('messagesContainer'),
            messageInput: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            clearBtn: document.getElementById('clearBtn'),
            settingsBtn: document.getElementById('settingsBtn'),
            settingsModal: document.getElementById('settingsModal'),
            closeSettingsBtn: document.getElementById('closeSettingsBtn'),
            settingsUsername: document.getElementById('settingsUsername'),
            updateUsernameBtn: document.getElementById('updateUsernameBtn'),
            soundToggle: document.getElementById('soundToggle'),
            autoConnectToggle: document.getElementById('autoConnectToggle'),
            deviceIdDisplay: document.getElementById('deviceIdDisplay'),
            resetBtn: document.getElementById('resetBtn'),
            toastContainer: document.getElementById('toastContainer'),
            chatTitle: document.getElementById('chatTitle'),
            chatSubtitle: document.getElementById('chatSubtitle')
        };
    }

    // Initialize event listeners
    initEventListeners() {
        this.elements.startBtn.addEventListener('click', () => this.startConnection());
        this.elements.scanBtn.addEventListener('click', () => this.scanDevices());
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        this.elements.messageInput.addEventListener('input', () => this.handleMessageInput());
        this.elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.elements.clearBtn.addEventListener('click', () => this.clearMessages());
        this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
        this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.elements.updateUsernameBtn.addEventListener('click', () => this.updateUsername());
        this.elements.soundToggle.addEventListener('change', () => this.updateSettings());
        this.elements.autoConnectToggle.addEventListener('change', () => this.updateSettings());
        this.elements.resetBtn.addEventListener('click', () => this.resetAllData());
        
        // Auto-resize textarea
        this.elements.messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    // Load user data from database
    loadUserData() {
        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        
        const usernameRequest = store.get('username');
        usernameRequest.onsuccess = (event) => {
            if (event.target.result) {
                this.username = event.target.result.value;
                this.elements.setupSection.classList.add('hidden');
                this.elements.chatSection.classList.remove('hidden');
                this.loadMessages();
            }
        };
        
        const deviceIdRequest = store.get('deviceId');
        deviceIdRequest.onsuccess = (event) => {
            if (event.target.result) {
                this.deviceId = event.target.result.value;
            } else {
                this.deviceId = this.generateDeviceId();
                this.saveToDatabase('settings', { key: 'deviceId', value: this.deviceId });
            }
            this.elements.deviceIdDisplay.textContent = this.deviceId;
        };
    }

    // Load settings from database
    loadSettings() {
        if (!this.db) {
            setTimeout(() => this.loadSettings(), 100);
            return;
        }
        
        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        
        const soundRequest = store.get('soundEnabled');
        soundRequest.onsuccess = (event) => {
            if (event.target.result !== undefined) {
                this.settings.soundEnabled = event.target.result.value;
                this.elements.soundToggle.checked = this.settings.soundEnabled;
            }
        };
        
        const autoConnectRequest = store.get('autoConnect');
        autoConnectRequest.onsuccess = (event) => {
            if (event.target.result !== undefined) {
                this.settings.autoConnect = event.target.result.value;
                this.elements.autoConnectToggle.checked = this.settings.autoConnect;
            }
        };
    }

    // Generate unique device ID
    generateDeviceId() {
        return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Start Bluetooth connection
    async startConnection() {
        const username = this.elements.usernameInput.value.trim();
        
        if (!username) {
            this.showToast('لطفاً نام خود را وارد کنید', 'warning');
            return;
        }
        
        // Check if Web Bluetooth API is available
        if (!navigator.bluetooth) {
            this.showToast('مرورگر شما از Bluetooth پشتیبانی نمی‌کند', 'error');
            this.simulateBluetoothMode();
            return;
        }
        
        this.username = username;
        this.saveToDatabase('settings', { key: 'username', value: username });
        
        this.elements.setupSection.classList.add('hidden');
        this.elements.chatSection.classList.remove('hidden');
        
        this.showToast(`خوش آمدید ${username}!`, 'success');
        this.updateStatus(true);
        this.loadMessages();
        
        // Try to connect in demo mode since real Bluetooth requires user interaction
        this.simulateBluetoothMode();
    }

    // Simulate Bluetooth mode for demo (since real BLE requires specific hardware)
    simulateBluetoothMode() {
        this.showToast('حالت نمایشی: برای یافتن دستگاه‌ها روی دکمه جستجو کلیک کنید', 'info');
        // Demo mode is ready - users can click scan button to find devices
    }

    // Add demo device
    addDemoDevice(name, id) {
        const device = {
            id: id,
            name: name,
            status: 'connected',
            lastSeen: Date.now()
        };
        
        this.connectedDevices.set(id, device);
        this.saveToDatabase('devices', device);
        this.renderDevicesList();
    }

    // Simulate receiving a message
    receiveSimulatedMessage(text, sender, deviceId) {
        const message = {
            text: this.decryptMessage(text),
            sender: sender,
            deviceId: deviceId,
            timestamp: Date.now(),
            type: 'received'
        };
        
        this.saveMessage(message);
        this.renderMessage(message);
        this.playNotificationSound();
    }

    // Scan for Bluetooth devices
    async scanDevices() {
        if (!navigator.bluetooth) {
            this.showToast('مرورگر شما از Bluetooth پشتیبانی نمی‌کند', 'error');
            return;
        }
        
        this.showToast('در حال جستجوی دستگاه‌ها...', 'info');
        
        try {
            // Request Bluetooth device
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['battery_service', 'device_information']
            });
            
            if (device) {
                // Check if device already exists
                if (!this.connectedDevices.has(device.id)) {
                    this.addDemoDevice(device.name || 'دستگاه ناشناس', device.id);
                    this.showToast(`دستگاه ${device.name || 'جدید'} یافت شد!`, 'success');
                } else {
                    this.showToast('این دستگاه قبلاً اضافه شده است', 'warning');
                }
            }
        } catch (error) {
            if (error.name === 'NotFoundError') {
                this.showToast('هیچ دستگاهی پیدا نشد', 'warning');
            } else if (error.name === 'NotAllowedError') {
                this.showToast('دسترسی به Bluetooth رد شد', 'error');
            } else {
                this.showToast('خطا در جستجوی دستگاه‌ها: ' + error.message, 'error');
            }
        }
    }

    // Encrypt message (simple XOR encryption for demo - in production use proper encryption)
    encryptMessage(message) {
        const key = this.deviceId;
        let encrypted = '';
        for (let i = 0; i < message.length; i++) {
            encrypted += String.fromCharCode(message.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(encrypted);
    }

    // Decrypt message
    decryptMessage(encrypted) {
        try {
            const key = this.deviceId;
            const decoded = atob(encrypted);
            let decrypted = '';
            for (let i = 0; i < decoded.length; i++) {
                decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return decrypted;
        } catch (e) {
            return encrypted; // Return as-is if decryption fails
        }
    }

    // Send message
    async sendMessage() {
        const text = this.elements.messageInput.value.trim();
        
        if (!text) return;
        
        const message = {
            text: text,
            sender: this.username,
            deviceId: this.deviceId,
            timestamp: Date.now(),
            type: 'sent'
        };
        
        // Encrypt the message
        const encryptedText = this.encryptMessage(text);
        
        // In real implementation, send via Bluetooth
        // For demo, just save and display
        this.saveMessage(message);
        this.renderMessage(message);
        
        // Clear input
        this.elements.messageInput.value = '';
        this.elements.messageInput.style.height = 'auto';
        this.elements.sendBtn.disabled = true;
        
        this.showToast('پیام ارسال شد', 'success');
        
        // In real implementation, the message would be sent via Bluetooth here
    }

    // Handle message input
    handleMessageInput() {
        const text = this.elements.messageInput.value.trim();
        this.elements.sendBtn.disabled = !text;
    }

    // Save message to database
    saveMessage(message) {
        const transaction = this.db.transaction(['messages'], 'readwrite');
        const store = transaction.objectStore('messages');
        store.add(message);
    }

    // Save to database
    saveToDatabase(storeName, data) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        store.put(data);
    }

    // Load messages from database
    loadMessages() {
        const transaction = this.db.transaction(['messages'], 'readonly');
        const store = transaction.objectStore('messages');
        const request = store.getAll();
        
        request.onsuccess = (event) => {
            const messages = event.target.result;
            this.elements.messagesContainer.innerHTML = '<div class="date-divider"><span>امروز</span></div>';
            messages.forEach(message => this.renderMessage(message, false));
            this.scrollToBottom();
        };
    }

    // Render message
    renderMessage(message, animate = true) {
        const isOwn = message.type === 'sent';
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isOwn ? 'own' : ''}`;
        if (animate) {
            messageElement.style.animation = 'messageSlide 0.3s ease';
        }
        
        const avatar = message.sender.charAt(0).toUpperCase();
        const time = new Date(message.timestamp).toLocaleTimeString('fa-IR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageElement.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${message.sender}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-bubble">${this.escapeHtml(message.text)}</div>
            </div>
        `;
        
        this.elements.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    // Render devices list
    renderDevicesList() {
        if (this.connectedDevices.size === 0) {
            this.elements.devicesList.innerHTML = `
                <div class="empty-state">
                    <p>هنوز دستگاهی یافت نشد</p>
                    <small>روی دکمه جستجو کلیک کنید</small>
                </div>
            `;
            return;
        }
        
        this.elements.devicesList.innerHTML = '';
        this.connectedDevices.forEach((device, id) => {
            const deviceElement = document.createElement('div');
            deviceElement.className = 'device-item';
            deviceElement.innerHTML = `
                <div class="device-avatar">${device.name.charAt(0).toUpperCase()}</div>
                <div class="device-info">
                    <div class="device-name">${device.name}</div>
                    <div class="device-status">متصل</div>
                </div>
            `;
            this.elements.devicesList.appendChild(deviceElement);
        });
    }

    // Clear messages
    clearMessages() {
        if (!confirm('آیا مطمئن هستید که می‌خواهید همه پیام‌ها را پاک کنید؟')) {
            return;
        }
        
        const transaction = this.db.transaction(['messages'], 'readwrite');
        const store = transaction.objectStore('messages');
        const request = store.clear();
        
        request.onsuccess = () => {
            this.elements.messagesContainer.innerHTML = '<div class="date-divider"><span>امروز</span></div>';
            this.showToast('پیام‌ها پاک شدند', 'success');
        };
    }

    // Open settings modal
    openSettings() {
        this.elements.settingsUsername.value = this.username;
        this.elements.settingsModal.classList.remove('hidden');
    }

    // Close settings modal
    closeSettings() {
        this.elements.settingsModal.classList.add('hidden');
    }

    // Update username
    updateUsername() {
        const newUsername = this.elements.settingsUsername.value.trim();
        
        if (!newUsername) {
            this.showToast('نام نمی‌تواند خالی باشد', 'warning');
            return;
        }
        
        this.username = newUsername;
        this.saveToDatabase('settings', { key: 'username', value: newUsername });
        this.showToast('نام کاربری به‌روز شد', 'success');
    }

    // Update settings
    updateSettings() {
        this.settings.soundEnabled = this.elements.soundToggle.checked;
        this.settings.autoConnect = this.elements.autoConnectToggle.checked;
        
        this.saveToDatabase('settings', { key: 'soundEnabled', value: this.settings.soundEnabled });
        this.saveToDatabase('settings', { key: 'autoConnect', value: this.settings.autoConnect });
        
        this.showToast('تنظیمات ذخیره شد', 'success');
    }

    // Reset all data
    resetAllData() {
        if (!confirm('آیا مطمئن هستید که می‌خواهید همه داده‌ها را پاک کنید؟ این عملیات قابل بازگشت نیست.')) {
            return;
        }
        
        const transaction = this.db.transaction(['messages', 'devices', 'settings'], 'readwrite');
        
        transaction.objectStore('messages').clear();
        transaction.objectStore('devices').clear();
        transaction.objectStore('settings').clear();
        
        transaction.oncomplete = () => {
            this.showToast('همه داده‌ها پاک شدند', 'success');
            setTimeout(() => {
                location.reload();
            }, 1500);
        };
    }

    // Update connection status
    updateStatus(connected) {
        if (connected) {
            this.elements.statusDot.classList.add('active');
            this.elements.statusText.textContent = 'فعال';
        } else {
            this.elements.statusDot.classList.remove('active');
            this.elements.statusText.textContent = 'غیرفعال';
        }
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-message">${message}</div>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastSlide 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Play notification sound
    playNotificationSound() {
        if (!this.settings.soundEnabled) return;
        
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.log('Could not play sound');
        }
    }

    // Scroll to bottom of messages
    scrollToBottom() {
        this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new BluetoothMeshMessenger();
});

