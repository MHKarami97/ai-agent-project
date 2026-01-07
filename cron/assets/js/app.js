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


// ==================== Class: CronParser ====================
class CronParser {
    constructor(expression) {
        this.expression = expression;
        this.parts = expression.split(' ');
        
        if (this.parts.length !== 5) {
            throw new Error('عبارت کرون نامعتبر است');
        }
    }

    // محاسبه اجرای بعدی
    getNextRun(fromDate = new Date()) {
        const [minute, hour, day, month, dayOfWeek] = this.parts;
        let current = new Date(fromDate);
        current.setSeconds(0);
        current.setMilliseconds(0);
        
        // شروع از دقیقه بعدی
        current.setMinutes(current.getMinutes() + 1);
        
        let attempts = 0;
        const maxAttempts = 366 * 24 * 60; // یک سال
        
        while (attempts < maxAttempts) {
            if (this.matchesCron(current, minute, hour, day, month, dayOfWeek)) {
                return current;
            }
            current.setMinutes(current.getMinutes() + 1);
            attempts++;
        }
        
        return null;
    }

    // بررسی تطابق تاریخ با کرون
    matchesCron(date, minute, hour, day, month, dayOfWeek) {
        const currentMinute = date.getMinutes();
        const currentHour = date.getHours();
        const currentDay = date.getDate();
        const currentMonth = date.getMonth() + 1;
        const currentDayOfWeek = date.getDay();
        
        return this.matchesValue(currentMinute, minute) &&
               this.matchesValue(currentHour, hour) &&
               this.matchesValue(currentDay, day) &&
               this.matchesValue(currentMonth, month) &&
               this.matchesValue(currentDayOfWeek, dayOfWeek);
    }

    // بررسی تطابق مقدار
    matchesValue(value, pattern) {
        if (pattern === '*') return true;
        
        // محدوده (مثال: 1-5)
        if (pattern.includes('-')) {
            const [start, end] = pattern.split('-').map(Number);
            return value >= start && value <= end;
        }
        
        // لیست (مثال: 1,3,5)
        if (pattern.includes(',')) {
            const values = pattern.split(',').map(Number);
            return values.includes(value);
        }
        
        // گام (مثال: */5)
        if (pattern.includes('/')) {
            const [base, step] = pattern.split('/');
            const stepNum = parseInt(step);
            if (base === '*') {
                return value % stepNum === 0;
            }
        }
        
        return value === parseInt(pattern);
    }

    // محاسبه چندین اجرای بعدی
    getNextRuns(count = 10, fromDate = new Date()) {
        const runs = [];
        let current = new Date(fromDate);
        
        for (let i = 0; i < count; i++) {
            const next = this.getNextRun(current);
            if (next) {
                runs.push(new Date(next));
                current = new Date(next);
                current.setSeconds(current.getSeconds() + 1);
            } else {
                break;
            }
        }
        
        return runs;
    }

    // توضیح متنی کرون
    describe() {
        const [minute, hour, day, month, dayOfWeek] = this.parts;
        
        // چند حالت رایج
        if (this.expression === '* * * * *') {
            return 'هر دقیقه';
        }
        if (this.expression === '0 * * * *') {
            return 'هر ساعت';
        }
        if (this.expression === '0 0 * * *') {
            return 'هر روز در نیمه‌شب';
        }
        if (this.expression === '0 0 * * 0') {
            return 'هر یکشنبه در نیمه‌شب';
        }
        if (this.expression === '0 0 1 * *') {
            return 'اول هر ماه در نیمه‌شب';
        }
        
        let description = '';
        
        // دقیقه
        if (minute === '*') {
            description += 'هر دقیقه';
        } else if (minute.includes('/')) {
            const step = minute.split('/')[1];
            description += `هر ${step} دقیقه`;
        } else {
            description += `در دقیقه ${minute}`;
        }
        
        // ساعت
        if (hour !== '*') {
            if (hour.includes(',')) {
                description += ` در ساعت‌های ${hour}`;
            } else {
                description += ` در ساعت ${hour}`;
            }
        }
        
        // روز
        if (day !== '*') {
            description += ` در روز ${day}`;
        }
        
        // ماه
        if (month !== '*') {
            const monthNames = ['', 'ژانویه', 'فوریه', 'مارس', 'آوریل', 'می', 'ژوئن', 
                              'جولای', 'آگوست', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'];
            description += ` در ماه ${monthNames[parseInt(month)]}`;
        }
        
        // روز هفته
        if (dayOfWeek !== '*') {
            const dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
            description += ` در ${dayNames[parseInt(dayOfWeek)]}`;
        }
        
        return description;
    }
}

// ==================== Class: CronJobManager ====================
class CronJobManager {
    constructor() {
        this.jobs = this.loadJobs();
        this.history = this.loadHistory();
        this.nextRunsCount = 5;
    }

