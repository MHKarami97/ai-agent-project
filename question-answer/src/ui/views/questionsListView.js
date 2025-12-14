/**
 * Questions List View
 */
import { createElement, clearElement } from '../../core/dom.js';
import { QuestionService } from '../../domain/services/questionService.js';
import { UserService } from '../../domain/services/userService.js';
import { VoteRepository } from '../../data/repositories/voteRepository.js';
import { createQuestionCard } from '../components/questionCard.js';
import { toast } from '../../core/toast.js';
import { handleAsync, getErrorMessage } from '../../core/error.js';
import { eventBus } from '../../core/eventBus.js';

export class QuestionsListView {
    constructor(container) {
        this.container = container;
        this.questionService = new QuestionService();
        this.userService = new UserService();
        this.voteRepo = new VoteRepository();
        this.currentUser = null;
        this.currentPage = 1;
        this.pageSize = 10;
        this.filters = {
            sortBy: 'createdAt',
            sortOrder: 'desc',
            tag: null,
            department: null,
            search: null
        };
    }

    setCurrentUser(user) {
        this.currentUser = user;
    }

    async render() {
        clearElement(this.container);

        // Show loading
        const loading = createElement('div', { className: 'loading' }, 'در حال بارگذاری...');
        this.container.appendChild(loading);

        // Load questions
        const result = await handleAsync(() => 
            this.questionService.getQuestions({
                page: this.currentPage,
                pageSize: this.pageSize,
                ...this.filters
            })
        );

        clearElement(this.container);

        if (result.isFail()) {
            toast.error(getErrorMessage(result.error));
            this.container.appendChild(createElement('div', { className: 'empty-state' }, 'خطا در بارگذاری سوال‌ها'));
            return;
        }

        const { questions, total } = result.data;
        const totalPages = Math.ceil(total / this.pageSize);

        // Create filters
        const filtersSection = this.createFiltersSection();
        this.container.appendChild(filtersSection);

        // Create questions list
        if (questions.length === 0) {
            this.container.appendChild(createElement('div', { className: 'empty-state' }, 'هیچ سوالی یافت نشد'));
        } else {
            const questionsList = createElement('div', { id: 'questionsList' });
            
            // Load authors for questions
            const authorsMap = await this.loadAuthors(questions);
            
            // Load user votes
            const userVotesMap = this.currentUser ? await this.loadUserVotes(questions) : {};

            for (const question of questions) {
                const author = authorsMap[question.authorId];
                const userVote = userVotesMap[question.id];
                const card = createQuestionCard(
                    question,
                    author,
                    this.currentUser,
                    userVote,
                    (qId, value) => this.handleVote(qId, value),
                    (q) => this.handleEdit(q),
                    (qId) => this.handleDelete(qId)
                );
                questionsList.appendChild(card);
            }

            this.container.appendChild(questionsList);

            // Create pagination
            if (totalPages > 1) {
                const pagination = this.createPagination(totalPages);
                this.container.appendChild(pagination);
            }
        }
    }

