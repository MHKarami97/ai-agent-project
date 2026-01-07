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


// مدیریت دیتابیس IndexedDB
class EventDatabase {
    constructor() {
        this.dbName = 'EventLoggerDB';
        this.version = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('events')) {
                    const objectStore = db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
                    objectStore.createIndex('title', 'title', { unique: false });
                    objectStore.createIndex('date', 'date', { unique: false });
                }
            };
        });
    }

    async addEvent(event) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['events'], 'readwrite');
            const objectStore = transaction.objectStore('events');
            const request = objectStore.add(event);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateEvent(event) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['events'], 'readwrite');
            const objectStore = transaction.objectStore('events');
            const request = objectStore.put(event);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteEvent(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['events'], 'readwrite');
            const objectStore = transaction.objectStore('events');
            const request = objectStore.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getAllEvents() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['events'], 'readonly');
            const objectStore = transaction.objectStore('events');
            const request = objectStore.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getEvent(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['events'], 'readonly');
            const objectStore = transaction.objectStore('events');
            const request = objectStore.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clearAllEvents() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['events'], 'readwrite');
            const objectStore = transaction.objectStore('events');
            const request = objectStore.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// کلاس اصلی برنامه
class EventLogger {
    constructor() {
        this.db = new EventDatabase();
        this.events = [];
        this.currentEditId = null;
        this.currentLatLng = null;
        this.imageData = null;
        this.passwordCallback = null;
    }

    async init() {
        await this.db.init();
        await this.loadEvents();
        this.setupEventListeners();
        this.renderEvents();
    }

    setupEventListeners() {
        // فرم افزودن رویداد
        document.getElementById('eventForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEvent();
        });

        // بازنشانی فرم
        document.getElementById('resetForm').addEventListener('click', () => {
            this.resetForm();
        });

        // آپلود تصویر
        document.getElementById('eventImage').addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        // دریافت موقعیت مکانی
        document.getElementById('getLocationBtn').addEventListener('click', () => {
            this.getCurrentLocation();
        });