    // بارگذاری جاب‌ها از LocalStorage
    loadJobs() {
        const data = localStorage.getItem('cronJobs');
        return data ? JSON.parse(data) : [];
    }

    // ذخیره جاب‌ها در LocalStorage
    saveJobs() {
        localStorage.setItem('cronJobs', JSON.stringify(this.jobs));
    }

    // بارگذاری تاریخچه
    loadHistory() {
        const data = localStorage.getItem('cronHistory');
        return data ? JSON.parse(data) : [];
    }

    // ذخیره تاریخچه
    saveHistory() {
        localStorage.setItem('cronHistory', JSON.stringify(this.history));
    }

    // اضافه کردن جاب جدید
    addJob(name, cronExpression, description = '', isActive = true) {
        try {
            const parser = new CronParser(cronExpression);
            const job = {
                id: Date.now().toString(),
                name,
                cronExpression,
                description,
                isActive,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };
            
            this.jobs.push(job);
            this.saveJobs();
            
            this.addHistory(name, 'ایجاد جاب');
            return job;
        } catch (error) {
            throw new Error('عبارت کرون نامعتبر است');
        }
    }

    // ویرایش جاب
    updateJob(id, name, cronExpression, description, isActive) {
        try {
            const parser = new CronParser(cronExpression);
            const index = this.jobs.findIndex(job => job.id === id);
            
            if (index !== -1) {
                this.jobs[index] = {
                    ...this.jobs[index],
                    name,
                    cronExpression,
                    description,
                    isActive,
                    lastModified: new Date().toISOString()
                };
                
                this.saveJobs();
                this.addHistory(name, 'ویرایش جاب');
                return this.jobs[index];
            }
        } catch (error) {
            throw new Error('عبارت کرون نامعتبر است');
        }
        
        return null;
    }

    // حذف جاب
    deleteJob(id) {
        const job = this.jobs.find(j => j.id === id);
        if (job) {
            this.jobs = this.jobs.filter(j => j.id !== id);
            this.saveJobs();
            this.addHistory(job.name, 'حذف جاب');
        }
    }

    // تغییر وضعیت جاب
    toggleJobStatus(id) {
        const job = this.jobs.find(j => j.id === id);
        if (job) {
            job.isActive = !job.isActive;
            job.lastModified = new Date().toISOString();
            this.saveJobs();
            this.addHistory(job.name, job.isActive ? 'فعال‌سازی' : 'غیرفعال‌سازی');
        }
    }

    // دریافت جاب با ID
    getJob(id) {
        return this.jobs.find(job => job.id === id);
    }

    // دریافت همه جاب‌ها
    getAllJobs() {
        return this.jobs;
    }

    // پاک کردن همه جاب‌ها
    clearAllJobs() {
        this.jobs = [];
        this.saveJobs();
        this.addHistory('سیستم', 'پاک کردن همه جاب‌ها');
    }

    // اضافه کردن به تاریخچه
    addHistory(jobName, action) {
        this.history.unshift({
            id: Date.now().toString(),
            jobName,
            action,
            timestamp: new Date().toISOString()
        });
        
        // نگه داشتن فقط 100 مورد آخر
        if (this.history.length > 100) {
            this.history = this.history.slice(0, 100);
        }
        
        this.saveHistory();
    }

