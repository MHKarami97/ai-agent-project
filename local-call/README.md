# چت تصویری و صوتی محلی امن | Secure Local Video & Audio Chat

یک برنامه وب برای چت تصویری، صوتی و متنی در شبکه محلی بدون نیاز به سرور | A web application for video, audio, and text chat over local network without server requirement.

## 🌟 ویژگی‌ها | Features

### فارسی
- 🎥 **تماس تصویری و صوتی**: ارتباط تصویری و صوتی با کیفیت بالا
- 💬 **چت متنی**: ارسال و دریافت پیام‌های متنی همزمان با تماس
- 🌐 **دو زبانه**: پشتیبانی کامل از فارسی و انگلیسی
- 🌓 **حالت تاریک/روشن**: تم قابل تنظیم برای راحتی بیشتر
- 🔒 **کاملاً امن**: بدون سرور میانی، ارتباط مستقیم peer-to-peer
- 💾 **ذخیره‌سازی تنظیمات**: ذخیره زبان و تم در مرورگر
- 📱 **ریسپانسیو**: سازگار با موبایل، تبلت و دسکتاپ
- 🎛️ **کنترل رسانه**: قطع و وصل دوربین و میکروفون
- 🔑 **بدون ثبت نام**: فقط با اشتراک‌گذاری شناسه اتصال برقرار کنید

### English
- 🎥 **Video & Audio Call**: High-quality video and audio communication
- 💬 **Text Chat**: Send and receive text messages during calls
- 🌐 **Bilingual**: Full support for Persian and English
- 🌓 **Dark/Light Mode**: Customizable theme for better comfort
- 🔒 **Fully Secure**: No intermediary server, direct peer-to-peer connection
- 💾 **Settings Storage**: Language and theme saved in browser
- 📱 **Responsive**: Compatible with mobile, tablet, and desktop
- 🎛️ **Media Control**: Toggle camera and microphone on/off
- 🔑 **No Registration**: Just share your ID to connect

## 🚀 نحوه استفاده | How to Use

### فارسی

#### راه‌اندازی
1. فایل `index.html` را در مرورگر باز کنید
2. به دوربین و میکروفون دسترسی بدهید (در صورت درخواست)
3. شناسه منحصر به فرد شما نمایش داده می‌شود

#### اتصال
1. شناسه خود را برای طرف مقابل ارسال کنید (با کلیک روی دکمه "کپی")
2. شناسه طرف مقابل را دریافت کنید
3. شناسه را در قسمت "شناسه طرف مقابل" وارد کنید
4. روی دکمه "اتصال" کلیک کنید

#### امکانات
- **قطع/وصل دوربین**: آیکون دوربین در بالای صفحه
- **قطع/وصل میکروفون**: آیکون میکروفون در بالای صفحه
- **چت متنی**: پیام خود را در کادر پایین تایپ کرده و ارسال کنید
- **تغییر زبان**: آیکون کره زمین در هدر
- **تغییر تم**: آیکون خورشید/ماه در هدر

### English

#### Setup
1. Open `index.html` in your browser
2. Allow camera and microphone access (if requested)
3. Your unique ID will be displayed

#### Connect
1. Send your ID to the other person (click "Copy" button)
2. Receive the other person's ID
3. Enter the ID in "Remote Peer ID" field
4. Click "Connect" button

#### Features
- **Toggle Camera**: Camera icon at the top
- **Toggle Microphone**: Microphone icon at the top
- **Text Chat**: Type your message in the box below and send
- **Change Language**: Globe icon in header
- **Change Theme**: Sun/Moon icon in header

## 🛠️ فناوری‌های استفاده شده | Technologies Used

- **HTML5**: ساختار صفحه | Page structure
- **CSS3**: طراحی و استایل | Design and styling
- **JavaScript (ES6+)**: منطق برنامه | Application logic
- **PeerJS**: ارتباط peer-to-peer | Peer-to-peer communication
- **WebRTC**: تماس تصویری و صوتی | Video and audio calls
- **LocalStorage API**: ذخیره تنظیمات | Settings storage
- **MediaDevices API**: دسترسی به دوربین و میکروفون | Camera and microphone access

