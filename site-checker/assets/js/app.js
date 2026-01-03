// مدیریت Local Storage
const Storage = {
    KEYS: {
        SAVED_SITES: 'siteChecker_savedSites',
        HISTORY: 'siteChecker_history'
    },

    getSavedSites() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.SAVED_SITES)) || [];
        } catch (e) {
            return [];
        }
    },

    saveSite(site) {
        const sites = this.getSavedSites();
        const exists = sites.find(s => s.url === site.url);
        if (!exists) {
            sites.unshift({
                url: site.url,
                date: new Date().toISOString()
            });
            localStorage.setItem(this.KEYS.SAVED_SITES, JSON.stringify(sites));
            return true;
        }
        return false;
    },

    removeSite(url) {
        let sites = this.getSavedSites();
        sites = sites.filter(s => s.url !== url);
        localStorage.setItem(this.KEYS.SAVED_SITES, JSON.stringify(sites));
    },

    clearSavedSites() {
        localStorage.removeItem(this.KEYS.SAVED_SITES);
    },

    getHistory() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.HISTORY)) || [];
        } catch (e) {
            return [];
        }
    },

    addToHistory(check) {
        const history = this.getHistory();
        history.unshift({
            ...check,
            date: new Date().toISOString()
        });
        // حداکثر 50 آیتم در تاریخچه
        if (history.length > 50) {
            history.pop();
        }
        localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
    },

    clearHistory() {
        localStorage.removeItem(this.KEYS.HISTORY);
    }
};

// تست و بررسی سایت
class SiteChecker {
    constructor(url) {
        this.url = this.normalizeUrl(url);
        this.results = {
            url: this.url,
            accessible: false,
            blockType: 'نامشخص',
            dnsStatus: 'در حال بررسی...',
            httpStatus: 'در حال بررسی...',
            httpsStatus: 'در حال بررسی...',
            details: ''
        };
    }

