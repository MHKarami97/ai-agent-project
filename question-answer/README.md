# سیستم سوال و جواب داخلی شرکت

یک سیستم Q&A ساده و سبک برای استفاده داخلی شرکت، شبیه StackOverflow اما بدون نیاز به بک‌اند.

## ویژگی‌ها

- ✅ احراز هویت ساده (بدون پسورد برای MVP)
- ✅ مدیریت سوال‌ها با تگ، دپارتمان و سطح اهمیت
- ✅ سیستم پاسخ‌دهی و رای‌دهی
- ✅ پذیرش پاسخ (Accept Answer)
- ✅ ذخیره‌سازی محلی با IndexedDB
- ✅ Export/Import داده‌ها به صورت JSON
- ✅ رابط کاربری Responsive و قابل دسترس
- ✅ پشتیبانی از Dark/Light Mode (آماده برای پیاده‌سازی)

## تکنولوژی‌ها

- **HTML5** - ساختار صفحه
- **CSS3** - استایل‌دهی با CSS Variables برای Theme Support
- **Vanilla JavaScript (ES6+)** - منطق برنامه با ES Modules
- **IndexedDB** - ذخیره‌سازی داده‌ها در مرورگر

## ساختار پروژه

```
question-answer/
├── index.html              # صفحه اصلی
├── assets/
│   └── styles.css          # استایل‌های اصلی
├── src/
│   ├── main.js             # نقطه ورود برنامه
│   ├── core/               # لایه Core
│   │   ├── router.js        # Router ساده (hash-based)
│   │   ├── eventBus.js     # Event Bus برای ارتباط بین کامپوننت‌ها
│   │   ├── dom.js          # Utilities برای کار با DOM
│   │   ├── validation.js   # اعتبارسنجی داده‌ها
│   │   ├── error.js        # مدیریت خطا (AppError, Result)
│   │   ├── logger.js       # Logger برای توسعه
│   │   └── toast.js        # نمایش اعلان‌ها
│   ├── data/               # لایه Data
│   │   ├── indexeddb.js    # کلاینت IndexedDB
│   │   ├── exportImport.js # سرویس Export/Import
│   │   └── repositories/   # Repository Pattern
│   │       ├── userRepository.js
│   │       ├── questionRepository.js
│   │       ├── answerRepository.js
│   │       └── voteRepository.js
│   ├── domain/             # لایه Domain
│   │   ├── models/         # مدل‌های دامنه
│   │   │   ├── user.js
│   │   │   ├── question.js
│   │   │   ├── answer.js
│   │   │   └── vote.js
│   │   └── services/       # سرویس‌های کسب‌وکار
│   │       ├── userService.js
│   │       ├── questionService.js
│   │       └── answerService.js
│   ├── ui/                  # لایه UI
│   │   ├── components/      # کامپوننت‌های قابل استفاده مجدد
│   │   │   ├── questionCard.js
│   │   │   └── voteButtons.js
│   │   └── views/           # View های صفحه
│   │       ├── loginView.js
│   │       ├── questionsListView.js
│   │       ├── questionDetailView.js
│   │       ├── newQuestionView.js
│   │       └── adminView.js
│   └── seed/                # داده‌های اولیه
│       ├── seedData.js
│       └── seed.js
└── README.md
```

## نحوه اجرا

### روش 1: باز کردن مستقیم فایل

1. فایل `index.html` را در مرورگر باز کنید
2. توجه: برخی مرورگرها به دلیل CORS ممکن است اجازه اجرای ES Modules را ندهند

### روش 2: استفاده از Static Server (توصیه می‌شود)

#### با Python:
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### با Node.js (http-server):
```bash
npx http-server -p 8000
```

#### با PHP:
```bash
php -S localhost:8000
```

سپس در مرورگر به آدرس `http://localhost:8000` بروید.

## کاربران پیش‌فرض (Seed Data)

سیستم با کاربران زیر به صورت خودکار seed می‌شود:

| نام کاربری | نام نمایشی | نقش | دپارتمان |
|-----------|-----------|-----|----------|
| admin | مدیر سیستم | Admin | IT |
| moderator | ناظر | Moderator | IT |
| employee1 | کارمند 1 | Employee | Sales |
| employee2 | کارمند 2 | Employee | Marketing |

**نکته:** برای ورود، از نام کاربری استفاده کنید (بدون پسورد).

## معماری سیستم

### لایه‌بندی (Layered Architecture)

```
┌─────────────────────────────────────┐
│         UI Layer (Views)            │
│  - Login, Questions, Admin Views   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Domain Layer (Services)        │
│  - UserService, QuestionService    │
│  - Business Logic & Validation     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Data Layer (Repositories)      │
│  - UserRepo, QuestionRepo, etc.    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      IndexedDB (Storage)           │
│  - users, questions, answers, votes │
└─────────────────────────────────────┘
```

