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


// مدیریت دیتابیس مرورگر (IndexedDB)
class BudgetDB {
    constructor() {
        this.dbName = 'BudgetPlannerDB';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('transactions')) {
                    const objectStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
                    objectStore.createIndex('type', 'type', { unique: false });
                    objectStore.createIndex('category', 'category', { unique: false });
                    objectStore.createIndex('date', 'date', { unique: false });
                }
            };
        });
    }

    async addTransaction(transaction) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['transactions'], 'readwrite');
            const store = tx.objectStore('transactions');
            const request = store.add(transaction);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllTransactions() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['transactions'], 'readonly');
            const store = tx.objectStore('transactions');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateTransaction(id, transaction) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['transactions'], 'readwrite');
            const store = tx.objectStore('transactions');
            transaction.id = id;
            const request = store.put(transaction);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteTransaction(id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['transactions'], 'readwrite');
            const store = tx.objectStore('transactions');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clearAll() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['transactions'], 'readwrite');
            const store = tx.objectStore('transactions');
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// متغیرهای سراسری
const budgetDB = new BudgetDB();
let transactions = [];
let currentChart = null;
let currentChartType = 'pie';
let currentFilter = 'all';
let editingId = null;

// المنت‌های DOM
const transactionForm = document.getElementById('transactionForm');
const editForm = document.getElementById('editForm');
const transactionsList = document.getElementById('transactionsList');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const balanceEl = document.getElementById('balance');
const searchInput = document.getElementById('searchInput');
const modal = document.getElementById('modal');
const closeModal = document.querySelector('.close');
const exportBtn = document.getElementById('exportBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const chartCanvas = document.getElementById('chart');

// تنظیم تاریخ پیش‌فرض
document.getElementById('date').valueAsDate = new Date();
document.getElementById('editDate').valueAsDate = new Date();

// راه‌اندازی برنامه
async function initApp() {
    try {
        await budgetDB.init();
        await loadTransactions();
        setupEventListeners();
        updateUI();
    } catch (error) {
        console.error('خطا در راه‌اندازی برنامه:', error);
        alert('خطا در راه‌اندازی برنامه. لطفاً صفحه را رفرش کنید.');
    }
}

// بارگذاری تراکنش‌ها از دیتابیس
async function loadTransactions() {
    transactions = await budgetDB.getAllTransactions();
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// تنظیم رویدادها
function setupEventListeners() {
    // فرم افزودن تراکنش
    transactionForm.addEventListener('submit', handleAddTransaction);

    // فرم ویرایش تراکنش
    editForm.addEventListener('submit', handleEditTransaction);

    // دکمه‌های فیلتر
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            displayTransactions();
        });
    });

    // دکمه‌های تب نمودار
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentChartType = e.target.dataset.chart;
            updateChart();
        });
    });

    // جستجو
    searchInput.addEventListener('input', displayTransactions);

    // مودال
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // خروجی و پاک کردن
    exportBtn.addEventListener('click', exportToCSV);
    clearAllBtn.addEventListener('click', clearAllData);

    // تغییر نوع تراکنش
    document.getElementById('type').addEventListener('change', updateCategoryOptions);
    document.getElementById('editType').addEventListener('change', updateEditCategoryOptions);
}

