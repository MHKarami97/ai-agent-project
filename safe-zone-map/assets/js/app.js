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


// Safe Zone Map Application
// Offline web app for managing safe locations

class SafeZoneMap {
    constructor() {
        this.locations = [];
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.editingId = null;
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.render();
    }

    // Local Storage Management
    loadFromLocalStorage() {
        const stored = localStorage.getItem('safeZoneLocations');
        if (stored) {
            try {
                this.locations = JSON.parse(stored);
            } catch (error) {
                console.error('خطا در بارگذاری داده‌ها:', error);
                this.locations = [];
            }
        }
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('safeZoneLocations', JSON.stringify(this.locations));
        } catch (error) {
            console.error('خطا در ذخیره داده‌ها:', error);
            alert('خطا در ذخیره داده‌ها!');
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Add location button
        document.getElementById('addLocationBtn').addEventListener('click', () => {
            this.openModal();
        });

        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        // Import button
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        // Import file
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        // Modal close
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal();
        });

        // Click outside modal to close
        document.getElementById('locationModal').addEventListener('click', (e) => {
            if (e.target.id === 'locationModal') {
                this.closeModal();
            }
        });

        // Form submit
        document.getElementById('locationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveLocation();
        });

        // Filter
        document.getElementById('filterType').addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.render();
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.render();
        });
    }

    // Modal Management
    openModal(location = null) {
        const modal = document.getElementById('locationModal');
        const modalTitle = document.getElementById('modalTitle');
        
        if (location) {
            // Edit mode
            this.editingId = location.id;
            modalTitle.textContent = 'ویرایش نقطه';
            document.getElementById('locationName').value = location.name;
            document.getElementById('locationType').value = location.type;
            document.getElementById('locationLat').value = location.lat;
            document.getElementById('locationLng').value = location.lng;
            document.getElementById('locationAddress').value = location.address || '';
            document.getElementById('locationPhone').value = location.phone || '';
            document.getElementById('locationDescription').value = location.description || '';
        } else {
            // Add mode
            this.editingId = null;
            modalTitle.textContent = 'افزودن نقطه جدید';
            document.getElementById('locationForm').reset();
        }
        
        modal.classList.add('active');
    }

    closeModal() {
        const modal = document.getElementById('locationModal');
        modal.classList.remove('active');
        document.getElementById('locationForm').reset();
        this.editingId = null;
    }

    // Location Management
    saveLocation() {
        const location = {
            id: this.editingId || Date.now(),
            name: document.getElementById('locationName').value.trim(),
            type: document.getElementById('locationType').value,
            lat: parseFloat(document.getElementById('locationLat').value),
            lng: parseFloat(document.getElementById('locationLng').value),
            address: document.getElementById('locationAddress').value.trim(),
            phone: document.getElementById('locationPhone').value.trim(),
            description: document.getElementById('locationDescription').value.trim(),
            createdAt: this.editingId ? this.locations.find(l => l.id === this.editingId)?.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.editingId) {
            // Update existing
            const index = this.locations.findIndex(l => l.id === this.editingId);
            if (index !== -1) {
                this.locations[index] = location;
            }
        } else {
            // Add new
            this.locations.push(location);
        }

        this.saveToLocalStorage();
        this.closeModal();
        this.render();
    }

    deleteLocation(id) {
        if (confirm('آیا از حذف این نقطه اطمینان دارید؟')) {
            this.locations = this.locations.filter(l => l.id !== id);
            this.saveToLocalStorage();
            this.render();
        }
    }

    // Data Export/Import
    exportData() {
        if (this.locations.length === 0) {
            alert('هیچ داده‌ای برای خروجی وجود ندارد!');
            return;
        }

        const dataStr = JSON.stringify(this.locations, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `safe-zone-map-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (!Array.isArray(importedData)) {
                    throw new Error('فرمت فایل نامعتبر است');
                }

                // Validate data structure
                const isValid = importedData.every(location => 
                    location.name && location.type && 
                    typeof location.lat === 'number' && 
                    typeof location.lng === 'number'
                );

                if (!isValid) {
                    throw new Error('ساختار داده‌ها نامعتبر است');
                }

                // Merge or replace
                if (confirm(`${importedData.length} مورد پیدا شد. آیا می‌خواهید داده‌های فعلی را جایگزین کنید؟\n(انصراف = افزودن به داده‌های موجود)`)) {
                    this.locations = importedData;
                } else {
                    // Merge with existing, update IDs to avoid conflicts
                    importedData.forEach(loc => {
                        loc.id = Date.now() + Math.random();
                        this.locations.push(loc);
                    });
                }

                this.saveToLocalStorage();
                this.render();
                alert('داده‌ها با موفقیت وارد شدند!');
            } catch (error) {
                console.error('خطا در ورود داده‌ها:', error);
                alert('خطا در ورود داده‌ها: ' + error.message);
            }
        };

        reader.readAsText(file);
        // Reset file input
        document.getElementById('importFile').value = '';
    }

    // Filtering and Search
    getFilteredLocations() {
        let filtered = this.locations;

        // Apply type filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(l => l.type === this.currentFilter);
        }

        // Apply search
        if (this.searchTerm) {
            filtered = filtered.filter(l => 
                l.name.toLowerCase().includes(this.searchTerm) ||
                (l.description && l.description.toLowerCase().includes(this.searchTerm)) ||
                (l.address && l.address.toLowerCase().includes(this.searchTerm))
            );
        }

        return filtered;
    }

    // Rendering
    render() {
        this.renderStats();
        this.renderLocations();
    }

    renderStats() {
        const hospitalCount = this.locations.filter(l => l.type === 'hospital').length;
        const pharmacyCount = this.locations.filter(l => l.type === 'pharmacy').length;
        const shelterCount = this.locations.filter(l => l.type === 'shelter').length;
        const emergencyCount = this.locations.filter(l => l.type === 'emergency').length;
        const fireStationCount = this.locations.filter(l => l.type === 'fire-station').length;
        const policeCount = this.locations.filter(l => l.type === 'police').length;
        const storeCount = this.locations.filter(l => l.type === 'store').length;
        const gasStationCount = this.locations.filter(l => l.type === 'gas-station').length;
        const bankCount = this.locations.filter(l => l.type === 'bank').length;
        const bakeryCount = this.locations.filter(l => l.type === 'bakery').length;

        document.getElementById('hospitalCount').textContent = hospitalCount;
        document.getElementById('pharmacyCount').textContent = pharmacyCount;
        document.getElementById('shelterCount').textContent = shelterCount;
        document.getElementById('emergencyCount').textContent = emergencyCount;
        document.getElementById('fireStationCount').textContent = fireStationCount;
        document.getElementById('policeCount').textContent = policeCount;
        document.getElementById('storeCount').textContent = storeCount;
        document.getElementById('gasStationCount').textContent = gasStationCount;
        document.getElementById('bankCount').textContent = bankCount;
        document.getElementById('bakeryCount').textContent = bakeryCount;
    }

    renderLocations() {
        const locationsList = document.getElementById('locationsList');
        const filtered = this.getFilteredLocations();

        if (filtered.length === 0) {
            locationsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📍</div>
                    <p>${this.searchTerm || this.currentFilter !== 'all' ? 'نتیجه‌ای یافت نشد' : 'هنوز نقطه‌ای اضافه نشده است'}</p>
                    <p class="empty-hint">${this.searchTerm || this.currentFilter !== 'all' ? 'لطفاً فیلتر یا جستجو را تغییر دهید' : 'برای شروع، روی دکمه "افزودن نقطه جدید" کلیک کنید'}</p>
                </div>
            `;
            return;
        }

        locationsList.innerHTML = filtered.map(location => this.createLocationCard(location)).join('');

        // Attach event listeners to cards
        filtered.forEach(location => {
            document.getElementById(`edit-${location.id}`).addEventListener('click', () => {
                this.openModal(location);
            });
            document.getElementById(`delete-${location.id}`).addEventListener('click', () => {
                this.deleteLocation(location.id);
            });
        });
    }

    createLocationCard(location) {
        const typeEmoji = {
            'hospital': '🏥',
            'pharmacy': '💊',
            'shelter': '🏠',
            'emergency': '🚑',
            'fire-station': '🚒',
            'police': '👮',
            'store': '🏪',
            'gas-station': '⛽',
            'bank': '🏦',
            'bakery': '🍞'
        };

        const typeName = {
            'hospital': 'بیمارستان',
            'pharmacy': 'داروخانه',
            'shelter': 'پناهگاه',
            'emergency': 'اورژانس',
            'fire-station': 'آتش‌نشانی',
            'police': 'پلیس',
            'store': 'فروشگاه',
            'gas-station': 'پمپ بنزین',
            'bank': 'بانک',
            'bakery': 'نانوایی'
        };

        return `
            <div class="location-card ${location.type}">
                <div class="location-header">
                    <div class="location-title">
                        <span class="location-icon">${typeEmoji[location.type]}</span>
                        <div>
                            <div class="location-name">${this.escapeHtml(location.name)}</div>
                            <div style="color: #718096; font-size: 0.9rem; margin-top: 4px;">${typeName[location.type]}</div>
                        </div>
                    </div>
                    <div class="location-actions">
                        <button id="edit-${location.id}" class="btn btn-edit">
                            <span class="icon">✏️</span>
                            ویرایش
                        </button>
                        <button id="delete-${location.id}" class="btn btn-danger">
                            <span class="icon">🗑️</span>
                            حذف
                        </button>
                    </div>
                </div>
                
                <div class="location-info">
                    ${location.address ? `
                        <div class="info-row">
                            <span class="info-label">📍 آدرس:</span>
                            <span class="info-value">${this.escapeHtml(location.address)}</span>
                        </div>
                    ` : ''}
                    
                    ${location.phone ? `
                        <div class="info-row">
                            <span class="info-label">📞 تلفن:</span>
                            <span class="info-value">${this.escapeHtml(location.phone)}</span>
                        </div>
                    ` : ''}
                    
                    <div class="info-row">
                        <span class="info-label">🌍 مختصات:</span>
                        <span class="info-value">
                            <div class="coordinates">
                                Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}
                            </div>
                        </span>
                    </div>
                    
                    ${location.description ? `
                        <div class="info-row">
                            <span class="info-label">📝 توضیحات:</span>
                            <span class="info-value">${this.escapeHtml(location.description)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Utility
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SafeZoneMap();
});