### الگوهای طراحی استفاده شده

1. **Repository Pattern**: جداسازی منطق دسترسی به داده
2. **Service Layer**: منطق کسب‌وکار در سرویس‌ها
3. **Event Bus**: ارتباط غیرمستقیم بین کامپوننت‌ها
4. **Result Pattern**: مدیریت خطا و نتیجه عملیات
5. **Component Pattern**: کامپوننت‌های قابل استفاده مجدد

## محدودیت‌ها و فرض‌ها

### محدودیت‌های MVP

1. **چندکاربره واقعی**: 
   - داده‌ها فقط در مرورگر کاربر ذخیره می‌شوند
   - برای انتقال داده بین سیستم‌ها از Export/Import استفاده کنید
   - هر کاربر فقط داده‌های خودش را می‌بیند (در مرورگر خودش)

2. **احراز هویت**: 
   - بدون پسورد (فقط نام کاربری)
   - مناسب برای محیط داخلی و قابل اعتماد

3. **ذخیره‌سازی**: 
   - فقط IndexedDB (محلی)
   - با پاک کردن داده‌های مرورگر، داده‌ها از بین می‌روند

### راه‌حل‌های پیشنهادی برای Production

- استفاده از بک‌اند (REST API) برای ذخیره‌سازی مرکزی
- احراز هویت واقعی (JWT, OAuth)
- Real-time updates با WebSocket
- پشتیبان‌گیری خودکار از داده‌ها

## Export/Import

### Export داده‌ها

1. وارد پنل Admin شوید (فقط Admin)
2. روی دکمه "خروجی JSON" کلیک کنید
3. فایل JSON دانلود می‌شود

### Import داده‌ها

1. وارد پنل Admin شوید
2. روی دکمه "وارد کردن JSON" کلیک کنید
3. فایل JSON را انتخاب کنید
4. یکی از دو حالت را انتخاب کنید:
   - **Replace**: جایگزین کردن تمام داده‌های موجود
   - **Merge**: ادغام با داده‌های موجود

**نکته:** فایل JSON باید schema معتبر داشته باشد (نسخه 1.0.0).

## Route ها

- `#/login` - صفحه ورود
- `#/questions` - لیست سوالات
- `#/questions/new` - ایجاد سوال جدید
- `#/questions/:id` - جزئیات سوال
- `#/admin` - پنل مدیریت (فقط Admin)

## دسترسی‌ها (Permissions)

### Admin
- تمام دسترسی‌های Moderator
- مدیریت کاربران (CRUD)
- پاک‌سازی دیتابیس
- Export/Import داده‌ها

### Moderator
- تمام دسترسی‌های Employee
- ویرایش/حذف سوالات و پاسخ‌های دیگران
- پذیرش پاسخ برای هر سوالی

### Employee
- ایجاد سوال
- پاسخ دادن به سوالات
- رای دادن
- ویرایش/حذف سوالات و پاسخ‌های خود

## Performance

- **Pagination**: لیست سوالات به صورت صفحه‌بندی شده نمایش داده می‌شود
- **Lazy Loading**: داده‌ها به صورت lazy load می‌شوند
- **DOM Optimization**: تغییرات DOM به حداقل رسیده است

## Accessibility

- ناوبری با کیبورد
- Focus states واضح
- aria-label برای کنترل‌های مهم
- Semantic HTML
- Support برای Screen Readers

## توسعه و تست

### Logger

برای فعال/غیرفعال کردن logging:

```javascript
import { logger } from './src/core/logger.js';

logger.enable();  // فعال
logger.disable(); // غیرفعال
```

### افزودن Feature جدید

1. Model را در `src/domain/models/` تعریف کنید
2. Repository را در `src/data/repositories/` ایجاد کنید
3. Service را در `src/domain/services/` پیاده‌سازی کنید
4. View را در `src/ui/views/` بسازید
5. Route را در `src/main.js` ثبت کنید

## عیب‌یابی

### مشکل: داده‌ها ذخیره نمی‌شوند
- بررسی کنید که IndexedDB در مرورگر فعال است
- Console را برای خطاها بررسی کنید

### مشکل: Seed Data نمایش داده نمی‌شود
- Console را بررسی کنید
- ممکن است دیتابیس قبلاً seed شده باشد (فقط یک بار seed می‌شود)

### مشکل: Export/Import کار نمی‌کند
- مطمئن شوید که فایل JSON معتبر است
- Schema version را بررسی کنید

## مجوز

این پروژه برای استفاده داخلی شرکت ساخته شده است.

## پشتیبانی

برای سوالات و مشکلات، با تیم توسعه تماس بگیرید.

---

**نسخه:** 1.0.0  
**تاریخ:** 2024

