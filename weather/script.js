// API Key - برای استفاده باید از OpenWeatherMap یک API Key دریافت کنید
// رایگان است و می‌توانید از https://openweathermap.org/api دریافت کنید
const API_KEY = 'YOUR_API_KEY_HERE';
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