// به‌روزرسانی دسته‌بندی‌ها بر اساس نوع
function updateCategoryOptions() {
    const type = document.getElementById('type').value;
    const category = document.getElementById('category');
    
    const incomeCategories = ['حقوق', 'پاداش', 'سرمایه گذاری', 'سایر'];
    const expenseCategories = ['غذا', 'حمل و نقل', 'خرید', 'قبض', 'تفریح', 'بهداشت', 'آموزش', 'سایر'];
    
    const categories = type === 'income' ? incomeCategories : expenseCategories;
    
    category.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

function updateEditCategoryOptions() {
    const type = document.getElementById('editType').value;
    const category = document.getElementById('editCategory');
    
    const incomeCategories = ['حقوق', 'پاداش', 'سرمایه گذاری', 'سایر'];
    const expenseCategories = ['غذا', 'حمل و نقل', 'خرید', 'قبض', 'تفریح', 'بهداشت', 'آموزش', 'سایر'];
    
    const categories = type === 'income' ? incomeCategories : expenseCategories;
    
    category.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

// افزودن تراکنش
async function handleAddTransaction(e) {
    e.preventDefault();

    const transaction = {
        type: document.getElementById('type').value,
        category: document.getElementById('category').value,
        description: document.getElementById('description').value,
        amount: parseFloat(document.getElementById('amount').value),
        date: document.getElementById('date').value,
        timestamp: Date.now()
    };

    try {
        await budgetDB.addTransaction(transaction);
        await loadTransactions();
        updateUI();
        transactionForm.reset();
        document.getElementById('date').valueAsDate = new Date();
        showNotification('تراکنش با موفقیت اضافه شد', 'success');
    } catch (error) {
        console.error('خطا در افزودن تراکنش:', error);
        showNotification('خطا در افزودن تراکنش', 'error');
    }
}

// ویرایش تراکنش
function openEditModal(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    editingId = id;
    document.getElementById('editType').value = transaction.type;
    updateEditCategoryOptions();
    document.getElementById('editCategory').value = transaction.category;
    document.getElementById('editDescription').value = transaction.description;
    document.getElementById('editAmount').value = transaction.amount;
    document.getElementById('editDate').value = transaction.date;

    modal.style.display = 'block';
}

async function handleEditTransaction(e) {
    e.preventDefault();

    const transaction = {
        type: document.getElementById('editType').value,
        category: document.getElementById('editCategory').value,
        description: document.getElementById('editDescription').value,
        amount: parseFloat(document.getElementById('editAmount').value),
        date: document.getElementById('editDate').value,
        timestamp: Date.now()
    };

    try {
        await budgetDB.updateTransaction(editingId, transaction);
        await loadTransactions();
        updateUI();
        modal.style.display = 'none';
        showNotification('تراکنش با موفقیت ویرایش شد', 'success');
    } catch (error) {
        console.error('خطا در ویرایش تراکنش:', error);
        showNotification('خطا در ویرایش تراکنش', 'error');
    }
}

// حذف تراکنش
async function deleteTransaction(id) {
    if (!confirm('آیا از حذف این تراکنش اطمینان دارید؟')) return;

    try {
        await budgetDB.deleteTransaction(id);
        await loadTransactions();
        updateUI();
        showNotification('تراکنش با موفقیت حذف شد', 'success');
    } catch (error) {
        console.error('خطا در حذف تراکنش:', error);
        showNotification('خطا در حذف تراکنش', 'error');
    }
}

// به‌روزرسانی رابط کاربری
function updateUI() {
    updateSummary();
    displayTransactions();
    updateChart();
}

// به‌روزرسانی خلاصه
function updateSummary() {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expense;

    totalIncomeEl.textContent = formatCurrency(income);
    totalExpenseEl.textContent = formatCurrency(expense);
    balanceEl.textContent = formatCurrency(balance);
    balanceEl.style.color = balance >= 0 ? '#10b981' : '#ef4444';
}

// نمایش تراکنش‌ها
function displayTransactions() {
    let filteredTransactions = transactions;

    // فیلتر بر اساس نوع
    if (currentFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.type === currentFilter);
    }

    // جستجو
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filteredTransactions = filteredTransactions.filter(t =>
            t.description.toLowerCase().includes(searchTerm) ||
            t.category.toLowerCase().includes(searchTerm)
        );
    }

    if (filteredTransactions.length === 0) {
        transactionsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p>تراکنشی یافت نشد</p>
                <p class="empty-hint">فیلتر یا جستجوی دیگری امتحان کنید</p>
            </div>
        `;
        return;
    }

    transactionsList.innerHTML = filteredTransactions.map(transaction => `
        <div class="transaction-item ${transaction.type}">
            <div class="transaction-info">
                <div class="transaction-header">
                    <span class="transaction-description">${transaction.description}</span>
                    <span class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'} ${formatCurrency(transaction.amount)}
                    </span>
                </div>
                <div class="transaction-meta">
                    <span class="transaction-category">📁 ${transaction.category}</span>
                    <span class="transaction-date">📅 ${formatDate(transaction.date)}</span>
                </div>
            </div>
            <div class="transaction-actions">
                <button class="action-btn edit-btn" onclick="openEditModal(${transaction.id})">✏️ ویرایش</button>
                <button class="action-btn delete-btn" onclick="deleteTransaction(${transaction.id})">🗑️ حذف</button>
            </div>
        </div>
    `).join('');
}

// به‌روزرسانی نمودار
function updateChart() {
    if (currentChart) {
        currentChart.destroy();
    }

    const ctx = chartCanvas.getContext('2d');

    if (currentChartType === 'pie') {
        drawPieChart(ctx);
    } else if (currentChartType === 'bar') {
        drawBarChart(ctx);
    } else if (currentChartType === 'line') {
        drawLineChart(ctx);
    }
}

// نمودار دایره‌ای
function drawPieChart(ctx) {
    const expensesByCategory = {};
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        });

    const labels = Object.keys(expensesByCategory);
    const data = Object.values(expensesByCategory);

    if (labels.length === 0) {
        drawEmptyChart(ctx);
        return;
    }

    currentChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', 
                    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    rtl: true,
                    labels: {
                        font: {
                            family: 'Vazirmatn',
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + formatCurrency(context.parsed);
                        }
                    },
                    rtl: true,
                    bodyFont: {
                        family: 'Vazirmatn'
                    }
                }
            }
        }
    });
}

// نمودار میله‌ای
function drawBarChart(ctx) {
    const incomeByCategory = {};
    const expenseByCategory = {};

    transactions.forEach(t => {
        if (t.type === 'income') {
            incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
        } else {
            expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
        }
    });

    const allCategories = [...new Set([...Object.keys(incomeByCategory), ...Object.keys(expenseByCategory)])];

    if (allCategories.length === 0) {
        drawEmptyChart(ctx);
        return;
    }

    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: allCategories,
            datasets: [
                {
                    label: 'درآمد',
                    data: allCategories.map(cat => incomeByCategory[cat] || 0),
                    backgroundColor: '#10b981'
                },
                {
                    label: 'هزینه',
                    data: allCategories.map(cat => expenseByCategory[cat] || 0),
                    backgroundColor: '#ef4444'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    rtl: true,
                    labels: {
                        font: {
                            family: 'Vazirmatn',
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    },
                    rtl: true,
                    bodyFont: {
                        family: 'Vazirmatn'
                    }
                }
            },
            scales: {
                x: {
                    reverse: true,
                    ticks: {
                        font: {
                            family: 'Vazirmatn'
                        }
                    }
                },
                y: {
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        },
                        font: {
                            family: 'Vazirmatn'
                        }
                    }
                }
            }
        }
    });
}

// نمودار خطی
function drawLineChart(ctx) {
    const monthlyData = {};
    
    transactions.forEach(t => {
        const monthKey = t.date.substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
            monthlyData[monthKey].income += t.amount;
        } else {
            monthlyData[monthKey].expense += t.amount;
        }
    });

    const sortedMonths = Object.keys(monthlyData).sort();

    if (sortedMonths.length === 0) {
        drawEmptyChart(ctx);
        return;
    }

    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedMonths.map(m => formatMonth(m)),
            datasets: [
                {
                    label: 'درآمد',
                    data: sortedMonths.map(m => monthlyData[m].income),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'هزینه',
                    data: sortedMonths.map(m => monthlyData[m].expense),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    rtl: true,
                    labels: {
                        font: {
                            family: 'Vazirmatn',
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    },
                    rtl: true,
                    bodyFont: {
                        family: 'Vazirmatn'
                    }
                }
            },
            scales: {
                x: {
                    reverse: true,
                    ticks: {
                        font: {
                            family: 'Vazirmatn'
                        }
                    }
                },
                y: {
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        },
                        font: {
                            family: 'Vazirmatn'
                        }
                    }
                }
            }
        }
    });
}

// نمودار خالی
function drawEmptyChart(ctx) {
    ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    ctx.font = '16px Vazirmatn';
    ctx.fillStyle = '#9ca3af';
    ctx.textAlign = 'center';
    ctx.fillText('داده‌ای برای نمایش وجود ندارد', chartCanvas.width / 2, chartCanvas.height / 2);
}

// خروجی CSV
function exportToCSV() {
    if (transactions.length === 0) {
        alert('تراکنشی برای خروجی وجود ندارد');
        return;
    }

    const headers = ['نوع', 'دسته بندی', 'توضیحات', 'مبلغ (تومان)', 'تاریخ'];
    const rows = transactions.map(t => [
        t.type === 'income' ? 'درآمد' : 'هزینه',
        t.category,
        t.description,
        t.amount,
        formatDate(t.date)
    ]);

    const csvContent = [
        '\ufeff' + headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `budget-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    showNotification('فایل با موفقیت دانلود شد', 'success');
}

// پاک کردن همه داده‌ها
async function clearAllData() {
    if (!confirm('آیا از پاک کردن تمام داده‌ها اطمینان دارید؟ این عمل قابل بازگشت نیست!')) return;

    try {
        await budgetDB.clearAll();
        await loadTransactions();
        updateUI();
        showNotification('تمام داده‌ها پاک شدند', 'success');
    } catch (error) {
        console.error('خطا در پاک کردن داده‌ها:', error);
        showNotification('خطا در پاک کردن داده‌ها', 'error');
    }
}

// توابع کمکی
function formatCurrency(amount) {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR').format(date);
}

function formatMonth(monthString) {
    const [year, month] = monthString.split('-');
    const date = new Date(year, month - 1);
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long' }).format(date);
}

function showNotification(message, type) {
    // ایجاد نوتیفیکیشن ساده
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 15px 30px;
        border-radius: 10px;
        font-family: Vazirmatn;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        animation: slideDown 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// راه‌اندازی برنامه
initApp();

