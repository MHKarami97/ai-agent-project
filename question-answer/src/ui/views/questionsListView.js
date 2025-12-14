import { DOM } from '../../core/dom.js';
import { QuestionCard } from '../components/questionCard.js';
import { eventBus } from '../../core/eventBus.js';

export class QuestionsListView {
    constructor(questionService, userService) {
        this.questionService = questionService;
        this.userService = userService;
        this.currentPage = 1;
        this.pageSize = 10;
        this.sortBy = 'newest';
        this.filters = {};
        this.questions = [];
        this.authors = new Map();
    }

    async render() {
        const container = DOM.create('div', { className: 'questions-list' });

        // Filters
        const filtersDiv = DOM.create('div', { className: 'filters' });

        const sortGroup = DOM.create('div', { className: 'filter-group' });
        const sortLabel = DOM.create('label', { className: 'form-label' }, 'مرتب‌سازی:');
        const sortSelect = DOM.create('select', {
            className: 'form-select',
            id: 'sort-select'
        });
        sortSelect.innerHTML = `
            <option value="newest">جدیدترین</option>
            <option value="votes">بیشترین رای</option>
            <option value="oldest">قدیمی‌ترین</option>
        `;
        sortSelect.value = this.sortBy;
        sortSelect.addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.loadQuestions();
        });
        sortGroup.appendChild(sortLabel);
        sortGroup.appendChild(sortSelect);
        filtersDiv.appendChild(sortGroup);

        const searchGroup = DOM.create('div', { className: 'filter-group' });
        const searchInput = DOM.create('input', {
            type: 'text',
            className: 'form-input',
            placeholder: 'جستجو در عنوان...',
            id: 'search-input'
        });
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filters.search = e.target.value.trim() || undefined;
                this.loadQuestions();
            }, 300);
        });
        searchGroup.appendChild(searchInput);
        filtersDiv.appendChild(searchGroup);

        const unansweredCheckbox = DOM.create('input', {
            type: 'checkbox',
            id: 'unanswered-filter'
        });
        const unansweredLabel = DOM.create('label', {
            htmlFor: 'unanswered-filter'
        }, 'فقط سوالات بدون پاسخ');
        unansweredCheckbox.addEventListener('change', (e) => {
            this.filters.unanswered = e.target.checked || undefined;
            this.loadQuestions();
        });
        filtersDiv.appendChild(unansweredCheckbox);
        filtersDiv.appendChild(unansweredLabel);

        container.appendChild(filtersDiv);

        // Questions container
        const questionsContainer = DOM.create('div', { id: 'questions-container' });
        container.appendChild(questionsContainer);

        // Pagination
        const paginationDiv = DOM.create('div', { className: 'pagination', id: 'pagination' });
        container.appendChild(paginationDiv);

        await this.loadQuestions();

        return container;
    }

    async loadQuestions() {
        const container = DOM.$('#questions-container');
        if (!container) return;

        container.innerHTML = '<div class="loading">در حال بارگذاری...</div>';

        const result = await this.questionService.getAll(this.sortBy, this.filters);
        if (!result.isOk()) {
            container.innerHTML = `<div class="empty-state">${result.error.message}</div>`;
            return;
        }

        this.questions = result.data;
        await this.loadAuthors();

        if (this.questions.length === 0) {
            container.innerHTML = '<div class="empty-state">سوالی یافت نشد</div>';
            return;
        }

        // Pagination
        const totalPages = Math.ceil(this.questions.length / this.pageSize);
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const paginatedQuestions = this.questions.slice(start, end);

        container.innerHTML = '';
        paginatedQuestions.forEach(question => {
            const author = this.authors.get(question.authorId);
            const card = QuestionCard.render(question, author);
            container.appendChild(card);
        });

        this.renderPagination(totalPages);
    }

    async loadAuthors() {
        const userIds = new Set(this.questions.map(q => q.authorId));
        for (const userId of userIds) {
            if (!this.authors.has(userId)) {
                const userResult = await this.userService.getById(userId);
                if (userResult.isOk() && userResult.data) {
                    this.authors.set(userId, userResult.data);
                }
            }
        }
    }

    renderPagination(totalPages) {
        const paginationDiv = DOM.$('#pagination');
        if (!paginationDiv || totalPages <= 1) {
            if (paginationDiv) paginationDiv.innerHTML = '';
            return;
        }

        paginationDiv.innerHTML = '';

        const prevBtn = DOM.create('button', {
            className: 'pagination-btn',
            disabled: this.currentPage === 1
        }, 'قبلی');
        prevBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadQuestions();
            }
        });
        paginationDiv.appendChild(prevBtn);

        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = DOM.create('button', {
                className: `pagination-btn ${i === this.currentPage ? 'active' : ''}`
            }, i.toString());
            pageBtn.addEventListener('click', () => {
                this.currentPage = i;
                this.loadQuestions();
            });
            paginationDiv.appendChild(pageBtn);
        }

        const nextBtn = DOM.create('button', {
            className: 'pagination-btn',
            disabled: this.currentPage === totalPages
        }, 'بعدی');
        nextBtn.addEventListener('click', () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.loadQuestions();
            }
        });
        paginationDiv.appendChild(nextBtn);
    }
}

