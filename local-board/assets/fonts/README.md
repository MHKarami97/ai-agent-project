# نصب فونت Vazirmatn

## دانلود فونت

فایل‌های فونت Vazirmatn را از یکی از منابع زیر دانلود کنید:

1. **GitHub رسمی**: https://github.com/rastikerdar/vazirmatn/releases/latest
2. **وب‌سایت فونت‌ها**: از بخش Webfont فایل‌های woff و woff2 را دانلود کنید

## فایل‌های مورد نیاز

شما به فایل‌های زیر نیاز دارید:

- `Vazirmatn-Regular.woff2`
- `Vazirmatn-Regular.woff`
- `Vazirmatn-Medium.woff2`
- `Vazirmatn-Medium.woff`
- `Vazirmatn-Bold.woff2`
- `Vazirmatn-Bold.woff`

## نصب

تمام فایل‌های فونت را در پوشه زیر کپی کنید:

```
local-board/assets/fonts/
```

ساختار نهایی باید به این صورت باشد:

```
local-board/
└── assets/
    └── fonts/
        ├── Vazirmatn-Regular.woff2
        ├── Vazirmatn-Regular.woff
        ├── Vazirmatn-Medium.woff2
        ├── Vazirmatn-Medium.woff
        ├── Vazirmatn-Bold.woff2
        └── Vazirmatn-Bold.woff
```

## بعد از نصب

بعد از قرار دادن فایل‌های فونت، فایل `index.html` را در مرورگر باز کنید. فونت‌های فارسی باید به درستی نمایش داده شوند.

## توجه

اگر فونت‌ها نمایش داده نشدند:

1. کش مرورگر را پاک کنید (Ctrl+Shift+Delete)
2. صفحه را Refresh کنید (Ctrl+F5 یا F5)
3. مسیر فایل‌های فونت را در `assets/css/style.css` بررسی کنید