## 📋 پیش‌نیازها | Requirements

- مرورگر مدرن با پشتیبانی از WebRTC (Chrome, Firefox, Edge, Safari)
- دسترسی به دوربین و میکروفون
- اتصال اینترنت (فقط برای اتصال اولیه به سرور signaling)
- هر دو طرف باید در شبکه قابل دسترسی باشند

## 🔒 امنیت | Security

- **ارتباط مستقیم**: داده‌ها مستقیماً بین دو طرف منتقل می‌شود
- **بدون سرور میانی**: هیچ سروری داده‌های شما را ذخیره نمی‌کند
- **رمزنگاری**: WebRTC به صورت پیش‌فرض از رمزنگاری استفاده می‌کند
- **محلی**: تمام تنظیمات در مرورگر شما ذخیره می‌شود

## 🌐 سازگاری مرورگر | Browser Compatibility

| مرورگر | نسخه حداقل | پشتیبانی |
|--------|-----------|----------|
| Chrome | 74+ | ✅ کامل |
| Firefox | 66+ | ✅ کامل |
| Safari | 12.1+ | ✅ کامل |
| Edge | 79+ | ✅ کامل |
| Opera | 62+ | ✅ کامل |

## 📁 ساختار پروژه | Project Structure

```
local-call/
├── index.html              # صفحه اصلی | Main page
├── assets/
│   ├── style.css          # استایل‌ها | Styles
│   ├── app.js             # منطق اصلی | Main logic
│   └── translations.js    # ترجمه‌ها | Translations
└── README.md              # مستندات | Documentation
```

## 🎨 سفارشی‌سازی | Customization

### تغییر رنگ‌ها | Changing Colors
رنگ‌های اصلی در فایل `assets/style.css` در قسمت `:root` تعریف شده‌اند:

```css
:root {
    --primary-color: #2563eb;
    --danger-color: #dc2626;
    --success-color: #16a34a;
    /* ... */
}
```

### اضافه کردن زبان جدید | Adding New Language
زبان‌های جدید را می‌توانید در `assets/translations.js` اضافه کنید:

```javascript
const translations = {
    fa: { /* ... */ },
    en: { /* ... */ },
    newLang: {
        app_title: "Translation",
        // ...
    }
};
```

## 🔧 عیب‌یابی | Troubleshooting

### مشکلات رایج | Common Issues

#### اتصال برقرار نمی‌شود
- مطمئن شوید هر دو طرف به اینترنت متصل هستند
- فایروال یا VPN ممکن است مانع ارتباط شود
- شناسه طرف مقابل را دوباره بررسی کنید

#### دوربین یا میکروفون کار نمی‌کند
- دسترسی به دوربین/میکروفون را در تنظیمات مرورگر بررسی کنید
- مطمئن شوید دستگاه دیگری از دوربین استفاده نمی‌کند
- مرورگر را ببندید و دوباره باز کنید

#### کیفیت تصویر ضعیف است
- سرعت اینترنت خود را بررسی کنید
- تعداد برنامه‌های باز را کاهش دهید
- مرورگر دیگری امتحان کنید

## 📝 یادداشت‌ها | Notes

- برای استفاده در شبکه محلی، هیچ اتصال اینترنتی پس از برقراری اتصال اولیه نیاز نیست
- فونت Vazirmatn باید به صورت جداگانه اضافه شود
- favicon.ico باید در ریشه پروژه قرار گیرد

## 📄 مجوز | License

این پروژه آزاد و رایگان است و می‌توانید آن را به هر شکلی استفاده، تغییر و توزیع کنید.

This project is free and open for any use, modification, and distribution.

## 👨‍💻 توسعه‌دهنده | Developer

ساخته شده با ❤️ برای ارتباطات امن و خصوصی

Made with ❤️ for secure and private communications

---

**نکته مهم**: این برنامه از PeerJS استفاده می‌کند که برای signaling اولیه به سرور عمومی PeerJS متصل می‌شود. پس از برقراری اتصال، تمام داده‌ها مستقیماً بین دو طرف منتقل می‌شود.

**Important Note**: This application uses PeerJS which connects to the public PeerJS server for initial signaling. After connection is established, all data is transferred directly between peers.

