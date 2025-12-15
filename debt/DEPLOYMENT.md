# راهنمای استقرار در GitHub Pages

این فایل راهنمای گام به گام برای استقرار برنامه محاسبه‌گر وام در GitHub Pages است.

## روش 1: استقرار مستقیم (ساده‌ترین روش)

### مرحله 1: ایجاد مخزن GitHub

1. به [GitHub.com](https://github.com) بروید و وارد حساب خود شوید
2. روی دکمه "+" در بالای صفحه کلیک کنید و "New repository" را انتخاب کنید
3. نام مخزن را وارد کنید (مثلاً: `loan-calculator`)
4. مخزن را Public قرار دهید
5. روی "Create repository" کلیک کنید

### مرحله 2: آپلود فایل‌ها

**روش A: از طریق رابط وب GitHub**
1. در صفحه مخزن جدید، روی "uploading an existing file" کلیک کنید
2. تمام فایل‌های پروژه را بکشید و در صفحه رها کنید:
   - index.html
   - style.css
   - script.js
   - README.md
3. پیام commit بنویسید (مثلاً: "Initial commit")
4. روی "Commit changes" کلیک کنید

**روش B: از طریق خط فرمان Git**
```bash
# در پوشه پروژه، Git را مقداردهی اولیه کنید
git init

# فایل‌ها را اضافه کنید
git add .

# Commit کنید
git commit -m "Initial commit: Iranian loan calculator"

# مخزن remote را اضافه کنید (URL را با آدرس مخزن خود جایگزین کنید)
git remote add origin https://github.com/your-username/loan-calculator.git

# Branch را به main تغییر دهید
git branch -M main

# Push کنید
git push -u origin main
```

### مرحله 3: فعال‌سازی GitHub Pages

1. در صفحه مخزن، به تب "Settings" بروید
2. در منوی سمت راست، روی "Pages" کلیک کنید
3. در بخش "Source":
   - Branch: `main` را انتخاب کنید
   - Folder: `/ (root)` را انتخاب کنید
4. روی "Save" کلیک کنید
5. بعد از چند لحظه، لینک سایت شما نمایش داده می‌شود:
   ```
   https://your-username.github.io/loan-calculator/
   ```

### مرحله 4: تست

1. لینک را در مرورگر باز کنید
2. مطمئن شوید که همه چیز به درستی کار می‌کند
3. فونت فارسی، RTL، و محاسبات را تست کنید

## روش 2: استقرار با دامنه سفارشی

اگر می‌خواهید از دامنه خودتان استفاده کنید:

### مرحله 1: فایل CNAME ایجاد کنید

یک فایل به نام `CNAME` (بدون پسوند) در ریشه پروژه بسازید:
```
your-domain.com
```

### مرحله 2: تنظیمات DNS

در پنل مدیریت دامنه خود، رکوردهای زیر را اضافه کنید:

**برای apex domain (example.com):**
```
Type: A
Name: @
Value: 185.199.108.153
Value: 185.199.109.153
Value: 185.199.110.153
Value: 185.199.111.153
```

**برای subdomain (www.example.com):**
```
Type: CNAME
Name: www
Value: your-username.github.io
```

### مرحله 3: تنظیم در GitHub

1. در تنظیمات GitHub Pages
2. در بخش "Custom domain" دامنه خود را وارد کنید
3. "Enforce HTTPS" را فعال کنید

## روش 3: به‌روزرسانی پروژه

برای به‌روزرسانی پروژه بعد از تغییرات:

```bash
# تغییرات را اضافه کنید
git add .

# Commit کنید
git commit -m "توضیحات تغییرات"

# Push کنید
git push origin main
```

GitHub Pages به صورت خودکار سایت را به‌روزرسانی می‌کند (معمولاً 1-2 دقیقه طول می‌کشد).

## بهینه‌سازی برای GitHub Pages

### 1. فعال‌سازی HTTPS
- در تنظیمات Pages، "Enforce HTTPS" را فعال کنید
- این کار امنیت سایت را بالا می‌برد

### 2. اضافه کردن favicon
یک فایل `favicon.ico` در ریشه پروژه قرار دهید

### 3. اضافه کردن meta tags برای SEO
در `index.html`:
```html
<meta name="description" content="محاسبه‌گر واقعی سود وام بانکی ایران">
<meta name="keywords" content="وام، بانک، محاسبه وام، سود وام، ایران">
<meta property="og:title" content="محاسبه‌گر واقعی سود وام">
<meta property="og:description" content="محاسبه دقیق هزینه واقعی وام‌های بانکی">
```

### 4. اضافه کردن Google Analytics (اختیاری)
برای ردیابی بازدیدکنندگان

## عیب‌یابی

### مشکل 1: صفحه 404
- مطمئن شوید که فایل `index.html` در ریشه پروژه است
- مطمئن شوید که Branch و Folder درست انتخاب شده‌اند

### مشکل 2: فونت‌ها نمایش داده نمی‌شوند
- فونت از CDN لود می‌شود، اتصال اینترنت را چک کنید
- در Console مرورگر خطاها را بررسی کنید

### مشکل 3: تغییرات نمایش داده نمی‌شوند
- Cache مرورگر را پاک کنید (Ctrl+Shift+R)
- 1-2 دقیقه صبر کنید تا GitHub Pages به‌روز شود
- مطمئن شوید که تغییرات push شده‌اند

### مشکل 4: IndexedDB کار نمی‌کند
- مطمئن شوید که از HTTPS استفاده می‌کنید
- تنظیمات مرورگر را چک کنید (باید ذخیره‌سازی محلی فعال باشد)

## بهترین شیوه‌ها

### 1. Semantic Versioning
تگ‌های نسخه برای رهاسازی‌ها استفاده کنید:
```bash
git tag -a v1.0.0 -m "نسخه اول"
git push origin v1.0.0
```

### 2. Branch Strategy
- `main`: برای کد تولید
- `develop`: برای توسعه
- `feature/*`: برای ویژگی‌های جدید

### 3. Commit Messages
پیام‌های واضح و توضیحی بنویسید:
```
feat: اضافه کردن محاسبه تورم
fix: رفع مشکل محاسبه سود متناقص
docs: به‌روزرسانی README
style: بهبود رنگ‌بندی
```

### 4. Testing قبل از Deploy
قبل از push، حتماً تست کنید:
- محاسبات را با مقادیر مختلف تست کنید
- روی مرورگرهای مختلف تست کنید
- روی موبایل تست کنید

## منابع مفید

- [مستندات GitHub Pages](https://docs.github.com/en/pages)
- [راهنمای Git به فارسی](https://git-scm.com/book/fa/v2)
- [راهنمای Markdown](https://www.markdownguide.org/)

## پشتیبانی

اگر مشکلی داشتید:
1. Issues در GitHub را چک کنید
2. یک Issue جدید باز کنید
3. جامعه GitHub همیشه کمک می‌کند!

---

**موفق باشید! 🚀**

