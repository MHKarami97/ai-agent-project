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


// =====================================
// Persian Calendar Utilities
// =====================================

const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const persianWeekDays = [
    'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'
];

const persianWeekDaysShort = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'];

// Convert Gregorian to Persian (Jalali)
function gregorianToPersian(gYear, gMonth, gDay) {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    const jy = (gYear <= 1600) ? 0 : 979;
    gYear -= (gYear <= 1600) ? 621 : 1600;
    let gy2 = (gMonth > 2) ? (gYear + 1) : gYear;
    let days = (365 * gYear) + (parseInt((gy2 + 3) / 4)) - (parseInt((gy2 + 99) / 100)) +
        (parseInt((gy2 + 399) / 400)) - 80 + gDay + g_d_m[gMonth - 1];
    let jy_val = -1595 + (33 * (parseInt(days / 12053)));
    days %= 12053;
    jy_val += 4 * (parseInt(days / 1461));
    days %= 1461;
    if (days > 365) {
        jy_val += parseInt((days - 1) / 365);
        days = (days - 1) % 365;
    }
    let jm = (days < 186) ? 1 + parseInt(days / 31) : 7 + parseInt((days - 186) / 30);
    let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
    return [jy_val + jy, jm, jd];
}

// Convert Persian (Jalali) to Gregorian
function persianToGregorian(jY, jM, jD) {
    jY += 1595;
    let days = 365 * jY + (parseInt(jY / 33)) * 8 + parseInt(((jY % 33) + 3) / 4) + 78 + jD +
        ((jM < 7) ? (jM - 1) * 31 : ((jM - 7) * 30) + 186);
    let gy = 400 * parseInt(days / 146097);
    days %= 146097;
    let flag = true;
    if (days >= 36525) {
        days--;
        gy += 100 * parseInt(days / 36524);
        days %= 36524;
        if (days >= 365) days++;
        else flag = false;
    }
    if (flag) {
        gy += 4 * parseInt(days / 1461);
        days %= 1461;
        if (days >= 366) {
            flag = false;
            days--;
            gy += parseInt(days / 365);
            days = days % 365;
        }
    }
    let gd = days + 1;
    let sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm;
    for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) {
        gd -= sal_a[gm];
    }
    return [gy, gm, gd];
}

// Format Persian Date
function formatPersianDate(jYear, jMonth, jDay) {
    return `${jYear}/${jMonth.toString().padStart(2, '0')}/${jDay.toString().padStart(2, '0')}`;
}

// =====================================
// Application State
// =====================================

let tasks = [];
let currentPersianDate = new Date();
let selectedDate = null;
let currentFilter = 'all';
let editingTaskId = null;

// =====================================
// LocalStorage Functions
// =====================================

function saveTasks() {
    localStorage.setItem('dailyPlannerTasks', JSON.stringify(tasks));
}

function loadTasks() {
    const savedTasks = localStorage.getItem('dailyPlannerTasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
}

// =====================================
// Task Functions
// =====================================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function addTask(taskData) {
    const task = {
        id: generateId(),
        title: taskData.title,
        description: taskData.description || '',
        date: taskData.date,
        time: taskData.time || '',
        priority: taskData.priority || 'medium',
        reminder: taskData.reminder || 'none',
        completed: false,
        createdAt: new Date().toISOString()
    };
    tasks.push(task);
    saveTasks();
    scheduleReminder(task);
    return task;
}

function updateTask(id, updatedData) {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex !== -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], ...updatedData };
        saveTasks();
        scheduleReminder(tasks[taskIndex]);
        return tasks[taskIndex];
    }
    return null;
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
}

function toggleTaskCompletion(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
    }
}

function getTasksByDate(date) {
    return tasks.filter(t => t.date === date);
}

function getTasksForToday() {
    const today = new Date();
    const [jY, jM, jD] = gregorianToPersian(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const todayStr = formatPersianDate(jY, jM, jD);
    return tasks.filter(t => t.date === todayStr);
}

function getTasksForWeek() {
    const today = new Date();
    const weekTasks = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const [jY, jM, jD] = gregorianToPersian(date.getFullYear(), date.getMonth() + 1, date.getDate());
        const dateStr = formatPersianDate(jY, jM, jD);
        weekTasks.push(...tasks.filter(t => t.date === dateStr));
    }
    return weekTasks;
}