    // دریافت تاریخچه
    getHistory() {
        return this.history;
    }

    // پاک کردن تاریخچه
    clearHistory() {
        this.history = [];
        this.saveHistory();
    }

    // خروجی جاب‌ها به JSON
    exportJobs() {
        return JSON.stringify(this.jobs, null, 2);
    }

    // ورودی جاب‌ها از JSON
    importJobs(jsonData) {
        try {
            const jobs = JSON.parse(jsonData);
            
            // اعتبارسنجی
            if (!Array.isArray(jobs)) {
                throw new Error('فرمت نامعتبر');
            }
            
            for (const job of jobs) {
                const parser = new CronParser(job.cronExpression);
            }
            
            this.jobs = jobs;
            this.saveJobs();
            this.addHistory('سیستم', 'ورود داده');
            
            return true;
        } catch (error) {
            throw new Error('فایل ورودی نامعتبر است');
        }
    }
}

// ==================== UI Manager ====================
class UIManager {
    constructor(jobManager) {
        this.jobManager = jobManager;
        this.currentEditId = null;
        this.initializeElements();
        this.attachEventListeners();
        this.render();
    }

    // مقداردهی اولیه عناصر DOM
    initializeElements() {
        this.jobForm = document.getElementById('jobForm');
        this.jobName = document.getElementById('jobName');
        this.cronExpression = document.getElementById('cronExpression');
        this.jobDescription = document.getElementById('jobDescription');
        this.isActive = document.getElementById('isActive');
        this.jobsList = document.getElementById('jobsList');
        this.historyList = document.getElementById('historyList');
        this.previewSection = document.getElementById('previewSection');
        this.nextRuns = document.getElementById('nextRuns');
        this.editModal = document.getElementById('editModal');
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
    }

