/**
 * Seed Data
 */
export const seedUsers = [
    {
        username: 'admin',
        displayName: 'مدیر سیستم',
        role: 'Admin',
        department: 'IT'
    },
    {
        username: 'moderator1',
        displayName: 'ناظر اول',
        role: 'Moderator',
        department: 'HR'
    },
    {
        username: 'employee1',
        displayName: 'کارمند نمونه',
        role: 'Employee',
        department: 'Development'
    }
];

export const seedQuestions = [
    {
        title: 'چگونه می‌توانم از IndexedDB در JavaScript استفاده کنم؟',
        body: 'من می‌خواهم داده‌های محلی را در مرورگر ذخیره کنم. بهترین روش استفاده از IndexedDB چیست؟',
        tags: ['javascript', 'indexeddb', 'frontend'],
        department: 'Development',
        priority: 'High',
        authorId: 3, // employee1
        votesScore: 5,
        views: 12,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        title: 'بهترین روش برای مدیریت state در Vanilla JavaScript چیست؟',
        body: 'در پروژه‌های بزرگ بدون استفاده از فریمورک، چگونه می‌توان state را به صورت کارآمد مدیریت کرد؟',
        tags: ['javascript', 'state-management', 'architecture'],
        department: 'Development',
        priority: 'Medium',
        authorId: 3,
        votesScore: 3,
        views: 8,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        title: 'نحوه پیاده‌سازی سیستم رای‌دهی در یک اپلیکیشن Q&A',
        body: 'می‌خواهم یک سیستم رای‌دهی برای سوالات و پاسخ‌ها پیاده‌سازی کنم. چه نکاتی را باید در نظر بگیرم؟',
        tags: ['javascript', 'voting', 'qa-system'],
        department: 'Development',
        priority: 'Medium',
        authorId: 2, // moderator1
        votesScore: 2,
        views: 15,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        title: 'بهترین روش برای Export/Import داده‌ها در یک اپلیکیشن Frontend',
        body: 'چگونه می‌توانم داده‌های IndexedDB را به فایل JSON تبدیل کنم و دوباره وارد کنم؟',
        tags: ['indexeddb', 'export', 'import', 'json'],
        department: 'Development',
        priority: 'Low',
        authorId: 1, // admin
        votesScore: 1,
        views: 6,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        title: 'نحوه پیاده‌سازی Router ساده با Hash-based Navigation',
        body: 'می‌خواهم یک Router ساده برای SPA خودم بسازم. چگونه می‌توانم از hash-based routing استفاده کنم؟',
        tags: ['javascript', 'router', 'spa', 'routing'],
        department: 'Development',
        priority: 'High',
        authorId: 3,
        votesScore: 4,
        views: 10,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        acceptedAnswerId: null
    }
];

export const seedAnswers = [
    {
        questionId: 1,
        body: 'برای استفاده از IndexedDB، می‌توانید از API های native مرورگر استفاده کنید یا از یک wrapper library مثل Dexie.js استفاده کنید. IndexedDB برای ذخیره داده‌های بزرگ و پیچیده مناسب است.',
        authorId: 2,
        votesScore: 3,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        questionId: 1,
        body: 'همچنین می‌توانید از localStorage برای داده‌های کوچک‌تر استفاده کنید. IndexedDB برای داده‌های ساختاریافته و بزرگ مناسب‌تر است.',
        authorId: 1,
        votesScore: 2,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        questionId: 2,
        body: 'برای مدیریت state در Vanilla JS می‌توانید از الگوهای Observer یا Pub/Sub استفاده کنید. همچنین می‌توانید یک EventBus ساده پیاده‌سازی کنید.',
        authorId: 1,
        votesScore: 2,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        questionId: 3,
        body: 'برای سیستم رای‌دهی باید مطمئن شوید که هر کاربر فقط یک‌بار بتواند رای دهد. می‌توانید از یک جدول جداگانه برای votes استفاده کنید و با ترکیب userId و targetId یک unique constraint ایجاد کنید.',
        authorId: 1,
        votesScore: 4,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        questionId: 4,
        body: 'برای Export می‌توانید تمام داده‌ها را از IndexedDB بخوانید و به JSON تبدیل کنید. برای Import باید داده‌ها را validate کنید و سپس در IndexedDB ذخیره کنید.',
        authorId: 2,
        votesScore: 1,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        questionId: 5,
        body: 'برای Router ساده می‌توانید از window.location.hash استفاده کنید و با event listener برای hashchange، view مناسب را رندر کنید. همچنین می‌توانید از pattern matching برای route parameters استفاده کنید.',
        authorId: 1,
        votesScore: 5,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        questionId: 5,
        body: 'یک روش دیگر استفاده از History API است اما برای GitHub Pages بهتر است از hash-based routing استفاده کنید چون نیازی به تنظیمات server-side ندارد.',
        authorId: 2,
        votesScore: 2,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        questionId: 2,
        body: 'همچنین می‌توانید از یک state container ساده استفاده کنید که با EventBus ترکیب شده باشد. این روش برای پروژه‌های متوسط مناسب است.',
        authorId: 3,
        votesScore: 1,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
];

export const seedVotes = [
    // Votes for questions
    { userId: 1, targetType: 'question', targetId: 1, value: 1 },
    { userId: 2, targetType: 'question', targetId: 1, value: 1 },
    { userId: 1, targetType: 'question', targetId: 2, value: 1 },
    { userId: 3, targetType: 'question', targetId: 2, value: 1 },
    { userId: 1, targetType: 'question', targetId: 2, value: 1 },
    { userId: 1, targetType: 'question', targetId: 3, value: 1 },
    { userId: 2, targetType: 'question', targetId: 3, value: 1 },
    { userId: 1, targetType: 'question', targetId: 4, value: 1 },
    { userId: 1, targetType: 'question', targetId: 5, value: 1 },
    { userId: 2, targetType: 'question', targetId: 5, value: 1 },
    { userId: 3, targetType: 'question', targetId: 5, value: 1 },
    { userId: 1, targetType: 'question', targetId: 5, value: 1 },
    
    // Votes for answers
    { userId: 1, targetType: 'answer', targetId: 1, value: 1 },
    { userId: 3, targetType: 'answer', targetId: 1, value: 1 },
    { userId: 1, targetType: 'answer', targetId: 1, value: 1 },
    { userId: 2, targetType: 'answer', targetId: 2, value: 1 },
    { userId: 3, targetType: 'answer', targetId: 2, value: 1 },
    { userId: 2, targetType: 'answer', targetId: 3, value: 1 },
    { userId: 3, targetType: 'answer', targetId: 3, value: 1 },
    { userId: 1, targetType: 'answer', targetId: 4, value: 1 },
    { userId: 2, targetType: 'answer', targetId: 4, value: 1 },
    { userId: 3, targetType: 'answer', targetId: 4, value: 1 },
    { userId: 1, targetType: 'answer', targetId: 4, value: 1 },
    { userId: 2, targetType: 'answer', targetId: 5, value: 1 },
    { userId: 1, targetType: 'answer', targetId: 6, value: 1 },
    { userId: 2, targetType: 'answer', targetId: 6, value: 1 },
    { userId: 3, targetType: 'answer', targetId: 6, value: 1 },
    { userId: 1, targetType: 'answer', targetId: 6, value: 1 },
    { userId: 2, targetType: 'answer', targetId: 6, value: 1 },
    { userId: 2, targetType: 'answer', targetId: 7, value: 1 },
    { userId: 3, targetType: 'answer', targetId: 7, value: 1 },
    { userId: 1, targetType: 'answer', targetId: 8, value: 1 }
];