    createFiltersSection() {
        return createElement('div', { className: 'filters' },
            createElement('div', { className: 'filters-row' },
                createElement('div', { className: 'form-group' },
                    createElement('label', { className: 'form-label' }, 'جستجو'),
                    createElement('input', {
                        type: 'text',
                        className: 'form-input',
                        placeholder: 'جستجو در عنوان سوال‌ها...',
                        value: this.filters.search || '',
                        oninput: (e) => {
                            this.filters.search = e.target.value || null;
                            this.currentPage = 1;
                            this.render();
                        }
                    })
                ),
                createElement('div', { className: 'form-group' },
                    createElement('label', { className: 'form-label' }, 'مرتب‌سازی'),
                    createElement('select', {
                        className: 'form-select',
                        value: `${this.filters.sortBy}-${this.filters.sortOrder}`,
                        onchange: (e) => {
                            const [sortBy, sortOrder] = e.target.value.split('-');
                            this.filters.sortBy = sortBy;
                            this.filters.sortOrder = sortOrder;
                            this.currentPage = 1;
                            this.render();
                        }
                    },
                        createElement('option', { value: 'createdAt-desc' }, 'جدیدترین'),
                        createElement('option', { value: 'createdAt-asc' }, 'قدیمی‌ترین'),
                        createElement('option', { value: 'votesScore-desc' }, 'بیشترین رای'),
                        createElement('option', { value: 'votesScore-asc' }, 'کمترین رای')
                    )
                ),
                createElement('div', { className: 'form-group' },
                    createElement('label', { className: 'form-label' }, 'تگ'),
                    createElement('input', {
                        type: 'text',
                        className: 'form-input',
                        placeholder: 'فیلتر بر اساس تگ...',
                        value: this.filters.tag || '',
                        oninput: (e) => {
                            this.filters.tag = e.target.value || null;
                            this.currentPage = 1;
                            this.render();
                        }
                    })
                ),
                createElement('div', { className: 'form-group' },
                    createElement('label', { className: 'form-label' }, 'دپارتمان'),
                    createElement('input', {
                        type: 'text',
                        className: 'form-input',
                        placeholder: 'فیلتر بر اساس دپارتمان...',
                        value: this.filters.department || '',
                        oninput: (e) => {
                            this.filters.department = e.target.value || null;
                            this.currentPage = 1;
                            this.render();
                        }
                    })
                )
            )
        );
    }

    createPagination(totalPages) {
        const pagination = createElement('div', { className: 'pagination' });

        // Previous button
        pagination.appendChild(createElement('button', {
            className: 'pagination-btn',
            disabled: this.currentPage === 1,
            onclick: () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.render();
                }
            }
        }, 'قبلی'));

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                pagination.appendChild(createElement('button', {
                    className: `pagination-btn ${i === this.currentPage ? 'active' : ''}`,
                    onclick: () => {
                        this.currentPage = i;
                        this.render();
                    }
                }, i));
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                pagination.appendChild(createElement('span', {}, '...'));
            }
        }

        // Next button
        pagination.appendChild(createElement('button', {
            className: 'pagination-btn',
            disabled: this.currentPage === totalPages,
            onclick: () => {
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.render();
                }
            }
        }, 'بعدی'));

        return pagination;
    }

    async loadAuthors(questions) {
        const authorIds = [...new Set(questions.map(q => q.authorId))];
        const authorsMap = {};
        
        for (const authorId of authorIds) {
            const result = await handleAsync(() => this.userService.getUserById(authorId));
            if (result.isOk() && result.data) {
                authorsMap[authorId] = result.data;
            }
        }
        
        return authorsMap;
    }

    async loadUserVotes(questions) {
        if (!this.currentUser) return {};
        
        const votesMap = {};
        for (const question of questions) {
            const result = await handleAsync(() => 
                this.voteRepo.findByUserAndTarget(this.currentUser.id, 'question', question.id)
            );
            if (result.isOk() && result.data) {
                votesMap[question.id] = result.data;
            }
        }
        return votesMap;
    }

    async handleVote(questionId, value) {
        if (!this.currentUser) {
            toast.error('لطفاً ابتدا وارد شوید');
            return;
        }

        const result = await handleAsync(() => 
            this.questionService.voteOnQuestion(questionId, this.currentUser.id, value)
        );

        if (result.isOk()) {
            toast.info('رای شما ثبت شد');
            this.render();
        } else {
            toast.error(getErrorMessage(result.error));
        }
    }

    handleEdit(question) {
        window.location.hash = `#/questions/${question.id}/edit`;
    }

    async handleDelete(questionId) {
        const result = await handleAsync(() => 
            this.questionService.deleteQuestion(questionId)
        );

        if (result.isOk()) {
            toast.success('سوال حذف شد');
            this.render();
        } else {
            toast.error(getErrorMessage(result.error));
        }
    }
}
