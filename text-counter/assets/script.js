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
    // Reload page to apply language changes
    location.reload();
});


// Text Analysis Application
class TextAnalyzer {
    constructor() {
        this.textInput = document.getElementById('textInput');
        this.charCount = document.getElementById('charCount');
        this.charCountNoSpace = document.getElementById('charCountNoSpace');
        this.wordCount = document.getElementById('wordCount');
        this.sentenceCount = document.getElementById('sentenceCount');
        this.paragraphCount = document.getElementById('paragraphCount');
        this.readTime = document.getElementById('readTime');
        this.wordFrequency = document.getElementById('wordFrequency');
        this.historyList = document.getElementById('historyList');
        this.minOccurrence = document.getElementById('minOccurrence');
        
        this.clearBtn = document.getElementById('clearBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        
        this.STORAGE_KEY = 'textAnalyzerHistory';
        this.WORDS_PER_MINUTE = 200; // Average reading speed in Persian
        
        this.init();
    }
    
    init() {
        // Event listeners
        this.textInput.addEventListener('input', () => this.updateStats());
        this.clearBtn.addEventListener('click', () => this.clearText());
        this.saveBtn.addEventListener('click', () => this.saveText());
        this.analyzeBtn.addEventListener('click', () => this.analyzeWordFrequency());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        
        // Load saved history
        this.loadHistory();
        
        // Load last text from localStorage if exists
        this.loadLastText();
        
        // Initial stats update
        this.updateStats();
    }
    
    // Text Statistics Functions
    updateStats() {
        const text = this.textInput.value;
        
        // Character count
        this.charCount.textContent = text.length.toLocaleString('fa-IR');
        
        // Character count without spaces
        const noSpaces = text.replace(/\s/g, '');
        this.charCountNoSpace.textContent = noSpaces.length.toLocaleString('fa-IR');
        
        // Word count
        const words = this.getWords(text);
        this.wordCount.textContent = words.length.toLocaleString('fa-IR');
        
        // Sentence count
        const sentences = this.getSentences(text);
        this.sentenceCount.textContent = sentences.length.toLocaleString('fa-IR');
        
        // Paragraph count
        const paragraphs = this.getParagraphs(text);
        this.paragraphCount.textContent = paragraphs.length.toLocaleString('fa-IR');
        
        // Reading time (in minutes)
        const readingTime = words.length > 0 ? Math.ceil(words.length / this.WORDS_PER_MINUTE) : 0;
        this.readTime.textContent = readingTime.toLocaleString('fa-IR');
        
        // Auto-save to localStorage
        this.autoSave(text);
    }
    
    getWords(text) {
        if (!text.trim()) return [];
        // Match Persian, Arabic, and English words
        return text.trim().split(/\s+/).filter(word => word.length > 0);
    }
    
    getSentences(text) {
        if (!text.trim()) return [];
        // Split by Persian and English sentence endings
        return text.split(/[.!?؟۔\n]+/).filter(sentence => sentence.trim().length > 0);
    }
    
    getParagraphs(text) {
        if (!text.trim()) return [];
        return text.split(/\n\n+/).filter(para => para.trim().length > 0);
    }
    
    // Word Frequency Analysis
    analyzeWordFrequency() {
        const text = this.textInput.value;
        const words = this.getWords(text);
        
        if (words.length === 0) {
            this.wordFrequency.innerHTML = '<p class="empty-message">متنی برای تحلیل وجود ندارد</p>';
            return;
        }
        
        // Count word frequencies
        const frequency = {};
        words.forEach(word => {
            // Normalize word (remove punctuation and convert to lowercase)
            const normalized = word.replace(/[.,،؛:;!؟?"«»()\[\]{}]/g, '').toLowerCase();
            if (normalized.length > 0) {
                frequency[normalized] = (frequency[normalized] || 0) + 1;
            }
        });
        
        // Filter by minimum occurrence
        const minOcc = parseInt(this.minOccurrence.value) || 2;
        const filtered = Object.entries(frequency)
            .filter(([_word, count]) => count >= minOcc)
            .sort((a, b) => b[1] - a[1]);
        
        if (filtered.length === 0) {
            this.wordFrequency.innerHTML = `<p class="empty-message">هیچ کلمه‌ای با حداقل ${minOcc.toLocaleString('fa-IR')} تکرار یافت نشد</p>`;
            return;
        }
        
        // Display results
        const maxCount = filtered[0][1];
        let html = '';
        
        filtered.forEach(([word, count]) => {
            const percentage = (count / maxCount) * 100;
            html += `
                <div class="word-item">
                    <span class="word-text">${this.escapeHtml(word)}</span>
                    <div class="word-bar-container">
                        <div class="word-bar" style="width: ${percentage}%"></div>
                    </div>
                    <span class="word-count">${count.toLocaleString('fa-IR')} بار</span>
                </div>
            `;
        });
        
        this.wordFrequency.innerHTML = html;
    }
    
    // Text Management Functions
    clearText() {
        if (this.textInput.value.trim() && !confirm('آیا مطمئن هستید که می‌خواهید متن را پاک کنید؟')) {
            return;
        }
        this.textInput.value = '';
        this.updateStats();
        this.wordFrequency.innerHTML = '<p class="empty-message">متن خود را وارد کنید و دکمه تحلیل را بزنید</p>';
        localStorage.removeItem('lastText');
    }
    
    saveText() {
        const text = this.textInput.value.trim();
        
        if (!text) {
            alert('لطفاً ابتدا متنی وارد کنید');
            return;
        }
        
        // Get current history
        let history = this.getHistory();
        
        // Create new history item
        const item = {
            id: Date.now(),
            text: text,
            date: new Date().toLocaleString('fa-IR'),
            stats: {
                words: this.getWords(text).length,
                sentences: this.getSentences(text).length,
                characters: text.length
            }
        };
        
        // Add to beginning of history
        history.unshift(item);
        
        // Keep only last 10 items
        if (history.length > 10) {
            history = history.slice(0, 10);
        }
        
        // Save to localStorage
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        
        // Reload history display
        this.loadHistory();
        
        // Show success message
        this.showNotification('متن با موفقیت ذخیره شد');
    }
    
    // History Management Functions
    getHistory() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading history:', e);
            return [];
        }
    }
    
    loadHistory() {
        const history = this.getHistory();
        
        if (history.length === 0) {
            this.historyList.innerHTML = '<p class="empty-message">هنوز متنی ذخیره نشده است</p>';
            return;
        }
        
        let html = '';
        history.forEach(item => {
            const preview = item.text.length > 150 ? item.text.substring(0, 150) + '...' : item.text;
            html += `
                <div class="history-item" data-id="${item.id}">
                    <div class="history-item-header">
                        <div class="history-date">${item.date}</div>
                    </div>
                    <div class="history-text" id="text-${item.id}">${this.escapeHtml(preview)}</div>
                    <div class="history-stats">
                        <span class="history-stat">📝 ${item.stats.characters.toLocaleString('fa-IR')} کاراکتر</span>
                        <span class="history-stat">🔤 ${item.stats.words.toLocaleString('fa-IR')} کلمه</span>
                        <span class="history-stat">📋 ${item.stats.sentences.toLocaleString('fa-IR')} جمله</span>
                    </div>
                    <div class="history-actions">
                        ${item.text.length > 150 ? '<button class="btn btn-toggle btn-toggle-text" data-id="' + item.id + '">نمایش کامل</button>' : ''}
                        <button class="btn btn-restore" data-id="${item.id}">بازگردانی</button>
                        <button class="btn btn-delete" data-id="${item.id}">حذف</button>
                    </div>
                </div>
            `;
        });
        
        this.historyList.innerHTML = html;
        
        // Add event listeners
        this.historyList.querySelectorAll('.btn-restore').forEach(btn => {
            btn.addEventListener('click', (e) => this.restoreText(e.target.dataset.id));
        });
        
        this.historyList.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => this.deleteHistoryItem(e.target.dataset.id));
        });
        
        this.historyList.querySelectorAll('.btn-toggle-text').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleFullText(e.target.dataset.id));
        });
    }
    
    restoreText(id) {
        const history = this.getHistory();
        const item = history.find(h => h.id === parseInt(id));
        
        if (item) {
            this.textInput.value = item.text;
            this.updateStats();
            this.textInput.focus();
            this.textInput.scrollIntoView({ behavior: 'smooth', block: 'start' });
            this.showNotification('متن بازگردانی شد');
        }
    }
    
    deleteHistoryItem(id) {
        if (!confirm('آیا مطمئن هستید که می‌خواهید این متن را حذف کنید؟')) {
            return;
        }
        
        let history = this.getHistory();
        history = history.filter(h => h.id !== parseInt(id));
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        this.loadHistory();
        this.showNotification('متن حذف شد');
    }
    
    clearHistory() {
        if (!confirm('آیا مطمئن هستید که می‌خواهید تمام متن‌های ذخیره شده را حذف کنید؟')) {
            return;
        }
        
        localStorage.removeItem(this.STORAGE_KEY);
        this.loadHistory();
        this.showNotification('تمام متن‌ها حذف شدند');
    }
    
    toggleFullText(id) {
        const history = this.getHistory();
        const item = history.find(h => h.id === parseInt(id));
        const textElement = document.getElementById(`text-${id}`);
        const btn = this.historyList.querySelector(`.btn-toggle-text[data-id="${id}"]`);
        
        if (!item || !textElement || !btn) return;
        
        if (textElement.classList.contains('expanded')) {
            textElement.textContent = item.text.substring(0, 150) + '...';
            textElement.classList.remove('expanded');
            btn.textContent = 'نمایش کامل';
        } else {
            textElement.textContent = item.text;
            textElement.classList.add('expanded');
            btn.textContent = 'نمایش خلاصه';
        }
    }
    
    // LocalStorage Functions
    autoSave(text) {
        if (text.trim()) {
            localStorage.setItem('lastText', text);
        }
    }
    
    loadLastText() {
        const lastText = localStorage.getItem('lastText');
        if (lastText) {
            this.textInput.value = lastText;
        }
    }
    
    // Utility Functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showNotification(message) {
        // Simple notification using alert
        // Could be replaced with a custom notification system
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
            font-family: 'Vazirmatn', sans-serif;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TextAnalyzer();
});