    normalizeUrl(url) {
        url = url.trim().toLowerCase();
        url = url.replace(/^https?:\/\//, '');
        url = url.replace(/\/$/, '');
        return url;
    }

    async check() {
        try {
            // تست DNS و دسترسی
            await this.checkDNS();
            await this.checkHTTP();
            await this.checkHTTPS();
            
            // تحلیل نتایج
            this.analyzeResults();
            
            return this.results;
        } catch (error) {
            this.results.details = `خطا در بررسی: ${error.message}`;
            return this.results;
        }
    }

    async checkDNS() {
        try {
            // سعی در دسترسی به سایت برای تست DNS
            const response = await fetch(`https://${this.url}`, {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            
            this.results.dnsStatus = '✓ موفق';
            return true;
        } catch (error) {
            if (error.message.includes('Failed to fetch')) {
                this.results.dnsStatus = '✗ ناموفق - احتمال مسدودی DNS';
            } else {
                this.results.dnsStatus = '✗ خطا';
            }
            return false;
        }
    }

    async checkHTTP() {
        try {
            const response = await fetch(`http://${this.url}`, {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            
            this.results.httpStatus = '✓ قابل دسترس';
            return true;
        } catch (error) {
            this.results.httpStatus = '✗ غیرقابل دسترس';
            return false;
        }
    }

    async checkHTTPS() {
        try {
            const response = await fetch(`https://${this.url}`, {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            
            this.results.httpsStatus = '✓ قابل دسترس';
            return true;
        } catch (error) {
            this.results.httpsStatus = '✗ غیرقابل دسترس';
            return false;
        }
    }

    analyzeResults() {
        const httpAccessible = this.results.httpStatus.includes('✓');
        const httpsAccessible = this.results.httpsStatus.includes('✓');
        const dnsWorking = this.results.dnsStatus.includes('✓');

        if (httpAccessible && httpsAccessible) {
            this.results.accessible = true;
            this.results.blockType = 'فیلتر نشده';
            this.results.details = 'سایت به صورت کامل قابل دسترسی است. هیچ مسدودی‌ای تشخیص داده نشد.';
        } else if (!dnsWorking) {
            this.results.accessible = false;
            this.results.blockType = 'فیلتر DNS';
            this.results.details = 'DNS سایت پاسخ نمی‌دهد. احتمالاً از طریق DNS فیلتر شده است. می‌توانید از DNS عمومی مانند 1.1.1.1 یا 8.8.8.8 استفاده کنید.';
        } else if (!httpAccessible && !httpsAccessible) {
            this.results.accessible = false;
            this.results.blockType = 'فیلتر IP';
            this.results.details = 'سایت از طریق IP مسدود شده است. برای دسترسی به آن نیاز به استفاده از VPN یا Proxy دارید.';
        } else if (httpAccessible && !httpsAccessible) {
            this.results.accessible = 'partial';
            this.results.blockType = 'فیلتر HTTPS/SNI';
            this.results.details = 'فقط HTTP قابل دسترسی است و HTTPS مسدود شده. احتمالاً فیلتر SNI یا SSL است. استفاده از ابزارهای دور زدن SNI می‌تواند مفید باشد.';
        } else {
            this.results.accessible = 'partial';
            this.results.blockType = 'فیلتر جزئی';
            this.results.details = 'سایت به صورت جزئی قابل دسترسی است. ممکن است برخی پورت‌ها یا پروتکل‌ها مسدود باشند.';
        }
    }
}

// مدیریت UI
class UI {
    constructor() {
        this.elements = {
            urlInput: document.getElementById('urlInput'),
            checkBtn: document.getElementById('checkBtn'),
            addToHistoryBtn: document.getElementById('addToHistoryBtn'),
            resultSection: document.getElementById('resultSection'),
            resultUrl: document.getElementById('resultUrl'),
            resultStatus: document.getElementById('resultStatus'),
            accessStatus: document.getElementById('accessStatus'),
            blockType: document.getElementById('blockType'),
            dnsStatus: document.getElementById('dnsStatus'),
            httpStatus: document.getElementById('httpStatus'),
            httpsStatus: document.getElementById('httpsStatus'),
            detailsContent: document.getElementById('detailsContent'),
            savedList: document.getElementById('savedList'),
            historyList: document.getElementById('historyList'),
            clearAllBtn: document.getElementById('clearAllBtn'),
            clearHistoryBtn: document.getElementById('clearHistoryBtn'),
            toast: document.getElementById('toast')
        };

        this.currentResult = null;
        this.initEventListeners();
        this.loadSavedSites();
        this.loadHistory();
    }

    initEventListeners() {
        this.elements.checkBtn.addEventListener('click', () => this.checkSite());
        this.elements.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkSite();
            }
        });
        this.elements.addToHistoryBtn.addEventListener('click', () => this.saveCurrentSite());
        this.elements.clearAllBtn.addEventListener('click', () => this.clearAllSaved());
        this.elements.clearHistoryBtn.addEventListener('click', () => this.clearAllHistory());
    }

    async checkSite() {
        const url = this.elements.urlInput.value.trim();
        
        if (!url) {
            this.showToast('لطفاً آدرس سایت را وارد کنید', 'error');
            return;
        }

        // شروع loading
        this.elements.checkBtn.classList.add('loading');
        this.elements.checkBtn.disabled = true;
        this.elements.resultSection.classList.add('hidden');

        try {
            const checker = new SiteChecker(url);
            const results = await checker.check();
            
            this.currentResult = results;
            this.displayResults(results);
            
            // افزودن به تاریخچه
            Storage.addToHistory(results);
            this.loadHistory();
            
            this.showToast('بررسی با موفقیت انجام شد', 'success');
        } catch (error) {
            this.showToast('خطا در انجام بررسی', 'error');
        } finally {
            this.elements.checkBtn.classList.remove('loading');
            this.elements.checkBtn.disabled = false;
        }
    }

    displayResults(results) {
        this.elements.resultUrl.textContent = results.url;
        
        // تعیین وضعیت
        let statusClass = '';
        let statusText = '';
        
        if (results.accessible === true) {
            statusClass = 'accessible';
            statusText = 'قابل دسترس';
        } else if (results.accessible === 'partial') {
            statusClass = 'partial';
            statusText = 'دسترسی محدود';
        } else {
            statusClass = 'blocked';
            statusText = 'مسدود';
        }
        
        this.elements.resultStatus.className = `status-badge ${statusClass}`;
        this.elements.resultStatus.textContent = statusText;
        
        this.elements.accessStatus.textContent = statusText;
        this.elements.blockType.textContent = results.blockType;
        this.elements.dnsStatus.textContent = results.dnsStatus;
        this.elements.httpStatus.textContent = results.httpStatus;
        this.elements.httpsStatus.textContent = results.httpsStatus;
        this.elements.detailsContent.textContent = results.details;
        
        this.elements.resultSection.classList.remove('hidden');
        this.elements.resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    saveCurrentSite() {
        if (!this.currentResult) {
            this.showToast('ابتدا یک سایت را بررسی کنید', 'warning');
            return;
        }

        const saved = Storage.saveSite({ url: this.currentResult.url });
        
        if (saved) {
            this.loadSavedSites();
            this.showToast('سایت به لیست ذخیره شده اضافه شد', 'success');
        } else {
            this.showToast('این سایت قبلاً ذخیره شده است', 'warning');
        }
    }

    loadSavedSites() {
        const sites = Storage.getSavedSites();
        
        if (sites.length === 0) {
            this.elements.savedList.innerHTML = `
                <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4"></path>
                        <path d="M12 8h.01"></path>
                    </svg>
                    <p>هیچ سایتی ذخیره نشده است</p>
                </div>
            `;
            return;
        }

        this.elements.savedList.innerHTML = sites.map(site => `
            <div class="saved-item">
                <div class="saved-item-info">
                    <div class="saved-item-url">${site.url}</div>
                    <div class="saved-item-date">${this.formatDate(site.date)}</div>
                </div>
                <div class="saved-item-actions">
                    <button class="btn-icon btn-check" onclick="app.checkSavedSite('${site.url}')">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </button>
                    <button class="btn-icon btn-delete" onclick="app.removeSavedSite('${site.url}')">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    loadHistory() {
        const history = Storage.getHistory();
        
        if (history.length === 0) {
            this.elements.historyList.innerHTML = `
                <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <p>هیچ آزمایشی انجام نشده است</p>
                </div>
            `;
            return;
        }

        this.elements.historyList.innerHTML = history.map(item => {
            let statusClass = 'success';
            if (item.accessible === false) {
                statusClass = 'danger';
            } else if (item.accessible === 'partial') {
                statusClass = 'warning';
            }

            return `
                <div class="history-item" onclick="app.showHistoryDetails('${item.url}', ${item.date})">
                    <div class="history-item-info">
                        <div class="history-item-url">${item.url}</div>
                        <div class="history-item-date">${this.formatDate(item.date)}</div>
                        <div class="history-item-status">
                            <span class="history-status-tag ${statusClass}">${item.blockType}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    checkSavedSite(url) {
        this.elements.urlInput.value = url;
        this.checkSite();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    removeSavedSite(url) {
        Storage.removeSite(url);
        this.loadSavedSites();
        this.showToast('سایت حذف شد', 'success');
    }

    clearAllSaved() {
        if (confirm('آیا از پاک کردن تمام سایت‌های ذخیره شده مطمئن هستید؟')) {
            Storage.clearSavedSites();
            this.loadSavedSites();
            this.showToast('همه سایت‌ها پاک شدند', 'success');
        }
    }

    clearAllHistory() {
        if (confirm('آیا از پاک کردن تاریخچه مطمئن هستید؟')) {
            Storage.clearHistory();
            this.loadHistory();
            this.showToast('تاریخچه پاک شد', 'success');
        }
    }

    showHistoryDetails(url, timestamp) {
        const history = Storage.getHistory();
        const item = history.find(h => h.url === url && h.date === timestamp);
        if (item) {
            this.currentResult = item;
            this.displayResults(item);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'هم‌اکنون';
        if (minutes < 60) return `${minutes} دقیقه پیش`;
        if (hours < 24) return `${hours} ساعت پیش`;
        if (days < 7) return `${days} روز پیش`;

        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('fa-IR', options);
    }

    showToast(message, type = 'success') {
        this.elements.toast.textContent = message;
        this.elements.toast.className = `toast ${type}`;
        this.elements.toast.classList.remove('hidden');

        setTimeout(() => {
            this.elements.toast.classList.add('hidden');
        }, 3000);
    }
}

// راه‌اندازی برنامه
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new UI();
});

