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


// کلاس مدیریت محاسبات بقا
class SurvivalCalculator {
    constructor() {
        this.calculations = this.loadFromStorage();
        this.renderHistory();
    }

    // محاسبه منابع مورد نیاز
    calculate(people, days, waterPerDay, foodPerDay, medicinePerDay) {
        return {
            water: (people * days * waterPerDay).toFixed(2),
            food: (people * days * foodPerDay).toFixed(2),
            medicine: (people * days * medicinePerDay).toFixed(2),
            people: people,
            days: days,
            waterPerDay: waterPerDay,
            foodPerDay: foodPerDay,
            medicinePerDay: medicinePerDay
        };
    }

    // ذخیره محاسبه
    saveCalculation(name, data) {
        const calculation = {
            id: Date.now(),
            name: name || 'محاسبه بدون نام',
            date: new Date().toLocaleDateString('fa-IR'),
            time: new Date().toLocaleTimeString('fa-IR'),
            ...data
        };

        this.calculations.unshift(calculation);
        this.saveToStorage();
        this.renderHistory();
        this.showNotification('✅ محاسبه با موفقیت ذخیره شد', 'success');
    }

    // حذف یک محاسبه
    deleteCalculation(id) {
        this.calculations = this.calculations.filter(calc => calc.id !== id);
        this.saveToStorage();
        this.renderHistory();
        this.showNotification('🗑️ محاسبه حذف شد', 'info');
    }

    // پاک کردن تمام تاریخچه
    clearAll() {
        if (this.calculations.length === 0) {
            this.showNotification('⚠️ تاریخچه خالی است', 'warning');
            return;
        }

        if (confirm('آیا مطمئن هستید که می‌خواهید تمام تاریخچه را پاک کنید؟')) {
            this.calculations = [];
            this.saveToStorage();
            this.renderHistory();
            this.showNotification('🗑️ تمام تاریخچه پاک شد', 'info');
        }
    }

    // ذخیره در localStorage
    saveToStorage() {
        localStorage.setItem('survivalCalculations', JSON.stringify(this.calculations));
    }

    // بارگذاری از localStorage
    loadFromStorage() {
        const data = localStorage.getItem('survivalCalculations');
        return data ? JSON.parse(data) : [];
    }

    // نمایش تاریخچه
    renderHistory() {
        const historyList = document.getElementById('historyList');
        
        if (this.calculations.length === 0) {
            historyList.innerHTML = '<div class="empty-history">📭 هنوز محاسبه‌ای ذخیره نشده است</div>';
            return;
        }

        historyList.innerHTML = this.calculations.map(calc => `
            <div class="history-item">
                <div class="history-item-header">
                    <div>
                        <div class="history-item-name">📌 ${calc.name}</div>
                        <div class="history-item-date">🕐 ${calc.date} - ${calc.time}</div>
                    </div>
                    <button class="btn-delete" onclick="calculator.deleteCalculation(${calc.id})">حذف</button>
                </div>
                <div class="history-item-info">
                    <div class="history-info-item">👥 ${calc.people} نفر</div>
                    <div class="history-info-item">📅 ${calc.days} روز</div>
                </div>
                <div class="history-item-results">
                    <div class="history-result water">
                        💧 ${calc.water} لیتر آب
                    </div>
                    <div class="history-result food">
                        🍞 ${calc.food} کیلوگرم غذا
                    </div>
                    <div class="history-result medicine">
                        💊 ${calc.medicine} واحد دارو
                    </div>
                </div>
            </div>
        `).join('');
    }

    // نمایش نوتیفیکیشن
    showNotification(message, type) {
        // حذف نوتیفیکیشن قبلی اگر وجود دارد
        const existingNotif = document.querySelector('.notification');
        if (existingNotif) {
            existingNotif.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
            font-weight: bold;
            ${type === 'success' ? 'border-right: 5px solid #27ae60;' : ''}
            ${type === 'warning' ? 'border-right: 5px solid #f39c12;' : ''}
            ${type === 'info' ? 'border-right: 5px solid #3498db;' : ''}
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// انیمیشن برای نوتیفیکیشن
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ایجاد نمونه از کلاس
const calculator = new SurvivalCalculator();

// تابع محاسبه
function calculate() {
    const people = parseFloat(document.getElementById('people').value);
    const days = parseFloat(document.getElementById('days').value);
    const waterPerDay = parseFloat(document.getElementById('waterPerDay').value);
    const foodPerDay = parseFloat(document.getElementById('foodPerDay').value);
    const medicinePerDay = parseFloat(document.getElementById('medicinePerDay').value);

    // اعتبارسنجی ورودی‌ها
    if (!people || people < 1) {
        calculator.showNotification('⚠️ لطفاً تعداد افراد را به درستی وارد کنید', 'warning');
        return;
    }

    if (!days || days < 1) {
        calculator.showNotification('⚠️ لطفاً مدت زمان را به درستی وارد کنید', 'warning');
        return;
    }

    if (waterPerDay < 0 || foodPerDay < 0 || medicinePerDay < 0) {
        calculator.showNotification('⚠️ مقادیر نمی‌توانند منفی باشند', 'warning');
        return;
    }

    // محاسبه نتایج
    const results = calculator.calculate(people, days, waterPerDay, foodPerDay, medicinePerDay);

    // نمایش نتایج
    document.getElementById('waterResult').textContent = results.water;
    document.getElementById('foodResult').textContent = results.food;
    document.getElementById('medicineResult').textContent = results.medicine;

    // نمایش بخش نتایج
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.style.display = 'block';
    
    // اسکرول به نتایج
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // ذخیره نتایج موقت برای استفاده در ذخیره
    window.lastCalculation = results;

    calculator.showNotification('✨ محاسبات با موفقیت انجام شد', 'success');
}

// تابع ذخیره محاسبه
function saveCalculation() {
    if (!window.lastCalculation) {
        calculator.showNotification('⚠️ ابتدا محاسبه را انجام دهید', 'warning');
        return;
    }

    const name = document.getElementById('calculationName').value.trim();
    
    calculator.saveCalculation(name, window.lastCalculation);
    
    // پاک کردن فیلد نام
    document.getElementById('calculationName').value = '';
}

// تابع پاک کردن تاریخچه
function clearHistory() {
    calculator.clearAll();
}

// رویداد فشردن Enter برای محاسبه
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                if (input.id === 'calculationName') {
                    saveCalculation();
                } else {
                    calculate();
                }
            }
        });
    });
});

// نمایش اطلاعات اولیه
console.log('🎯 محاسبه‌گر بقا آماده است');
console.log('📊 تعداد محاسبات ذخیره شده:', calculator.calculations.length);