function filterTasks(filter) {
    currentFilter = filter;
    let filteredTasks = [];
    
    switch (filter) {
        case 'today':
            filteredTasks = getTasksForToday();
            break;
        case 'week':
            filteredTasks = getTasksForWeek();
            break;
        case 'completed':
            filteredTasks = tasks.filter(t => t.completed);
            break;
        case 'pending':
            filteredTasks = tasks.filter(t => !t.completed);
            break;
        default:
            filteredTasks = tasks;
    }
    
    return filteredTasks;
}

function searchTasks(query) {
    const lowerQuery = query.toLowerCase();
    return tasks.filter(t =>
        t.title.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery)
    );
}

// =====================================
// Calendar Functions
// =====================================

function renderCalendar(date) {
    const calendar = document.getElementById('calendar');
    const gYear = date.getFullYear();
    const gMonth = date.getMonth() + 1;
    const [pYear, pMonth] = gregorianToPersian(gYear, gMonth, 15);
    
    // Update header
    document.getElementById('currentMonth').textContent = `${persianMonths[pMonth - 1]} ${pYear}`;
    
    // Clear calendar
    calendar.innerHTML = '';
    
    // Add weekday headers
    persianWeekDaysShort.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day header';
        dayHeader.textContent = day;
        calendar.appendChild(dayHeader);
    });
    
    // Calculate first day of month
    const [gY, gM, gD] = persianToGregorian(pYear, pMonth, 1);
    const firstDay = new Date(gY, gM - 1, gD);
    const firstDayOfWeek = firstDay.getDay();
    
    // Days in month
    const daysInMonth = pMonth <= 6 ? 31 : (pMonth <= 11 ? 30 : (isLeapYear(pYear) ? 30 : 29));
    
    // Previous month days
    const prevMonthDays = pMonth === 1 ? (isLeapYear(pYear - 1) ? 30 : 29) : (pMonth <= 7 ? 31 : 30);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        const dayDiv = createCalendarDay(day, pYear, pMonth - 1, true);
        calendar.appendChild(dayDiv);
    }
    
    // Current month days
    const today = new Date();
    const [todayJY, todayJM, todayJD] = gregorianToPersian(today.getFullYear(), today.getMonth() + 1, today.getDate());
    
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = (pYear === todayJY && pMonth === todayJM && day === todayJD);
        const dateStr = formatPersianDate(pYear, pMonth, day);
        const hasTasks = getTasksByDate(dateStr).length > 0;
        const isSelected = selectedDate === dateStr;
        
        const dayDiv = createCalendarDay(day, pYear, pMonth, false, isToday, hasTasks, isSelected);
        calendar.appendChild(dayDiv);
    }
    
    // Next month days
    const totalCells = calendar.children.length - 7; // Exclude headers
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let day = 1; day <= remainingCells; day++) {
        const dayDiv = createCalendarDay(day, pYear, pMonth + 1, true);
        calendar.appendChild(dayDiv);
    }
}

function createCalendarDay(day, year, month, isOtherMonth, isToday = false, hasTasks = false, isSelected = false) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    if (isOtherMonth) dayDiv.classList.add('other-month');
    if (isToday) dayDiv.classList.add('today');
    if (hasTasks) dayDiv.classList.add('has-tasks');
    if (isSelected) dayDiv.classList.add('selected');
    
    dayDiv.textContent = day;
    
    if (!isOtherMonth) {
        dayDiv.addEventListener('click', () => {
            const dateStr = formatPersianDate(year, month, day);
            selectedDate = dateStr;
            document.getElementById('taskDate').value = dateStr;
            renderCalendar(currentPersianDate);
        });
    }
    
    return dayDiv;
}

function isLeapYear(year) {
    const breaks = [1, 5, 9, 13, 17, 22, 26, 30];
    const jp = breaks[0];
    
    let jump;
    for (let i = 1; i < breaks.length; i++) {
        const jm = breaks[i];
        jump = jm - jp;
        if (year < jm) break;
    }
    
    let n = year - jp;
    
    if (jump - n < 6) n = n - jump + (jump + 4) / 33 * 33;
    
    let leapJ = ((n + 1) % 33) - 1;
    if (leapJ === -1) leapJ = 32;
    
    return (leapJ % 4) === 0;
}