    // اتصال رویدادها
    attachEventListeners() {
        // فرم ایجاد جاب
        this.jobForm.addEventListener('submit', (e) => this.handleJobSubmit(e));
        document.getElementById('resetForm').addEventListener('click', () => this.resetForm());

        // پیش‌نمایش زنده
        this.cronExpression.addEventListener('input', () => this.updatePreview());
        
        // نمایش بیشتر اجراها
        document.getElementById('showMoreRuns').addEventListener('click', () => {
            this.jobManager.nextRunsCount += 5;
            this.updatePreview();
        });

        // دکمه‌های اصلی
        document.getElementById('clearAllJobs').addEventListener('click', () => this.handleClearAllJobs());
        document.getElementById('exportJobs').addEventListener('click', () => this.handleExportJobs());
        document.getElementById('importJobsBtn').addEventListener('click', () => {
            document.getElementById('importJobs').click();
        });
        document.getElementById('importJobs').addEventListener('change', (e) => this.handleImportJobs(e));
        document.getElementById('clearHistory').addEventListener('click', () => this.handleClearHistory());

        // مودال ویرایش
        document.getElementById('closeEditModal').addEventListener('click', () => this.closeEditModal());
        document.getElementById('cancelEdit').addEventListener('click', () => this.closeEditModal());
        document.getElementById('saveEditJob').addEventListener('click', () => this.handleSaveEdit());

        // بستن مودال با کلیک روی backdrop
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) {
                this.closeEditModal();
            }
        });

        // Toast
        document.getElementById('toastClose').addEventListener('click', () => this.hideToast());
    }

    // مدیریت ارسال فرم
    handleJobSubmit(e) {
        e.preventDefault();
        
        try {
            this.jobManager.addJob(
                this.jobName.value.trim(),
                this.cronExpression.value.trim(),
                this.jobDescription.value.trim(),
                this.isActive.checked
            );
            
            this.showToast('جاب با موفقیت ایجاد شد', 'success');
            this.resetForm();
            this.render();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    // ریست کردن فرم
    resetForm() {
        this.jobForm.reset();
        this.isActive.checked = true;
        this.previewSection.style.display = 'none';
        this.jobManager.nextRunsCount = 5;
    }

    // به‌روزرسانی پیش‌نمایش
    updatePreview() {
        const expression = this.cronExpression.value.trim();
        
        if (!expression) {
            this.previewSection.style.display = 'none';
            return;
        }
        
        try {
            const parser = new CronParser(expression);
            const runs = parser.getNextRuns(this.jobManager.nextRunsCount);
            
            if (runs.length > 0) {
                this.previewSection.style.display = 'block';
                this.nextRuns.innerHTML = runs.map((run, index) => `
                    <div class="next-run-item">
                        <span class="run-number">اجرای ${index + 1}:</span>
                        <span class="run-time">${this.formatDate(run)}</span>
                    </div>
                `).join('');
            } else {
                this.previewSection.style.display = 'none';
            }
        } catch (error) {
            this.previewSection.style.display = 'none';
        }
    }

    // رندر کامل UI
    render() {
        this.renderJobs();
        this.renderHistory();
    }

    // رندر لیست جاب‌ها
    renderJobs() {
        const jobs = this.jobManager.getAllJobs();
        
        if (jobs.length === 0) {
            this.jobsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <p>هنوز هیچ کرون جابی ایجاد نکرده‌اید</p>
                    <small>با استفاده از فرم بالا، اولین کرون جاب خود را ایجاد کنید</small>
                </div>
            `;
            return;
        }
        
        this.jobsList.innerHTML = jobs.map(job => this.renderJobItem(job)).join('');
        
        // اتصال رویدادها
        jobs.forEach(job => {
            document.getElementById(`toggle-${job.id}`).addEventListener('click', () => {
                this.jobManager.toggleJobStatus(job.id);
                this.render();
                this.showToast('وضعیت جاب تغییر کرد', 'success');
            });
            
            document.getElementById(`edit-${job.id}`).addEventListener('click', () => {
                this.openEditModal(job.id);
            });
            
            document.getElementById(`delete-${job.id}`).addEventListener('click', () => {
                if (confirm('آیا از حذف این جاب اطمینان دارید؟')) {
                    this.jobManager.deleteJob(job.id);
                    this.render();
                    this.showToast('جاب حذف شد', 'success');
                }
            });
            
            document.getElementById(`preview-${job.id}`).addEventListener('click', () => {
                this.showJobPreview(job);
            });
        });
    }

    // رندر یک آیتم جاب
    renderJobItem(job) {
        const parser = new CronParser(job.cronExpression);
        const nextRun = parser.getNextRun();
        const description = parser.describe();
        
        return `
            <div class="job-item ${!job.isActive ? 'inactive' : ''}">
                <div class="job-header">
                    <div class="job-info">
                        <div class="job-name">${this.escapeHtml(job.name)}</div>
                        <div class="job-cron">${this.escapeHtml(job.cronExpression)}</div>
                        <div class="job-status ${job.isActive ? 'status-active' : 'status-inactive'}">
                            ${job.isActive ? 'فعال' : 'غیرفعال'}
                        </div>
                        ${job.description ? `<div class="job-description">${this.escapeHtml(job.description)}</div>` : ''}
                        <div class="job-meta">
                            <span>📅 توضیح: ${description}</span>
                            ${nextRun ? `<span>⏰ اجرای بعدی: ${this.formatDate(nextRun)}</span>` : ''}
                        </div>
                    </div>
                    <div class="job-actions">
                        <button class="btn btn-sm btn-outline" id="preview-${job.id}">پیش‌نمایش</button>
                        <button class="btn btn-sm ${job.isActive ? 'btn-secondary' : 'btn-success'}" id="toggle-${job.id}">
                            ${job.isActive ? 'غیرفعال' : 'فعال'}
                        </button>
                        <button class="btn btn-sm btn-primary" id="edit-${job.id}">ویرایش</button>
                        <button class="btn btn-sm btn-danger" id="delete-${job.id}">حذف</button>
                    </div>
                </div>
            </div>
        `;
    }

    // نمایش پیش‌نمایش جاب
    showJobPreview(job) {
        try {
            const parser = new CronParser(job.cronExpression);
            const runs = parser.getNextRuns(10);
            
            const message = `
                <strong>${this.escapeHtml(job.name)}</strong><br>
                <br>
                ${runs.map((run, i) => `${i + 1}. ${this.formatDate(run)}`).join('<br>')}
            `;
            
            this.showToast(message, 'info');
        } catch (error) {
            this.showToast('خطا در محاسبه اجراهای بعدی', 'error');
        }
    }

    // رندر تاریخچه
    renderHistory() {
        const history = this.jobManager.getHistory();
        
        if (history.length === 0) {
            this.historyList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <p>تاریخچه‌ای موجود نیست</p>
                </div>
            `;
            return;
        }
        
        this.historyList.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-job-name">${this.escapeHtml(item.jobName)} - ${this.escapeHtml(item.action)}</div>
                <div class="history-time">${this.formatDate(new Date(item.timestamp))}</div>
            </div>
        `).join('');
    }

    // باز کردن مودال ویرایش
    openEditModal(id) {
        const job = this.jobManager.getJob(id);
        if (!job) return;
        
        this.currentEditId = id;
        document.getElementById('editJobName').value = job.name;
        document.getElementById('editCronExpression').value = job.cronExpression;
        document.getElementById('editJobDescription').value = job.description || '';
        document.getElementById('editIsActive').checked = job.isActive;
        
        this.editModal.classList.add('active');
    }

    // بستن مودال ویرایش
    closeEditModal() {
        this.editModal.classList.remove('active');
        this.currentEditId = null;
    }

    // ذخیره ویرایش
    handleSaveEdit() {
        if (!this.currentEditId) return;
        
        try {
            this.jobManager.updateJob(
                this.currentEditId,
                document.getElementById('editJobName').value.trim(),
                document.getElementById('editCronExpression').value.trim(),
                document.getElementById('editJobDescription').value.trim(),
                document.getElementById('editIsActive').checked
            );
            
            this.closeEditModal();
            this.render();
            this.showToast('جاب با موفقیت ویرایش شد', 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    // پاک کردن همه جاب‌ها
    handleClearAllJobs() {
        if (confirm('آیا از پاک کردن همه جاب‌ها اطمینان دارید؟')) {
            this.jobManager.clearAllJobs();
            this.render();
            this.showToast('همه جاب‌ها پاک شدند', 'success');
        }
    }

    // خروجی جاب‌ها
    handleExportJobs() {
        const data = this.jobManager.exportJobs();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cron-jobs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('خروجی با موفقیت گرفته شد', 'success');
    }

    // ورودی جاب‌ها
    handleImportJobs(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                this.jobManager.importJobs(event.target.result);
                this.render();
                this.showToast('داده‌ها با موفقیت وارد شدند', 'success');
            } catch (error) {
                this.showToast(error.message, 'error');
            }
        };
        reader.readAsText(file);
        
        // ریست کردن input
        e.target.value = '';
    }

    // پاک کردن تاریخچه
    handleClearHistory() {
        if (confirm('آیا از پاک کردن تاریخچه اطمینان دارید؟')) {
            this.jobManager.clearHistory();
            this.render();
            this.showToast('تاریخچه پاک شد', 'success');
        }
    }

    // نمایش Toast
    showToast(message, type = 'success') {
        this.toast.className = `toast ${type} active`;
        this.toastMessage.innerHTML = message;
        
        setTimeout(() => {
            this.hideToast();
        }, 5000);
    }

    // مخفی کردن Toast
    hideToast() {
        this.toast.classList.remove('active');
    }

    // فرمت تاریخ
    formatDate(date) {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        
        return new Date(date).toLocaleDateString('fa-IR', options);
    }

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ==================== Initialize Application ====================
document.addEventListener('DOMContentLoaded', () => {
    const jobManager = new CronJobManager();
    const uiManager = new UIManager(jobManager);
    
    console.log('✅ Cron Job Manager initialized successfully');
});

