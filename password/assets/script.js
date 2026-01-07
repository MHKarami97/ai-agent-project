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

// I18n System
class I18n {
    constructor() {
        this.translations = {};
        this.currentLang = localStorage.getItem('lang') || 'fa';
        this.loadTranslations();
    }

    async loadTranslations() {
        try {
            const response = await fetch('assets/translations.json');
            this.translations = await response.json();
            this.applyTranslations();
        } catch (error) {
            console.error('Failed to load translations:', error);
        }
    }

    t(key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];
        
        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                return key;
            }
        }
        
        return value;
    }

    applyTranslations() {
        const html = document.documentElement;
        html.setAttribute('lang', this.currentLang);
        html.setAttribute('dir', this.currentLang === 'fa' ? 'rtl' : 'ltr');
        
        // Update all elements with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' && element.type !== 'checkbox') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Update document title
        const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
        if (titleKey) {
            document.title = this.t(titleKey);
        }
    }

    switchLanguage() {
        this.currentLang = this.currentLang === 'fa' ? 'en' : 'fa';
        localStorage.setItem('lang', this.currentLang);
        this.applyTranslations();
    }
}

const i18n = new I18n();



// Listen to tool-wrapper theme changes
window.addEventListener('themeChanged', (e) => {
    themeManager.currentTheme = e.detail;
    themeManager.applyTheme();
});

// Listen to tool-wrapper language changes
window.addEventListener('languageChanged', (e) => {
    const newLang = e.detail;
    localStorage.setItem('lang', newLang);
    if (typeof i18n !== 'undefined') {
        i18n.currentLang = newLang;
        i18n.applyTranslations();
    }
});


// Password Generator Application
class PasswordGenerator {
    constructor() {
        // Character sets
        this.charSets = {
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            lowercase: 'abcdefghijklmnopqrstuvwxyz',
            numbers: '0123456789',
            symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?'
        };

        // Similar characters to exclude
        this.similarChars = 'il1Lo0O';
        // Ambiguous symbols to exclude
        this.ambiguousChars = '{}[]()/\\\'\"~,;:.<>';

        // Initialize DOM elements
        this.initElements();
        // Set up event listeners
        this.initEventListeners();
        // Load history from localStorage
        this.loadHistory();
    }