        // جستجو
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterEvents(e.target.value);
        });

        // مرتب‌سازی
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.sortEvents(e.target.value);
        });

        // خروجی
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.showPasswordModal('export');
        });

        // وارد کردن
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.showPasswordModal('import', e.target.files[0]);
        });

        // مودال‌ها
        this.setupModalListeners();
    }

    setupModalListeners() {
        const eventModal = document.getElementById('eventModal');
        const passwordModal = document.getElementById('passwordModal');

        // بستن مودال رویداد
        eventModal.querySelector('.close').addEventListener('click', () => {
            eventModal.classList.remove('show');
        });

        eventModal.addEventListener('click', (e) => {
            if (e.target === eventModal) {
                eventModal.classList.remove('show');
            }
        });

        // مودال رمز عبور
        document.getElementById('confirmPassword').addEventListener('click', () => {
            const password = document.getElementById('passwordInput').value;
            if (this.passwordCallback) {
                this.passwordCallback(password);
            }
            passwordModal.classList.remove('show');
            document.getElementById('passwordInput').value = '';
        });

        document.getElementById('cancelPassword').addEventListener('click', () => {
            passwordModal.classList.remove('show');
            document.getElementById('passwordInput').value = '';
            this.passwordCallback = null;
        });

        // تایید با Enter
        document.getElementById('passwordInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('confirmPassword').click();
            }
        });
    }

    async loadEvents() {
        this.events = await this.db.getAllEvents();
    }

    async saveEvent() {
        const title = document.getElementById('eventTitle').value.trim();
        const date = document.getElementById('eventDate').value;
        const description = document.getElementById('eventDescription').value.trim();
        const location = document.getElementById('eventLocation').value.trim();

        if (!title || !date) {
            this.showToast('لطفا عنوان و تاریخ را وارد کنید', 'error');
            return;
        }

        const event = {
            title,
            date,
            description,
            location,
            coordinates: this.currentLatLng,
            image: this.imageData,
            createdAt: new Date().toISOString()
        };

        try {
            if (this.currentEditId) {
                event.id = this.currentEditId;
                await this.db.updateEvent(event);
                this.showToast('رویداد با موفقیت ویرایش شد', 'success');
                this.currentEditId = null;
            } else {
                await this.db.addEvent(event);
                this.showToast('رویداد با موفقیت ثبت شد', 'success');
            }

            await this.loadEvents();
            this.renderEvents();
            this.resetForm();
        } catch (error) {
            console.error('Error saving event:', error);
            this.showToast('خطا در ذخیره رویداد', 'error');
        }
    }

    async deleteEvent(id) {
        if (!confirm('آیا مطمئن هستید که می‌خواهید این رویداد را حذف کنید؟')) {
            return;
        }

        try {
            await this.db.deleteEvent(id);
            await this.loadEvents();
            this.renderEvents();
            this.showToast('رویداد با موفقیت حذف شد', 'success');
        } catch (error) {
            console.error('Error deleting event:', error);
            this.showToast('خطا در حذف رویداد', 'error');
        }
    }

    async editEvent(id) {
        try {
            const event = await this.db.getEvent(id);
            if (!event) return;

            this.currentEditId = id;
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventDate').value = event.date;
            document.getElementById('eventDescription').value = event.description || '';
            document.getElementById('eventLocation').value = event.location || '';

            if (event.coordinates) {
                this.currentLatLng = event.coordinates;
                this.displayCoordinates(event.coordinates);
            }

            if (event.image) {
                this.imageData = event.image;
                this.displayImagePreview(event.image);
            }

            // اسکرول به فرم
            document.querySelector('.add-event-section').scrollIntoView({ behavior: 'smooth' });
            this.showToast('در حال ویرایش رویداد...', 'warning');
        } catch (error) {
            console.error('Error editing event:', error);
            this.showToast('خطا در بارگذاری رویداد', 'error');
        }
    }

    viewEvent(id) {
        const event = this.events.find(e => e.id === id);
        if (!event) return;

        const modal = document.getElementById('eventModal');
        const modalBody = document.getElementById('modalBody');

        let html = `
            <div class="event-title">${this.escapeHtml(event.title)}</div>
            <div class="event-date">📅 ${this.formatDate(event.date)}</div>
        `;

        if (event.description) {
            html += `<div class="event-description">${this.escapeHtml(event.description)}</div>`;
        }

        if (event.image) {
            html += `<img src="${event.image}" alt="Event Image" class="event-image">`;
        }

        if (event.location || event.coordinates) {
            html += `<div class="event-location">`;
            html += `<strong>📍 موقعیت مکانی:</strong><br>`;
            if (event.location) {
                html += `${this.escapeHtml(event.location)}<br>`;
            }
            if (event.coordinates) {
                html += `<a href="https://www.google.com/maps?q=${event.coordinates.lat},${event.coordinates.lng}" target="_blank">
                    مشاهده در نقشه (${event.coordinates.lat.toFixed(6)}, ${event.coordinates.lng.toFixed(6)})
                </a>`;
            }
            html += `</div>`;
        }

        modalBody.innerHTML = html;
        modal.classList.add('show');
    }

    renderEvents() {
        const container = document.getElementById('eventsList');
        const countElement = document.getElementById('eventCount');

        countElement.textContent = `${this.events.length} رویداد`;

        if (this.events.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <h3>هنوز رویدادی ثبت نشده است</h3>
                    <p>رویداد اول خود را ثبت کنید!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.events.map(event => `
            <div class="event-card" data-id="${event.id}">
                ${event.image ? `<img src="${event.image}" alt="Event" class="event-thumbnail">` : ''}
                <div class="event-card-header">
                    <div>
                        <div class="event-title">${this.escapeHtml(event.title)}</div>
                        <div class="event-date">📅 ${this.formatDate(event.date)}</div>
                    </div>
                    <div class="event-actions">
                        <button class="btn-view" onclick="app.viewEvent(${event.id})" title="مشاهده جزئیات">👁️</button>
                        <button class="btn-edit" onclick="app.editEvent(${event.id})" title="ویرایش">✏️</button>
                        <button class="btn-delete" onclick="app.deleteEvent(${event.id})" title="حذف">🗑️</button>
                    </div>
                </div>
                ${event.description ? `<div class="event-description">${this.escapeHtml(event.description.substring(0, 150))}${event.description.length > 150 ? '...' : ''}</div>` : ''}
                <div class="event-meta">
                    ${event.location ? `<div class="event-meta-item">📍 ${this.escapeHtml(event.location)}</div>` : ''}
                    ${event.coordinates ? `<div class="event-meta-item">🗺️ موقعیت GPS ثبت شده</div>` : ''}
                    ${event.image ? `<div class="event-meta-item">📷 تصویر ضمیمه شده</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    filterEvents(searchTerm) {
        const filtered = this.events.filter(event => {
            const term = searchTerm.toLowerCase();
            return event.title.toLowerCase().includes(term) ||
                   (event.description && event.description.toLowerCase().includes(term)) ||
                   (event.location && event.location.toLowerCase().includes(term));
        });

        const tempEvents = this.events;
        this.events = filtered;
        this.renderEvents();
        this.events = tempEvents;
    }

    sortEvents(sortType) {
        switch (sortType) {
            case 'date-desc':
                this.events.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'date-asc':
                this.events.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'title-asc':
                this.events.sort((a, b) => a.title.localeCompare(b.title, 'fa'));
                break;
            case 'title-desc':
                this.events.sort((a, b) => b.title.localeCompare(a.title, 'fa'));
                break;
        }
        this.renderEvents();
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showToast('لطفا یک فایل تصویری انتخاب کنید', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.imageData = e.target.result;
            this.displayImagePreview(this.imageData);
        };
        reader.readAsDataURL(file);
    }

    displayImagePreview(imageData) {
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = `<img src="${imageData}" alt="Preview">`;
        preview.classList.add('show');
    }

    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showToast('مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند', 'error');
            return;
        }

        this.showToast('در حال دریافت موقعیت...', 'warning');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.currentLatLng = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                this.displayCoordinates(this.currentLatLng);
                this.showToast('موقعیت با موفقیت دریافت شد', 'success');
            },
            (error) => {
                console.error('Geolocation error:', error);
                this.showToast('خطا در دریافت موقعیت', 'error');
            }
        );
    }

    displayCoordinates(coords) {
        const coordsDiv = document.getElementById('coordinates');
        coordsDiv.innerHTML = `🗺️ عرض جغرافیایی: ${coords.lat.toFixed(6)}, طول جغرافیایی: ${coords.lng.toFixed(6)}`;
        coordsDiv.classList.add('show');
    }

    showPasswordModal(action, file = null) {
        const modal = document.getElementById('passwordModal');
        modal.classList.add('show');

        this.passwordCallback = (password) => {
            if (!password) {
                this.showToast('لطفا رمز عبور را وارد کنید', 'error');
                return;
            }

            if (action === 'export') {
                this.exportEvents(password);
            } else if (action === 'import') {
                this.importEvents(file, password);
            }
        };
    }

    async exportEvents(password) {
        try {
            const data = {
                events: this.events,
                exportDate: new Date().toISOString()
            };

            const jsonString = JSON.stringify(data);
            const encrypted = this.encrypt(jsonString, password);

            const blob = new Blob([encrypted], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `event-logger-backup-${new Date().getTime()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showToast('خروجی با موفقیت ایجاد شد', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showToast('خطا در ایجاد خروجی', 'error');
        }
    }

    async importEvents(file, password) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const encrypted = e.target.result;
                const decrypted = this.decrypt(encrypted, password);
                const data = JSON.parse(decrypted);

                if (!data.events || !Array.isArray(data.events)) {
                    throw new Error('فرمت فایل نامعتبر است');
                }

                const confirmed = confirm(`آیا می‌خواهید ${data.events.length} رویداد را وارد کنید؟\n\nتوجه: این عملیات رویدادهای فعلی را جایگزین می‌کند.`);
                
                if (confirmed) {
                    await this.db.clearAllEvents();
                    
                    for (const event of data.events) {
                        delete event.id;
                        await this.db.addEvent(event);
                    }

                    await this.loadEvents();
                    this.renderEvents();
                    this.showToast('رویدادها با موفقیت وارد شدند', 'success');
                }
            } catch (error) {
                console.error('Import error:', error);
                this.showToast('خطا در وارد کردن داده‌ها. رمز عبور اشتباه است یا فایل معتبر نیست', 'error');
            }
        };
        reader.readAsText(file);
    }

    encrypt(text, password) {
        // رمزنگاری ساده با XOR و Base64
        const key = this.hashPassword(password);
        let encrypted = '';
        for (let i = 0; i < text.length; i++) {
            encrypted += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(unescape(encodeURIComponent(encrypted)));
    }

    decrypt(encryptedText, password) {
        try {
            const key = this.hashPassword(password);
            const text = decodeURIComponent(escape(atob(encryptedText)));
            let decrypted = '';
            for (let i = 0; i < text.length; i++) {
                decrypted += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return decrypted;
        } catch (error) {
            throw new Error('رمزگشایی ناموفق بود');
        }
    }

    hashPassword(password) {
        // هش ساده برای رمز عبور
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36) + password;
    }

    resetForm() {
        document.getElementById('eventForm').reset();
        document.getElementById('imagePreview').classList.remove('show');
        document.getElementById('coordinates').classList.remove('show');
        this.currentEditId = null;
        this.currentLatLng = null;
        this.imageData = null;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Intl.DateTimeFormat('fa-IR', options).format(date);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'success') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// راه‌اندازی برنامه
let app;
document.addEventListener('DOMContentLoaded', async () => {
    app = new EventLogger();
    await app.init();
});

