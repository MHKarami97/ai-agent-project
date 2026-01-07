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


// API Key - برای استفاده باید از OpenWeatherMap یک API Key دریافت کنید
// رایگان است و می‌توانید از https://openweathermap.org/api دریافت کنید
const API_KEY = '9a5302ccaa7cbe3d34c8bf2a5b3ba9d7';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// عناصر DOM
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherInfo = document.getElementById('weatherInfo');
const errorMessage = document.getElementById('errorMessage');

const temperature = document.getElementById('temperature');
const cityName = document.getElementById('cityName');
const description = document.getElementById('description');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const weatherIcon = document.getElementById('weatherIcon');

// تابع دریافت اطلاعات آب و هوا
async function getWeather(city) {
    try {
        // پنهان کردن پیام خطا
        errorMessage.style.display = 'none';
        
        // نمایش حالت بارگذاری
        weatherInfo.classList.add('loading');
        
        // درخواست به API
        const response = await fetch(
            `${API_URL}?q=${city}&appid=${API_KEY}&units=metric&lang=fa`
        );
        
        if (!response.ok) {
            throw new Error('شهر یافت نشد');
        }
        
        const data = await response.json();
        
        // نمایش اطلاعات
        displayWeather(data);
        
        // حذف حالت بارگذاری
        weatherInfo.classList.remove('loading');
        
    } catch (error) {
        console.error('خطا:', error);
        showError('خطا در دریافت اطلاعات. لطفاً نام شهر را بررسی کنید.');
        weatherInfo.classList.remove('loading');
    }
}

// تابع نمایش اطلاعات آب و هوا
function displayWeather(data) {
    temperature.textContent = `${Math.round(data.main.temp)}°C`;
    cityName.textContent = data.name;
    description.textContent = data.weather[0].description;
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    
    // آیکون آب و هوا
    const iconCode = data.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherIcon.alt = data.weather[0].description;
}

// تابع نمایش خطا
function showError(message) {
    errorMessage.style.display = 'block';
    errorMessage.querySelector('p').textContent = message;
}

// رویداد کلیک دکمه جستجو
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeather(city);
    } else {
        showError('لطفاً نام شهر را وارد کنید.');
    }
});

// رویداد Enter در input
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

// بارگذاری آب و هوای شهر پیش‌فرض (تهران) در صورت وجود API Key
if (API_KEY !== 'YOUR_API_KEY_HERE') {
    getWeather('Tehran');
} else {
    // نمایش پیام راهنما
    showError('لطفاً API Key خود را از OpenWeatherMap دریافت کرده و در فایل script.js قرار دهید.');
}