    initElements() {
        this.passwordOutput = document.getElementById('passwordOutput');
        this.generateBtn = document.getElementById('generateBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.copyNotification = document.getElementById('copyNotification');
        this.lengthSlider = document.getElementById('lengthSlider');
        this.lengthValue = document.getElementById('lengthValue');
        this.uppercaseCheck = document.getElementById('uppercaseCheck');
        this.lowercaseCheck = document.getElementById('lowercaseCheck');
        this.numbersCheck = document.getElementById('numbersCheck');
        this.symbolsCheck = document.getElementById('symbolsCheck');
        this.excludeSimilarCheck = document.getElementById('excludeSimilarCheck');
        this.excludeAmbiguousCheck = document.getElementById('excludeAmbiguousCheck');
        this.strengthBar = document.getElementById('strengthBar');
        this.strengthText = document.getElementById('strengthText');
        this.historyList = document.getElementById('historyList');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        
        this.currentPassword = '';
        this.history = [];
    }

    initEventListeners() {
        this.generateBtn.addEventListener('click', () => this.generatePassword());
        this.copyBtn.addEventListener('click', () => this.copyPassword());
        this.lengthSlider.addEventListener('input', (e) => {
            this.lengthValue.textContent = e.target.value;
        });
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());

        // Generate password on checkbox change
        const checkboxes = [
            this.uppercaseCheck,
            this.lowercaseCheck,
            this.numbersCheck,
            this.symbolsCheck,
            this.excludeSimilarCheck,
            this.excludeAmbiguousCheck
        ];

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if (this.currentPassword) {
                    this.generatePassword();
                }
            });
        });

        // Generate password on slider change
        this.lengthSlider.addEventListener('change', () => {
            if (this.currentPassword) {
                this.generatePassword();
            }
        });
    }

    getCharacterSet() {
        let charset = '';
        
        if (this.uppercaseCheck.checked) charset += this.charSets.uppercase;
        if (this.lowercaseCheck.checked) charset += this.charSets.lowercase;
        if (this.numbersCheck.checked) charset += this.charSets.numbers;
        if (this.symbolsCheck.checked) charset += this.charSets.symbols;

        // Exclude similar characters if checked
        if (this.excludeSimilarCheck.checked) {
            charset = charset.split('').filter(char => !this.similarChars.includes(char)).join('');
        }

        // Exclude ambiguous characters if checked
        if (this.excludeAmbiguousCheck.checked) {
            charset = charset.split('').filter(char => !this.ambiguousChars.includes(char)).join('');
        }

        return charset;
    }

    generatePassword() {
        const length = parseInt(this.lengthSlider.value);
        const charset = this.getCharacterSet();

        if (charset.length === 0) {
            this.showError('لطفاً حداقل یک نوع کاراکتر را انتخاب کنید');
            return;
        }

        let password = '';
        
        // Use crypto.getRandomValues for secure random generation
        const randomValues = new Uint32Array(length);
        window.crypto.getRandomValues(randomValues);

        for (let i = 0; i < length; i++) {
            const randomIndex = randomValues[i] % charset.length;
            password += charset[randomIndex];
        }

        this.currentPassword = password;
        this.displayPassword(password);
        this.calculateStrength(password);
        this.addToHistory(password);
        this.copyBtn.disabled = false;
    }

    displayPassword(password) {
        this.passwordOutput.innerHTML = `<span style="color: #2c3e50;">${password}</span>`;
    }

    showError(message) {
        this.passwordOutput.innerHTML = `<span class="placeholder" style="color: #dc3545;">${message}</span>`;
        this.currentPassword = '';
        this.copyBtn.disabled = true;
        this.strengthBar.className = 'strength-bar';
        this.strengthText.textContent = 'رمز عبوری تولید نشده است';
    }

    calculateStrength(password) {
        let strength = 0;
        const checks = {
            length: password.length >= 12,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            numbers: /[0-9]/.test(password),
            symbols: /[^A-Za-z0-9]/.test(password),
            extraLength: password.length >= 16
        };

        Object.values(checks).forEach(check => {
            if (check) strength++;
        });

        let strengthClass = '';
        let strengthTextValue = '';

        if (strength <= 2) {
            strengthClass = 'weak';
            strengthTextValue = '❌ ضعیف - رمز عبور قوی‌تری انتخاب کنید';
        } else if (strength <= 3) {
            strengthClass = 'fair';
            strengthTextValue = '⚠️ متوسط - می‌توانید بهتر کنید';
        } else if (strength <= 4) {
            strengthClass = 'good';
            strengthTextValue = '✅ خوب - رمز عبور مناسبی است';
        } else {
            strengthClass = 'strong';
            strengthTextValue = '🔒 عالی - رمز عبور بسیار قوی است';
        }

        this.strengthBar.className = `strength-bar ${strengthClass}`;
        this.strengthText.textContent = strengthTextValue;
    }

    copyPassword() {
        if (!this.currentPassword) return;

        navigator.clipboard.writeText(this.currentPassword).then(() => {
            this.showCopyNotification();
        }).catch(err => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = this.currentPassword;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.showCopyNotification();
            } catch (err) {
                console.error('Failed to copy:', err);
            }
            
            document.body.removeChild(textArea);
        });
    }

    showCopyNotification() {
        this.copyNotification.classList.add('show');
        setTimeout(() => {
            this.copyNotification.classList.remove('show');
        }, 2000);
    }

    addToHistory(password) {
        const timestamp = new Date().toLocaleString('fa-IR');
        const historyItem = {
            password: password,
            timestamp: timestamp
        };

        // Add to beginning of history array
        this.history.unshift(historyItem);

        // Keep only last 10 passwords
        if (this.history.length > 10) {
            this.history.pop();
        }

        this.saveHistory();
        this.renderHistory();
    }

    renderHistory() {
        if (this.history.length === 0) {
            this.historyList.innerHTML = '<p class="empty-history">هنوز رمز عبوری تولید نشده است</p>';
            return;
        }

        this.historyList.innerHTML = '';
        this.history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-password">${item.password}</div>
                <button class="history-copy-btn" data-index="${index}">📋 کپی</button>
            `;

            const copyBtn = historyItem.querySelector('.history-copy-btn');
            copyBtn.addEventListener('click', () => {
                this.copyFromHistory(item.password);
            });

            this.historyList.appendChild(historyItem);
        });
    }

    copyFromHistory(password) {
        navigator.clipboard.writeText(password).then(() => {
            this.showCopyNotification();
        }).catch(err => {
            // Fallback
            const textArea = document.createElement('textarea');
            textArea.value = password;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.showCopyNotification();
            } catch (err) {
                console.error('Failed to copy:', err);
            }
            
            document.body.removeChild(textArea);
        });
    }

    saveHistory() {
        try {
            localStorage.setItem('passwordHistory', JSON.stringify(this.history));
        } catch (err) {
            console.error('Failed to save history:', err);
        }
    }

    loadHistory() {
        try {
            const savedHistory = localStorage.getItem('passwordHistory');
            if (savedHistory) {
                this.history = JSON.parse(savedHistory);
                this.renderHistory();
            }
        } catch (err) {
            console.error('Failed to load history:', err);
            this.history = [];
        }
    }

    clearHistory() {
        if (this.history.length === 0) return;

        if (confirm('آیا مطمئن هستید که می‌خواهید تاریخچه را پاک کنید؟')) {
            this.history = [];
            this.saveHistory();
            this.renderHistory();
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PasswordGenerator();
});

