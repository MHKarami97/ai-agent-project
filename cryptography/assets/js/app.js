/**
 * اپلیکیشن اصلی - مدیریت رابط کاربری و تعامل‌ها
 */

class App {
    constructor() {
        this.currentTab = 'encrypt';
        this.init();
    }

    /**
     * راه‌اندازی اولیه
     */
    async init() {
        // راه‌اندازی دیتابیس
        await storageManager.init();

        // راه‌اندازی event listeners
        this.setupEventListeners();

        // بارگذاری تاریخچه
        await this.loadHistory();
    }

    /**
     * راه‌اندازی event listeners
     */
    setupEventListeners() {
        // تب‌ها
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // فرم رمزنگاری
        document.getElementById('encrypt-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEncrypt();
        });

        // فرم رمزگشایی
        document.getElementById('decrypt-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleDecrypt();
        });

        // دکمه‌های نمایش/مخفی کردن رمز
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetId = e.currentTarget.dataset.target;
                const input = document.getElementById(targetId);
                if (input.type === 'password') {
                    input.type = 'text';
                    e.currentTarget.querySelector('.eye-icon').textContent = '🙈';
                } else {
                    input.type = 'password';
                    e.currentTarget.querySelector('.eye-icon').textContent = '👁️';
                }
            });
        });

        // دکمه کپی متن رمزنگاری شده
        document.getElementById('copy-encrypted').addEventListener('click', () => {
            const text = document.getElementById('encrypted-text').textContent;
            this.copyToClipboard(text, 'متن رمزنگاری شده کپی شد');
        });

        // دکمه ذخیره در تاریخچه
        document.getElementById('save-encrypted').addEventListener('click', () => {
            this.saveCurrentEncryption();
        });

        // دکمه کپی متن رمزگشایی شده
        document.getElementById('copy-decrypted').addEventListener('click', () => {
            const text = document.getElementById('decrypted-text').textContent;
            this.copyToClipboard(text, 'متن اصلی کپی شد');
        });

        // دکمه پاک کردن تاریخچه
        document.getElementById('clear-history').addEventListener('click', () => {
            this.clearHistory();
        });
    }

    /**
     * تغییر تب
     */
    switchTab(tabName) {
        // حذف active از همه تب‌ها
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // اضافه کردن active به تب انتخاب شده
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;

        // بارگذاری تاریخچه اگر تب تاریخچه باز شد
        if (tabName === 'history') {
            this.loadHistory();
        }
    }

    /**
     * پردازش رمزنگاری
     */
    async handleEncrypt() {
        try {
            const plainText = document.getElementById('plain-text').value.trim();
            const password = document.getElementById('encrypt-key').value;

            // اعتبارسنجی
            cryptoManager.validateText(plainText);
            cryptoManager.validatePassword(password);

            // دریافت مجموعه کاراکترهای انتخاب شده
            const selectedCharsets = Array.from(
                document.querySelectorAll('input[name="charset"]:checked')
            ).map(cb => cb.value);

            if (selectedCharsets.length === 0) {
                this.showToast('لطفاً حداقل یک نوع کاراکتر را انتخاب کنید', 'error');
                return;
            }

            // رمزنگاری
            const cipherText = await cryptoManager.encrypt(plainText, password);
            
            // تبدیل به کاراکترهای انتخاب شده
            const displayText = cryptoManager.encodeToCharset(cipherText, selectedCharsets);

            // نمایش نتیجه
            document.getElementById('encrypted-text').textContent = displayText;
            document.getElementById('encrypt-result').style.display = 'block';

            // ذخیره موقت برای استفاده در دکمه ذخیره
            this.lastEncryption = {
                plainText,
                cipherText,
                displayText,
                charsets: selectedCharsets
            };

            this.showToast('متن با موفقیت رمزنگاری شد', 'success');

        } catch (error) {
            this.showToast(error.message, 'error');
            console.error('خطا در رمزنگاری:', error);
        }
    }

    /**
     * پردازش رمزگشایی
     */
    async handleDecrypt() {
        try {
            const encodedText = document.getElementById('cipher-text').value.trim();
            const password = document.getElementById('decrypt-key').value;

            // اعتبارسنجی
            cryptoManager.validateText(encodedText);
            cryptoManager.validatePassword(password);

            // تبدیل از کاراکترهای نمایشی به Base64
            const cipherText = cryptoManager.decodeFromCharset(encodedText);

            // رمزگشایی
            const plainText = await cryptoManager.decrypt(cipherText, password);

            // نمایش نتیجه
            document.getElementById('decrypted-text').textContent = plainText;
            document.getElementById('decrypt-result').style.display = 'block';
            document.getElementById('decrypt-error').style.display = 'none';

            this.showToast('متن با موفقیت رمزگشایی شد', 'success');

        } catch (error) {
            document.getElementById('decrypt-result').style.display = 'none';
            document.getElementById('decrypt-error').style.display = 'flex';
            document.getElementById('decrypt-error-text').textContent = error.message;
            
            this.showToast('رمزگشایی ناموفق بود', 'error');
            console.error('خطا در رمزگشایی:', error);
        }
    }

    /**
     * ذخیره رمزنگاری فعلی در تاریخچه
     */
    async saveCurrentEncryption() {
        if (!this.lastEncryption) {
            this.showToast('هیچ موردی برای ذخیره وجود ندارد', 'error');
            return;
        }

        try {
            await storageManager.saveHistory(this.lastEncryption);
            this.showToast('در تاریخچه ذخیره شد', 'success');
            
            // بارگذاری مجدد تاریخچه
            await this.loadHistory();
        } catch (error) {
            this.showToast('خطا در ذخیره‌سازی', 'error');
            console.error('خطا در ذخیره:', error);
        }
    }

    /**
     * بارگذاری تاریخچه
     */
    async loadHistory() {
        try {
            const history = await storageManager.getAllHistory();
            const historyList = document.getElementById('history-list');

            if (history.length === 0) {
                historyList.innerHTML = `
                    <div class="empty-state">
                        <span class="icon">📭</span>
                        <p>هنوز هیچ موردی ذخیره نشده است</p>
                    </div>
                `;
                return;
            }

            historyList.innerHTML = history.map(item => this.createHistoryItem(item)).join('');

            // اضافه کردن event listeners به دکمه‌ها
            historyList.querySelectorAll('.copy-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const text = e.target.dataset.text;
                    this.copyToClipboard(text, 'کپی شد');
                });
            });

            historyList.querySelectorAll('.delete-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.target.dataset.id);
                    this.deleteHistoryItem(id);
                });
            });

            historyList.querySelectorAll('.use-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const text = e.target.dataset.text;
                    document.getElementById('cipher-text').value = text;
                    this.switchTab('decrypt');
                    this.showToast('متن در بخش رمزگشایی قرار گرفت', 'success');
                });
            });

        } catch (error) {
            console.error('خطا در بارگذاری تاریخچه:', error);
        }
    }

    /**
     * ساخت HTML برای یک مورد تاریخچه
     */
    createHistoryItem(item) {
        const date = new Date(item.timestamp);
        const persianDate = this.formatPersianDate(date);
        const charsetLabels = {
            persian: 'فارسی',
            english: 'انگلیسی',
            numbers: 'اعداد',
            symbols: 'علائم'
        };
        const charsetText = item.charsets.map(cs => charsetLabels[cs] || cs).join(' + ');

        return `
            <div class="history-item">
                <div class="history-item-header">
                    <div class="history-item-date">${persianDate}</div>
                    <div class="history-item-charset">${charsetText}</div>
                </div>
                <div class="history-item-text">
                    <strong>متن اصلی:</strong>
                    <p>${this.escapeHtml(item.plainText.substring(0, 100))}${item.plainText.length > 100 ? '...' : ''}</p>
                </div>
                <div class="history-item-text">
                    <strong>متن رمزنگاری شده:</strong>
                    <p>${this.escapeHtml(item.displayText.substring(0, 150))}${item.displayText.length > 150 ? '...' : ''}</p>
                </div>
                <div class="history-item-actions">
                    <button class="btn btn-secondary use-item" data-text="${this.escapeHtml(item.displayText)}">
                        <span class="icon">🔓</span>
                        رمزگشایی
                    </button>
                    <button class="btn btn-secondary copy-item" data-text="${this.escapeHtml(item.displayText)}">
                        <span class="icon">📋</span>
                        کپی
                    </button>
                    <button class="btn btn-danger delete-item" data-id="${item.id}">
                        <span class="icon">🗑️</span>
                        حذف
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * حذف یک مورد از تاریخچه
     */
    async deleteHistoryItem(id) {
        if (!confirm('آیا مطمئن هستید که می‌خواهید این مورد را حذف کنید؟')) {
            return;
        }

        try {
            await storageManager.deleteHistory(id);
            this.showToast('مورد حذف شد', 'success');
            await this.loadHistory();
        } catch (error) {
            this.showToast('خطا در حذف', 'error');
            console.error('خطا در حذف:', error);
        }
    }

    /**
     * پاک کردن تمام تاریخچه
     */
    async clearHistory() {
        if (!confirm('آیا مطمئن هستید که می‌خواهید تمام تاریخچه را پاک کنید؟')) {
            return;
        }

        try {
            await storageManager.clearAllHistory();
            this.showToast('تاریخچه پاک شد', 'success');
            await this.loadHistory();
        } catch (error) {
            this.showToast('خطا در پاک کردن', 'error');
            console.error('خطا در پاک کردن:', error);
        }
    }

    /**
     * کپی متن به کلیپبورد
     */
    async copyToClipboard(text, message) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast(message || 'کپی شد', 'success');
        } catch (error) {
            // روش جایگزین برای مرورگرهای قدیمی
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showToast(message || 'کپی شد', 'success');
        }
    }

    /**
     * نمایش پیام toast
     */
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    /**
     * فرمت تاریخ شمسی (ساده شده)
     */
    formatPersianDate(date) {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        // برای سادگی از تاریخ میلادی به فارسی استفاده می‌کنیم
        return date.toLocaleDateString('fa-IR', options);
    }

    /**
     * Escape HTML برای جلوگیری از XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// راه‌اندازی اپلیکیشن
document.addEventListener('DOMContentLoaded', () => {
    new App();
});

