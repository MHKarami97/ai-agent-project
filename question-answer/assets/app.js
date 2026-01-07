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


// سیستم مدیریت داده‌ها
class DataManager {
    constructor() {
        this.storageKey = 'qa_system_data';
        this.currentUser = localStorage.getItem('qa_current_user') || '';
    }

    getData() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : { questions: [] };
    }

    saveData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    setCurrentUser(username) {
        this.currentUser = username;
        localStorage.setItem('qa_current_user', username);
    }

    getCurrentUser() {
        return this.currentUser;
    }

    addQuestion(text) {
        const data = this.getData();
        const question = {
            id: Date.now().toString(),
            text: text,
            author: this.currentUser,
            createdAt: new Date().toISOString(),
            answers: []
        };
        data.questions.push(question);
        this.saveData(data);
        return question;
    }

    addAnswer(questionId, text) {
        const data = this.getData();
        const question = data.questions.find(q => q.id === questionId);
        if (question) {
            const answer = {
                id: Date.now().toString(),
                text: text,
                author: this.currentUser,
                createdAt: new Date().toISOString()
            };
            question.answers.push(answer);
            this.saveData(data);
            return answer;
        }
    }

    updateQuestion(questionId, newText) {
        const data = this.getData();
        const question = data.questions.find(q => q.id === questionId);
        if (question && question.author === this.currentUser) {
            question.text = newText;
            question.updatedAt = new Date().toISOString();
            this.saveData(data);
            return true;
        }
        return false;
    }

    updateAnswer(questionId, answerId, newText) {
        const data = this.getData();
        const question = data.questions.find(q => q.id === questionId);
        if (question) {
            const answer = question.answers.find(a => a.id === answerId);
            if (answer && answer.author === this.currentUser) {
                answer.text = newText;
                answer.updatedAt = new Date().toISOString();
                this.saveData(data);
                return true;
            }
        }
        return false;
    }

    deleteQuestion(questionId) {
        const data = this.getData();
        const question = data.questions.find(q => q.id === questionId);
        if (question && question.author === this.currentUser) {
            data.questions = data.questions.filter(q => q.id !== questionId);
            this.saveData(data);
            return true;
        }
        return false;
    }

    deleteAnswer(questionId, answerId) {
        const data = this.getData();
        const question = data.questions.find(q => q.id === questionId);
        if (question) {
            const answer = question.answers.find(a => a.id === answerId);
            if (answer && answer.author === this.currentUser) {
                question.answers = question.answers.filter(a => a.id !== answerId);
                this.saveData(data);
                return true;
            }
        }
        return false;
    }

    exportData() {
        const data = this.getData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qa_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // اعتبارسنجی ساختار داده
                    if (!importedData || !Array.isArray(importedData.questions)) {
                        reject(new Error('فرمت فایل نامعتبر است. فایل باید شامل یک آرایه questions باشد.'));
                        return;
                    }

                    // اعتبارسنجی ساختار سوالات
                    for (const question of importedData.questions) {
                        if (!question.id || !question.text || !question.author || !question.createdAt) {
                            reject(new Error('ساختار داده‌های وارد شده نامعتبر است.'));
                            return;
                        }
                        if (!Array.isArray(question.answers)) {
                            question.answers = [];
                        }
                    }

                    // ذخیره داده‌های وارد شده
                    this.saveData(importedData);
                    resolve(importedData);
                } catch (error) {
                    reject(new Error('خطا در خواندن فایل JSON: ' + error.message));
                }
            };
            reader.onerror = () => reject(new Error('خطا در خواندن فایل'));
            reader.readAsText(file);
        });
    }
}

