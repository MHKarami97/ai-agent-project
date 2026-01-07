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


const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const reportList = document.getElementById('report-list');

const STORAGE_KEY = 'fh-time-tracker:tasks';

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const getActiveTaskMarkup = (task) => `
  <div class="task-card" data-id="${task.id}">
    <div class="task-card-header">
      <div>
        <h3>${task.title}</h3>
        <p>${task.category || 'بدون دسته‌بندی'} · ${formatDuration(task.total)}</p>
      </div>
      <span>${task.status === 'running' ? 'در حال اجرا' : 'متوقف'}</span>
    </div>
    <div class="task-actions">
      <button class="button-secondary" data-action="toggle">${task.status === 'running' ? 'توقف' : 'شروع'}</button>
      <button class="button-secondary" data-action="edit">ویرایش</button>
      <button class="button-danger" data-action="delete">حذف</button>
    </div>
  </div>
`;

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}س ${minutes.toString().padStart(2, '0')}د ${secs
    .toString()
    .padStart(2, '0')}ث`;
};

const updateView = () => {
  if (!tasks.length) {
    taskList.innerHTML = '<p>فعلاً کاری ثبت نشده است.</p>';
  } else {
    taskList.innerHTML = tasks.map(getActiveTaskMarkup).join('');
  }

  if (!tasks.length) {
    reportList.innerHTML = '<p>هیچ گزارشی موجود نیست.</p>';
  } else {
    const grouped = tasks.reduce((acc, task) => {
      const dateKey = new Date(task.createdAt).toLocaleDateString('fa-IR');
      acc[dateKey] = acc[dateKey] || 0;
      acc[dateKey] += task.total;
      return acc;
    }, {});

    reportList.innerHTML = Object.entries(grouped)
      .map(
        ([date, total]) => `
      <div class="report-card">
        <p>تاریخ: ${date}</p>
        <p>کل زمان: <span>${formatDuration(total)}</span></p>
      </div>
    `
      )
      .join('');
  }
};

const persist = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

const handleToggle = (taskId) => {
  tasks = tasks.map((task) => {
    if (task.id !== taskId) return task;

    if (task.status === 'running') {
      const now = Date.now();
      return {
        ...task,
        status: 'paused',
        total: task.total + Math.floor((now - task.startedAt) / 1000),
      };
    }

    return {
      ...task,
      status: 'running',
      startedAt: Date.now(),
    };
  });

  persist();
  updateView();
};

const handleDelete = (taskId) => {
  tasks = tasks.filter((task) => task.id !== taskId);
  persist();
  updateView();
};

const handleEdit = (taskId) => {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  const newTitle = prompt('عنوان جدید را وارد کنید', task.title);
  if (newTitle === null) return;

  const newCategory = prompt('دسته‌بندی جدید را وارد کنید', task.category || '');
  tasks = tasks.map((item) =>
    item.id === taskId ? { ...item, title: newTitle.trim() || item.title, category: newCategory.trim() } : item
  );

  persist();
  updateView();
};

taskList.addEventListener('click', (event) => {
  const action = event.target.dataset.action;
  const taskId = event.target.closest('.task-card')?.dataset.id;
  if (!action || !taskId) return;

  if (action === 'toggle') handleToggle(taskId);
  if (action === 'delete') handleDelete(taskId);
  if (action === 'edit') handleEdit(taskId);
});

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = document.getElementById('task-title').value.trim();
  const category = document.getElementById('task-category').value.trim();

  const newTask = {
    id: crypto.randomUUID(),
    title,
    category,
    total: 0,
    status: 'paused',
    createdAt: Date.now(),
    startedAt: null,
  };

  tasks = [newTask, ...tasks];
  persist();
  updateView();
  taskForm.reset();
});

const hydrateTimers = () => {
  tasks = tasks.map((task) => {
    if (task.status !== 'running') return task;

    const elapsed = Math.floor((Date.now() - task.startedAt) / 1000);
    return { ...task, total: task.total + elapsed, startedAt: Date.now() - elapsed * 1000 };
  });
};

setInterval(() => {
  tasks = tasks.map((task) => {
    if (task.status !== 'running') return task;

    const elapsed = Math.floor((Date.now() - task.startedAt) / 1000);
    return { ...task, total: task.total + elapsed, startedAt: Date.now() - elapsed * 1000 };
  });

  updateView();
}, 1000);

hydrateTimers();
updateView();