function updateTodayInfo() {
    const today = new Date();
    const [jY, jM, jD] = gregorianToPersian(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const weekDay = persianWeekDays[today.getDay()];
    
    document.getElementById('todayDate').textContent = 
        `امروز: ${weekDay}، ${jD} ${persianMonths[jM - 1]} ${jY}`;
}

// =====================================
// UI Rendering
// =====================================

function renderTasks(tasksToRender = tasks) {
    const tasksList = document.getElementById('tasksList');
    
    if (tasksToRender.length === 0) {
        tasksList.innerHTML = '<p class="no-tasks">هیچ وظیفه‌ای برای نمایش وجود ندارد.</p>';
        return;
    }
    
    tasksList.innerHTML = '';
    
    // Sort tasks by date and time
    tasksToRender.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        if (a.time !== b.time) return a.time.localeCompare(b.time);
        return 0;
    });
    
    tasksToRender.forEach(task => {
        const taskItem = createTaskElement(task);
        tasksList.appendChild(taskItem);
    });
}

function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item priority-${task.priority}`;
    if (task.completed) taskDiv.classList.add('completed');
    
    const priorityText = {
        low: 'کم',
        medium: 'متوسط',
        high: 'زیاد'
    };
    
    const reminderText = {
        'none': 'بدون یادآوری',
        '0': 'در زمان وظیفه',
        '5': '5 دقیقه قبل',
        '15': '15 دقیقه قبل',
        '30': '30 دقیقه قبل',
        '60': '1 ساعت قبل'
    };
    
    taskDiv.innerHTML = `
        <div class="task-header">
            <div class="task-title-wrapper">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                    onchange="toggleTaskCompletion('${task.id}'); updateUI();">
                <div>
                    <div class="task-title">${escapeHtml(task.title)}</div>
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-icon btn-edit" onclick="editTask('${task.id}')" title="ویرایش">✏️</button>
                <button class="btn-icon btn-delete" onclick="deleteTaskConfirm('${task.id}')" title="حذف">🗑️</button>
            </div>
        </div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-meta">
            <div class="task-meta-item">📅 ${task.date}</div>
            ${task.time ? `<div class="task-meta-item">🕐 ${task.time}</div>` : ''}
            <span class="task-badge badge-${task.priority}">${priorityText[task.priority]}</span>
            ${task.reminder !== 'none' ? `<div class="task-meta-item">🔔 ${reminderText[task.reminder]}</div>` : ''}
        </div>
    `;
    
    return taskDiv;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const todayTasks = getTasksForToday().length;
    
    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
    document.getElementById('todayTasks').textContent = todayTasks;
}

function updateUI() {
    const filteredTasks = filterTasks(currentFilter);
    renderTasks(filteredTasks);
    updateStatistics();
    renderCalendar(currentPersianDate);
}

// =====================================
// Event Handlers
// =====================================

function handleAddTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const date = document.getElementById('taskDate').value;
    const time = document.getElementById('taskTime').value;
    const priority = document.getElementById('taskPriority').value;
    const reminder = document.getElementById('taskReminder').value;
    
    if (!title) {
        alert('لطفاً عنوان وظیفه را وارد کنید.');
        return;
    }
    
    if (!date) {
        alert('لطفاً تاریخ وظیفه را انتخاب کنید.');
        return;
    }
    
    addTask({ title, description, date, time, priority, reminder });
    clearForm();
    updateUI();
    
    showNotification('✅ وظیفه با موفقیت اضافه شد!');
}

function handleUpdateTask() {
    if (!editingTaskId) return;
    
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const date = document.getElementById('taskDate').value;
    const time = document.getElementById('taskTime').value;
    const priority = document.getElementById('taskPriority').value;
    const reminder = document.getElementById('taskReminder').value;
    
    if (!title || !date) {
        alert('لطفاً عنوان و تاریخ وظیفه را وارد کنید.');
        return;
    }
    
    updateTask(editingTaskId, { title, description, date, time, priority, reminder });
    clearForm();
    cancelEdit();
    updateUI();
    
    showNotification('✅ وظیفه با موفقیت ویرایش شد!');
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    editingTaskId = id;
    
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description;
    document.getElementById('taskDate').value = task.date;
    document.getElementById('taskTime').value = task.time;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskReminder').value = task.reminder;
    
    document.getElementById('addTaskBtn').style.display = 'none';
    document.getElementById('updateTaskBtn').style.display = 'block';
    document.getElementById('cancelEditBtn').style.display = 'inline-block';
    
    // Scroll to form
    document.querySelector('.task-input-section').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
    editingTaskId = null;
    document.getElementById('addTaskBtn').style.display = 'block';
    document.getElementById('updateTaskBtn').style.display = 'none';
    document.getElementById('cancelEditBtn').style.display = 'none';
}

function deleteTaskConfirm(id) {
    if (confirm('آیا از حذف این وظیفه اطمینان دارید؟')) {
        deleteTask(id);
        updateUI();
        showNotification('🗑️ وظیفه حذف شد.');
    }
}

function clearForm() {
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskDate').value = '';
    document.getElementById('taskTime').value = '';
    document.getElementById('taskPriority').value = 'medium';
    document.getElementById('taskReminder').value = 'none';
}

function clearCompletedTasks() {
    if (confirm('آیا از حذف تمام وظایف انجام شده اطمینان دارید؟')) {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        updateUI();
        showNotification('✅ وظایف انجام شده پاک شدند.');
    }
}

// =====================================
// Notifications & Reminders
// =====================================

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function showNotification(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('برنامه‌ریز روزانه', {
            body: message,
            icon: '📅',
            dir: 'rtl',
            lang: 'fa'
        });
    }
}

function scheduleReminder(task) {
    if (task.reminder === 'none' || !task.time) return;
    
    const [year, month, day] = task.date.split('/').map(Number);
    const [hour, minute] = task.time.split(':').map(Number);
    const [gYear, gMonth, gDay] = persianToGregorian(year, month, day);
    
    const taskDate = new Date(gYear, gMonth - 1, gDay, hour, minute);
    const reminderMinutes = parseInt(task.reminder);
    const reminderTime = new Date(taskDate.getTime() - (reminderMinutes * 60 * 1000));
    
    const now = new Date();
    const timeUntilReminder = reminderTime.getTime() - now.getTime();
    
    if (timeUntilReminder > 0 && timeUntilReminder < 24 * 60 * 60 * 1000) { // Within 24 hours
        setTimeout(() => {
            showNotification(`⏰ یادآوری: ${task.title}`);
        }, timeUntilReminder);
    }
}

function checkUpcomingTasks() {
    const now = new Date();
    tasks.forEach(task => {
        if (task.completed || !task.time || task.reminder === 'none') return;
        scheduleReminder(task);
    });
}

// =====================================
// Event Listeners Setup
// =====================================

function setupEventListeners() {
    // Add Task Button
    document.getElementById('addTaskBtn').addEventListener('click', handleAddTask);
    
    // Update Task Button
    document.getElementById('updateTaskBtn').addEventListener('click', handleUpdateTask);
    
    // Cancel Edit Button
    document.getElementById('cancelEditBtn').addEventListener('click', () => {
        clearForm();
        cancelEdit();
    });
    
    // Clear Completed Tasks
    document.getElementById('clearCompletedBtn').addEventListener('click', clearCompletedTasks);
    
    // Calendar Navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentPersianDate.setMonth(currentPersianDate.getMonth() - 1);
        renderCalendar(currentPersianDate);
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentPersianDate.setMonth(currentPersianDate.getMonth() + 1);
        renderCalendar(currentPersianDate);
    });
    
    // Filter Buttons
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            updateUI();
        });
    });
    
    // Search
    document.getElementById('searchTasks').addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query) {
            const searchResults = searchTasks(query);
            renderTasks(searchResults);
        } else {
            updateUI();
        }
    });
    
    // Enter key on inputs
    document.getElementById('taskTitle').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (editingTaskId) {
                handleUpdateTask();
            } else {
                handleAddTask();
            }
        }
    });
}

// =====================================
// Initialization
// =====================================

function init() {
    loadTasks();
    setupEventListeners();
    updateTodayInfo();
    renderCalendar(currentPersianDate);
    updateUI();
    requestNotificationPermission();
    checkUpcomingTasks();
    
    // Set current date as default
    const today = new Date();
    const [jY, jM, jD] = gregorianToPersian(today.getFullYear(), today.getMonth() + 1, today.getDate());
    document.getElementById('taskDate').value = formatPersianDate(jY, jM, jD);
    selectedDate = formatPersianDate(jY, jM, jD);
    
    // Check reminders every minute
    setInterval(checkUpcomingTasks, 60000);
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Make functions available globally for inline event handlers
window.toggleTaskCompletion = toggleTaskCompletion;
window.editTask = editTask;
window.deleteTaskConfirm = deleteTaskConfirm;