// سیستم نمایش UI
class UI {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.editingQuestionId = null;
        this.editingAnswerId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUsername();
        this.renderQuestions();
    }

    setupEventListeners() {
        document.getElementById('setUsername').addEventListener('click', () => this.setUsername());
        document.getElementById('submitQuestion').addEventListener('click', () => this.submitQuestion());
        document.getElementById('exportBtn').addEventListener('click', () => this.dataManager.exportData());
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        document.getElementById('importFile').addEventListener('change', (e) => this.handleImport(e));
        
        // Enter key برای ثبت نام کاربری
        document.getElementById('username').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.setUsername();
        });
    }

    loadUsername() {
        const username = this.dataManager.getCurrentUser();
        if (username) {
            document.getElementById('username').value = username;
        }
    }

    setUsername() {
        const username = document.getElementById('username').value.trim();
        if (username) {
            this.dataManager.setCurrentUser(username);
            alert(`نام کاربری "${username}" ثبت شد!`);
            this.renderQuestions();
        } else {
            alert('لطفا نام کاربری خود را وارد کنید');
        }
    }

    submitQuestion() {
        const username = this.dataManager.getCurrentUser();
        if (!username) {
            alert('لطفا ابتدا نام کاربری خود را وارد کنید');
            return;
        }

        const questionText = document.getElementById('questionInput').value.trim();
        if (!questionText) {
            alert('لطفا متن سوال را وارد کنید');
            return;
        }

        this.dataManager.addQuestion(questionText);
        document.getElementById('questionInput').value = '';
        this.renderQuestions();
    }

    renderQuestions() {
        const data = this.dataManager.getData();
        const questionsList = document.getElementById('questionsList');
        const currentUser = this.dataManager.getCurrentUser();

        if (data.questions.length === 0) {
            questionsList.innerHTML = `
                <div class="empty-state">
                    <h3>📝 هنوز سوالی پرسیده نشده</h3>
                    <p>اولین سوال را بپرسید!</p>
                </div>
            `;
            return;
        }

        questionsList.innerHTML = data.questions.map(question => 
            this.renderQuestion(question, currentUser)
        ).join('');

        // اضافه کردن event listeners برای هر سوال
        data.questions.forEach(question => {
            this.attachQuestionListeners(question);
        });
    }

    renderQuestion(question, currentUser) {
        const isOwner = question.author === currentUser;
        const canEdit = isOwner;
        const canDelete = isOwner;
        
        return `
            <div class="question-card" data-question-id="${question.id}">
                <div class="question-header">
                    <div class="question-content">
                        <div class="question-text" data-question-text="${question.id}">${this.escapeHtml(question.text)}</div>
                        <div class="question-meta">
                            <span class="question-author">👤 ${this.escapeHtml(question.author)}</span>
                            <span>🕐 ${this.formatDate(question.createdAt)}</span>
                            ${question.updatedAt ? `<span>✏️ ویرایش شده: ${this.formatDate(question.updatedAt)}</span>` : ''}
                        </div>
                    </div>
                    ${canEdit || canDelete ? `
                        <div class="question-actions">
                            ${canEdit ? `<button class="btn btn-edit edit-question-btn" data-question-id="${question.id}">✏️ ویرایش</button>` : ''}
                            ${canDelete ? `<button class="btn btn-danger delete-question-btn" data-question-id="${question.id}">🗑️ حذف</button>` : ''}
                        </div>
                    ` : ''}
                </div>
                
                <div class="answers-section">
                    <div class="answers-header">
                        💬 پاسخ‌ها (${question.answers.length})
                    </div>
                    <div class="answers-list" data-answers-list="${question.id}">
                        ${question.answers.map(answer => this.renderAnswer(question.id, answer, currentUser)).join('')}
                    </div>
                    
                    ${currentUser ? `
                        <div class="new-answer-section">
                            <textarea class="answer-input" data-question-id="${question.id}" placeholder="پاسخ خود را بنویسید..."></textarea>
                            <button class="btn btn-success btn-small submit-answer-btn" data-question-id="${question.id}">ارسال پاسخ</button>
                        </div>
                    ` : '<p style="color: #999; text-align: center; padding: 10px;">برای پاسخ دادن، ابتدا نام کاربری خود را وارد کنید</p>'}
                </div>
            </div>
        `;
    }

    renderAnswer(questionId, answer, currentUser) {
        const isOwner = answer.author === currentUser;
        
        return `
            <div class="answer-item" data-answer-id="${answer.id}" data-question-id="${questionId}">
                <div class="answer-text" data-answer-text="${answer.id}">${this.escapeHtml(answer.text)}</div>
                <div class="answer-meta">
                    <span class="answer-author">👤 ${this.escapeHtml(answer.author)}</span>
                    <div>
                        <span>🕐 ${this.formatDate(answer.createdAt)}</span>
                        ${answer.updatedAt ? `<span style="margin-right: 10px;">✏️ ویرایش شده</span>` : ''}
                        ${isOwner ? `
                            <button class="btn btn-edit btn-small edit-answer-btn" data-question-id="${questionId}" data-answer-id="${answer.id}">✏️</button>
                            <button class="btn btn-danger btn-small delete-answer-btn" data-question-id="${questionId}" data-answer-id="${answer.id}">🗑️</button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    attachQuestionListeners(question) {
        const questionCard = document.querySelector(`[data-question-id="${question.id}"]`);
        if (!questionCard) return;

        // دکمه ویرایش سوال
        const editBtn = questionCard.querySelector('.edit-question-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.editQuestion(question.id));
        }

        // دکمه حذف سوال
        const deleteBtn = questionCard.querySelector('.delete-question-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteQuestion(question.id));
        }

        // دکمه ارسال پاسخ
        const submitAnswerBtn = questionCard.querySelector('.submit-answer-btn');
        if (submitAnswerBtn) {
            submitAnswerBtn.addEventListener('click', () => this.submitAnswer(question.id));
        }

        // Enter key برای ارسال پاسخ
        const answerInput = questionCard.querySelector('.answer-input');
        if (answerInput) {
            answerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.submitAnswer(question.id);
                }
            });
        }

        // Event listeners برای جواب‌ها
        question.answers.forEach(answer => {
            const editAnswerBtn = questionCard.querySelector(`.edit-answer-btn[data-answer-id="${answer.id}"]`);
            if (editAnswerBtn) {
                editAnswerBtn.addEventListener('click', () => this.editAnswer(question.id, answer.id));
            }

            const deleteAnswerBtn = questionCard.querySelector(`.delete-answer-btn[data-answer-id="${answer.id}"]`);
            if (deleteAnswerBtn) {
                deleteAnswerBtn.addEventListener('click', () => this.deleteAnswer(question.id, answer.id));
            }
        });
    }

    submitAnswer(questionId) {
        const username = this.dataManager.getCurrentUser();
        if (!username) {
            alert('لطفا ابتدا نام کاربری خود را وارد کنید');
            return;
        }

        const answerInput = document.querySelector(`.answer-input[data-question-id="${questionId}"]`);
        const answerText = answerInput.value.trim();
        
        if (!answerText) {
            alert('لطفا متن پاسخ را وارد کنید');
            return;
        }

        this.dataManager.addAnswer(questionId, answerText);
        answerInput.value = '';
        this.renderQuestions();
    }

    editQuestion(questionId) {
        if (this.editingQuestionId) {
            this.cancelEdit();
        }

        const questionCard = document.querySelector(`[data-question-id="${questionId}"]`);
        const questionTextEl = questionCard.querySelector(`[data-question-text="${questionId}"]`);
        const currentText = questionTextEl.textContent;

        questionTextEl.outerHTML = `
            <div class="edit-mode" data-question-edit="${questionId}">
                <textarea class="edit-textarea" data-question-edit-text="${questionId}">${this.escapeHtml(currentText)}</textarea>
                <div class="edit-actions">
                    <button class="btn btn-save save-question-btn" data-question-id="${questionId}">💾 ذخیره</button>
                    <button class="btn btn-cancel cancel-edit-btn" data-question-id="${questionId}">❌ انصراف</button>
                </div>
            </div>
        `;

        this.editingQuestionId = questionId;

        const saveBtn = questionCard.querySelector('.save-question-btn');
        const cancelBtn = questionCard.querySelector('.cancel-edit-btn');

        saveBtn.addEventListener('click', () => this.saveQuestion(questionId));
        cancelBtn.addEventListener('click', () => this.cancelEdit());
    }

    saveQuestion(questionId) {
        const questionCard = document.querySelector(`[data-question-id="${questionId}"]`);
        const editTextarea = questionCard.querySelector(`[data-question-edit-text="${questionId}"]`);
        const newText = editTextarea.value.trim();

        if (!newText) {
            alert('متن سوال نمی‌تواند خالی باشد');
            return;
        }

        if (this.dataManager.updateQuestion(questionId, newText)) {
            this.editingQuestionId = null;
            this.renderQuestions();
        } else {
            alert('شما اجازه ویرایش این سوال را ندارید');
        }
    }

    editAnswer(questionId, answerId) {
        if (this.editingAnswerId) {
            this.cancelEdit();
        }

        const answerItem = document.querySelector(`[data-answer-id="${answerId}"]`);
        const answerTextEl = answerItem.querySelector(`[data-answer-text="${answerId}"]`);
        const currentText = answerTextEl.textContent;

        answerTextEl.outerHTML = `
            <div class="edit-mode" data-answer-edit="${answerId}">
                <textarea class="edit-textarea" data-answer-edit-text="${answerId}">${this.escapeHtml(currentText)}</textarea>
                <div class="edit-actions">
                    <button class="btn btn-save save-answer-btn" data-question-id="${questionId}" data-answer-id="${answerId}">💾 ذخیره</button>
                    <button class="btn btn-cancel cancel-edit-btn" data-answer-id="${answerId}">❌ انصراف</button>
                </div>
            </div>
        `;

        this.editingAnswerId = answerId;

        const saveBtn = answerItem.querySelector('.save-answer-btn');
        const cancelBtn = answerItem.querySelector('.cancel-edit-btn');

        saveBtn.addEventListener('click', () => this.saveAnswer(questionId, answerId));
        cancelBtn.addEventListener('click', () => this.cancelEdit());
    }

    saveAnswer(questionId, answerId) {
        const answerItem = document.querySelector(`[data-answer-id="${answerId}"]`);
        const editTextarea = answerItem.querySelector(`[data-answer-edit-text="${answerId}"]`);
        const newText = editTextarea.value.trim();

        if (!newText) {
            alert('متن پاسخ نمی‌تواند خالی باشد');
            return;
        }

        if (this.dataManager.updateAnswer(questionId, answerId, newText)) {
            this.editingAnswerId = null;
            this.renderQuestions();
        } else {
            alert('شما اجازه ویرایش این پاسخ را ندارید');
        }
    }

    cancelEdit() {
        if (this.editingQuestionId) {
            this.editingQuestionId = null;
        }
        if (this.editingAnswerId) {
            this.editingAnswerId = null;
        }
        this.renderQuestions();
    }

    deleteQuestion(questionId) {
        if (confirm('آیا مطمئن هستید که می‌خواهید این سوال را حذف کنید؟')) {
            if (this.dataManager.deleteQuestion(questionId)) {
                this.renderQuestions();
            } else {
                alert('شما اجازه حذف این سوال را ندارید');
            }
        }
    }

    deleteAnswer(questionId, answerId) {
        if (confirm('آیا مطمئن هستید که می‌خواهید این پاسخ را حذف کنید؟')) {
            if (this.dataManager.deleteAnswer(questionId, answerId)) {
                this.renderQuestions();
            } else {
                alert('شما اجازه حذف این پاسخ را ندارید');
            }
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'همین الان';
        if (minutes < 60) return `${minutes} دقیقه پیش`;
        if (hours < 24) return `${hours} ساعت پیش`;
        if (days < 7) return `${days} روز پیش`;
        
        return date.toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        // بررسی نوع فایل
        if (!file.name.endsWith('.json')) {
            alert('لطفا یک فایل JSON انتخاب کنید');
            event.target.value = '';
            return;
        }

        // تایید از کاربر برای جایگزینی داده‌ها
        const currentData = this.dataManager.getData();
        const hasExistingData = currentData.questions && currentData.questions.length > 0;
        
        let confirmMessage = 'آیا مطمئن هستید که می‌خواهید داده‌ها را وارد کنید؟';
        if (hasExistingData) {
            confirmMessage = '⚠️ هشدار: با وارد کردن داده‌های جدید، تمام داده‌های فعلی جایگزین خواهند شد.\n\nآیا مطمئن هستید؟';
        }

        if (!confirm(confirmMessage)) {
            event.target.value = '';
            return;
        }

        try {
            await this.dataManager.importData(file);
            alert('✅ داده‌ها با موفقیت وارد شدند!');
            this.renderQuestions();
        } catch (error) {
            alert('❌ خطا در وارد کردن داده‌ها: ' + error.message);
        } finally {
            // پاک کردن مقدار input برای امکان انتخاب مجدد همان فایل
            event.target.value = '';
        }
    }
}

// راه‌اندازی برنامه
document.addEventListener('DOMContentLoaded', () => {
    const dataManager = new DataManager();
    const ui = new UI(dataManager);
});

