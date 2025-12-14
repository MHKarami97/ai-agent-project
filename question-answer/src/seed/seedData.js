export const seedData = {
    users: [
        {
            id: 'user_admin_1',
            username: 'admin',
            displayName: 'مدیر سیستم',
            role: 'Admin',
            department: 'IT',
            createdAt: new Date('2024-01-01').toISOString()
        },
        {
            id: 'user_mod_1',
            username: 'moderator',
            displayName: 'ناظر',
            role: 'Moderator',
            department: 'IT',
            createdAt: new Date('2024-01-02').toISOString()
        },
        {
            id: 'user_emp_1',
            username: 'employee1',
            displayName: 'کارمند 1',
            role: 'Employee',
            department: 'Sales',
            createdAt: new Date('2024-01-03').toISOString()
        },
        {
            id: 'user_emp_2',
            username: 'employee2',
            displayName: 'کارمند 2',
            role: 'Employee',
            department: 'Marketing',
            createdAt: new Date('2024-01-04').toISOString()
        }
    ],
    questions: [
        {
            id: 'question_1',
            title: 'چگونه می‌توانم از Git استفاده کنم؟',
            body: 'من تازه شروع به استفاده از Git کرده‌ام و می‌خواهم بدانم چگونه می‌توانم تغییرات را commit کنم و به repository اضافه کنم.',
            tags: ['git', 'version-control', 'development'],
            department: 'IT',
            priority: 'High',
            authorId: 'user_emp_1',
            createdAt: new Date('2024-01-10').toISOString(),
            updatedAt: new Date('2024-01-10').toISOString(),
            votesScore: 5,
            views: 15,
            acceptedAnswerId: null
        },
        {
            id: 'question_2',
            title: 'بهترین روش برای مدیریت پروژه چیست؟',
            body: 'ما یک تیم 10 نفره داریم و می‌خواهیم پروژه‌هایمان را بهتر مدیریت کنیم. چه ابزارها و روش‌هایی پیشنهاد می‌کنید؟',
            tags: ['project-management', 'team'],
            department: 'Management',
            priority: 'Medium',
            authorId: 'user_emp_2',
            createdAt: new Date('2024-01-12').toISOString(),
            updatedAt: new Date('2024-01-12').toISOString(),
            votesScore: 3,
            views: 22,
            acceptedAnswerId: null
        },
        {
            id: 'question_3',
            title: 'نحوه تنظیم VPN برای کار از راه دور',
            body: 'من می‌خواهم از خانه به شبکه شرکت متصل شوم. لطفاً راهنمایی کنید که چگونه VPN را تنظیم کنم.',
            tags: ['vpn', 'remote-work', 'network'],
            department: 'IT',
            priority: 'High',
            authorId: 'user_emp_1',
            createdAt: new Date('2024-01-15').toISOString(),
            updatedAt: new Date('2024-01-15').toISOString(),
            votesScore: 8,
            views: 30,
            acceptedAnswerId: 'answer_1'
        },
        {
            id: 'question_4',
            title: 'سیاست مرخصی شرکت چگونه است؟',
            body: 'می‌خواهم بدانم چه قوانینی برای استفاده از مرخصی در شرکت وجود دارد و چگونه می‌توانم درخواست مرخصی بدهم.',
            tags: ['hr', 'policy'],
            department: 'HR',
            priority: 'Low',
            authorId: 'user_emp_2',
            createdAt: new Date('2024-01-18').toISOString(),
            updatedAt: new Date('2024-01-18').toISOString(),
            votesScore: 2,
            views: 18,
            acceptedAnswerId: null
        },
        {
            id: 'question_5',
            title: 'بهترین روش برای backup گرفتن از داده‌ها',
            body: 'می‌خواهم از فایل‌های مهمم backup بگیرم. چه روش‌هایی پیشنهاد می‌کنید؟ آیا باید از cloud storage استفاده کنم؟',
            tags: ['backup', 'data', 'security'],
            department: 'IT',
            priority: 'Medium',
            authorId: 'user_emp_1',
            createdAt: new Date('2024-01-20').toISOString(),
            updatedAt: new Date('2024-01-20').toISOString(),
            votesScore: 4,
            views: 25,
            acceptedAnswerId: null
        }
    ],
    answers: [
        {
            id: 'answer_1',
            questionId: 'question_3',
            body: 'برای تنظیم VPN، ابتدا باید از بخش IT درخواست دسترسی کنید. سپس می‌توانید از نرم‌افزار OpenVPN استفاده کنید. فایل پیکربندی را از IT دریافت کرده و در نرم‌افزار import کنید.',
            authorId: 'user_mod_1',
            createdAt: new Date('2024-01-16').toISOString(),
            updatedAt: new Date('2024-01-16').toISOString(),
            votesScore: 6
        },
        {
            id: 'answer_2',
            questionId: 'question_1',
            body: 'برای commit کردن تغییرات در Git، ابتدا باید فایل‌ها را با `git add` به staging area اضافه کنید، سپس با `git commit -m "پیام"` تغییرات را commit کنید. برای push به repository از `git push` استفاده کنید.',
            authorId: 'user_mod_1',
            createdAt: new Date('2024-01-11').toISOString(),
            updatedAt: new Date('2024-01-11').toISOString(),
            votesScore: 4
        },
        {
            id: 'answer_3',
            questionId: 'question_1',
            body: 'همچنین می‌توانید از `git status` برای دیدن وضعیت فایل‌ها استفاده کنید و از `git log` برای مشاهده تاریخچه commit‌ها.',
            authorId: 'user_emp_2',
            createdAt: new Date('2024-01-11').toISOString(),
            updatedAt: new Date('2024-01-11').toISOString(),
            votesScore: 2
        },
        {
            id: 'answer_4',
            questionId: 'question_2',
            body: 'برای تیم‌های کوچک تا متوسط، پیشنهاد می‌کنم از ابزارهایی مثل Trello یا Asana استفاده کنید. همچنین می‌توانید از روش Scrum برای مدیریت پروژه استفاده کنید.',
            authorId: 'user_admin_1',
            createdAt: new Date('2024-01-13').toISOString(),
            updatedAt: new Date('2024-01-13').toISOString(),
            votesScore: 5
        },
        {
            id: 'answer_5',
            questionId: 'question_2',
            body: 'همچنین می‌توانید از Jira برای مدیریت پروژه‌های پیچیده‌تر استفاده کنید. این ابزار قابلیت‌های پیشرفته‌تری برای tracking و reporting دارد.',
            authorId: 'user_mod_1',
            createdAt: new Date('2024-01-14').toISOString(),
            updatedAt: new Date('2024-01-14').toISOString(),
            votesScore: 3
        },
        {
            id: 'answer_6',
            questionId: 'question_4',
            body: 'برای درخواست مرخصی، باید از سیستم HR استفاده کنید. هر کارمند سالانه 20 روز مرخصی دارد که می‌تواند از آن استفاده کند. برای مرخصی بیشتر از 3 روز، باید حداقل یک هفته قبل درخواست دهید.',
            authorId: 'user_admin_1',
            createdAt: new Date('2024-01-19').toISOString(),
            updatedAt: new Date('2024-01-19').toISOString(),
            votesScore: 1
        },
        {
            id: 'answer_7',
            questionId: 'question_5',
            body: 'برای backup، پیشنهاد می‌کنم از روش 3-2-1 استفاده کنید: 3 کپی از داده‌ها، 2 نسخه در مکان‌های مختلف، 1 نسخه offsite. می‌توانید از cloud storage مثل Google Drive یا OneDrive استفاده کنید.',
            authorId: 'user_mod_1',
            createdAt: new Date('2024-01-21').toISOString(),
            updatedAt: new Date('2024-01-21').toISOString(),
            votesScore: 4
        },
        {
            id: 'answer_8',
            questionId: 'question_5',
            body: 'همچنین می‌توانید از ابزارهای backup خودکار مثل Time Machine (Mac) یا File History (Windows) استفاده کنید. این ابزارها به صورت خودکار backup می‌گیرند.',
            authorId: 'user_emp_2',
            createdAt: new Date('2024-01-22').toISOString(),
            updatedAt: new Date('2024-01-22').toISOString(),
            votesScore: 2
        }
    ],
    votes: [
        { userId: 'user_emp_1', targetType: 'question', targetId: 'question_3', value: 1 },
        { userId: 'user_emp_2', targetType: 'question', targetId: 'question_3', value: 1 },
        { userId: 'user_mod_1', targetType: 'answer', targetId: 'answer_1', value: 1 },
        { userId: 'user_admin_1', targetType: 'answer', targetId: 'answer_1', value: 1 }
    ]
};

