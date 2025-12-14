import { DOM } from '../../core/dom.js';
import { VoteButtons } from '../components/voteButtons.js';
import { eventBus } from '../../core/eventBus.js';
import { Toast } from '../../core/toast.js';
import { Validator } from '../../core/validation.js';

export class QuestionDetailView {
    constructor(questionService, answerService, userService, currentUser) {
        this.questionService = questionService;
        this.answerService = answerService;
        this.userService = userService;
        this.currentUser = currentUser;
        this.question = null;
        this.answers = [];
        this.authors = new Map();
        this.userVotes = new Map();
    }

    async render(params) {
        const questionId = params.id;
        if (!questionId) {
            return DOM.create('div', { className: 'empty-state' }, 'شناسه سوال نامعتبر است');
        }

        const container = DOM.create('div', { className: 'question-detail' });

        // Load question
        const questionResult = await this.questionService.getById(questionId, true);
        if (!questionResult.isOk() || !questionResult.data) {
            return DOM.create('div', { className: 'empty-state' }, questionResult.error?.message || 'سوال یافت نشد');
        }

        this.question = questionResult.data;
        await this.loadAuthors();

        // Question card
        const questionCard = this.renderQuestion();
        container.appendChild(questionCard);

        // Answers section
        const answersSection = DOM.create('div', { className: 'answers-section' });
        const answersTitle = DOM.create('h2', {}, `پاسخ‌ها (${this.answers.length})`);
        answersSection.appendChild(answersTitle);

        const answersContainer = DOM.create('div', { id: 'answers-container' });
        answersSection.appendChild(answersContainer);

        // Answer form
        if (this.currentUser) {
            const answerForm = this.renderAnswerForm();
            answersSection.appendChild(answerForm);
        }

        container.appendChild(answersSection);

        await this.loadAnswers();
        await this.loadUserVotes();

        // Update question vote buttons after loading votes
        const questionCard = container.querySelector('.card');
        if (questionCard && this.question) {
            const voteSection = questionCard.querySelector('.vote-section');
            if (voteSection) {
                const newVoteSection = VoteButtons.render(
                    this.userVotes.get(`question_${this.question.id}`),
                    this.question.votesScore,
                    (value) => this.voteQuestion(value)
                );
                voteSection.parentNode.replaceChild(newVoteSection, voteSection);
            }
        }

        // Update answer vote buttons
        const answersContainer = DOM.$('#answers-container');
        if (answersContainer) {
            const answerItems = answersContainer.querySelectorAll('.answer-item');
            answerItems.forEach((item, index) => {
                const answer = this.answers[index];
                if (answer) {
                    const voteSection = item.querySelector('.vote-section');
                    if (voteSection) {
                        const newVoteSection = VoteButtons.render(
                            this.userVotes.get(`answer_${answer.id}`),
                            answer.votesScore,
                            (value) => this.voteAnswer(answer.id, value)
                        );
                        voteSection.parentNode.replaceChild(newVoteSection, voteSection);
                    }
                }
            });
        }

        return container;
    }

    renderQuestion() {
        const card = DOM.create('div', { className: 'card' });
        const author = this.authors.get(this.question.authorId);

        const header = DOM.create('div', { className: 'card-header' });
        const title = DOM.create('h1', { className: 'card-title' }, this.question.title);

        const actions = DOM.create('div');
        if (this.currentUser && this.currentUser.canEditQuestion(this.question)) {
            const editBtn = DOM.create('button', {
                className: 'btn btn-secondary btn-small',
                'aria-label': 'ویرایش سوال'
            }, 'ویرایش');
            editBtn.addEventListener('click', () => this.editQuestion());

            const deleteBtn = DOM.create('button', {
                className: 'btn btn-danger btn-small',
                'aria-label': 'حذف سوال'
            }, 'حذف');
            deleteBtn.addEventListener('click', () => this.deleteQuestion());

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
        }
        header.appendChild(title);
        header.appendChild(actions);
        card.appendChild(header);

        const voteSection = VoteButtons.render(
            this.userVotes.get(`question_${this.question.id}`),
            this.question.votesScore,
            (value) => this.voteQuestion(value)
        );
        card.appendChild(voteSection);

        const body = DOM.create('div', { className: 'question-body' }, this.question.body);
        card.appendChild(body);

        const meta = DOM.create('div', { className: 'question-meta' });
        meta.innerHTML = `
            <span>نویسنده: ${author ? author.displayName : 'ناشناس'}</span>
            <span>تاریخ: ${new Date(this.question.createdAt).toLocaleDateString('fa-IR')}</span>
            <span>بازدید: ${this.question.views || 0}</span>
            ${this.question.department ? `<span>دپارتمان: ${this.question.department}</span>` : ''}
        `;
        card.appendChild(meta);

        if (this.question.tags && this.question.tags.length > 0) {
            const tagsDiv = DOM.create('div', { className: 'question-tags' });
            this.question.tags.forEach(tag => {
                const tagEl = DOM.create('span', { className: 'tag' }, tag);
                tagsDiv.appendChild(tagEl);
            });
            card.appendChild(tagsDiv);
        }

        return card;
    }

    async loadAnswers() {
        const container = DOM.$('#answers-container');
        if (!container) return;

        const result = await this.answerService.getByQuestionId(this.question.id);
        if (!result.isOk()) {
            container.innerHTML = `<div class="empty-state">${result.error.message}</div>`;
            return;
        }

        this.answers = result.data;
        await this.loadUserVotes();
        await this.loadAnswerAuthors();

        if (this.answers.length === 0) {
            container.innerHTML = '<div class="empty-state">هنوز پاسخی ثبت نشده است</div>';
            return;
        }

        // Sort: accepted first
        const sortedAnswers = [...this.answers].sort((a, b) => {
            if (a.id === this.question.acceptedAnswerId) return -1;
            if (b.id === this.question.acceptedAnswerId) return 1;
            return b.votesScore - a.votesScore;
        });

        container.innerHTML = '';
        sortedAnswers.forEach(answer => {
            const answerEl = this.renderAnswer(answer);
            container.appendChild(answerEl);
        });
    }

    renderAnswer(answer) {
        const answerEl = DOM.create('div', {
            className: `answer-item ${answer.id === this.question.acceptedAnswerId ? 'accepted' : ''}`,
            'data-answer-id': answer.id
        });

        if (answer.id === this.question.acceptedAnswerId) {
            const badge = DOM.create('div', { className: 'accepted-badge' }, 'پاسخ پذیرفته شده');
            answerEl.appendChild(badge);
        }

        const voteSection = VoteButtons.render(
            this.userVotes.get(`answer_${answer.id}`),
            answer.votesScore,
            (value) => this.voteAnswer(answer.id, value)
        );
        answerEl.appendChild(voteSection);

        const body = DOM.create('div', { className: 'answer-body' }, answer.body);
        answerEl.appendChild(body);

        const author = this.authors.get(answer.authorId);
        const meta = DOM.create('div', { className: 'answer-meta' });
        const metaLeft = DOM.create('div');
        metaLeft.innerHTML = `
            <span>${author ? author.displayName : 'ناشناس'}</span>
            <span>${new Date(answer.createdAt).toLocaleDateString('fa-IR')}</span>
        `;

        const metaRight = DOM.create('div');
        if (this.currentUser && this.currentUser.canAcceptAnswer(this.question)) {
            if (answer.id !== this.question.acceptedAnswerId) {
                const acceptBtn = DOM.create('button', {
                    className: 'btn btn-success btn-small',
                    'aria-label': 'پذیرش پاسخ'
                }, 'پذیرش پاسخ');
                acceptBtn.addEventListener('click', () => this.acceptAnswer(answer.id));
                metaRight.appendChild(acceptBtn);
            }
        }

        if (this.currentUser && this.currentUser.canEditAnswer(answer)) {
            const editBtn = DOM.create('button', {
                className: 'btn btn-secondary btn-small',
                'aria-label': 'ویرایش پاسخ'
            }, 'ویرایش');
            editBtn.addEventListener('click', () => this.editAnswer(answer));

            const deleteBtn = DOM.create('button', {
                className: 'btn btn-danger btn-small',
                'aria-label': 'حذف پاسخ'
            }, 'حذف');
            deleteBtn.addEventListener('click', () => this.deleteAnswer(answer.id));

            metaRight.appendChild(editBtn);
            metaRight.appendChild(deleteBtn);
        }

        meta.appendChild(metaLeft);
        meta.appendChild(metaRight);
        answerEl.appendChild(meta);

        return answerEl;
    }

    renderAnswerForm() {
        const form = DOM.create('form', {
            id: 'answer-form',
            'aria-label': 'فرم پاسخ'
        });

        const bodyGroup = DOM.create('div', { className: 'form-group' });
        const bodyLabel = DOM.create('label', {
            className: 'form-label',
            htmlFor: 'answer-body'
        }, 'پاسخ شما:');
        const bodyTextarea = DOM.create('textarea', {
            id: 'answer-body',
            className: 'form-textarea',
            required: true,
            'aria-required': 'true'
        });
        bodyGroup.appendChild(bodyLabel);
        bodyGroup.appendChild(bodyTextarea);
        form.appendChild(bodyGroup);

        const submitBtn = DOM.create('button', {
            type: 'submit',
            className: 'btn btn-primary'
        }, 'ارسال پاسخ');
        form.appendChild(submitBtn);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const body = bodyTextarea.value.trim();

            const validation = Validator.validateAnswer({ body });

            if (!validation.isValid) {
                Toast.error(Object.values(validation.errors)[0]);
                return;
            }

            const result = await this.answerService.create({
                questionId: this.question.id,
                body,
                authorId: this.currentUser.id
            });

            if (result.isOk()) {
                Toast.success('پاسخ با موفقیت ثبت شد');
                bodyTextarea.value = '';
                await this.loadAnswers();
                eventBus.emit('answer:created');
            } else {
                Toast.error(result.error.message || 'خطا در ثبت پاسخ');
            }
        });

        return form;
    }

    async voteQuestion(value) {
        if (!this.currentUser) {
            Toast.warning('لطفاً ابتدا وارد شوید');
            return;
        }

        const result = await this.questionService.vote(this.question.id, this.currentUser.id, value);
        if (result.isOk()) {
            this.question.votesScore = result.data.score;
            await this.loadUserVotes();
            // Update vote buttons
            const voteSection = DOM.$('.question-detail .vote-section');
            if (voteSection && this.question) {
                const newVoteSection = VoteButtons.render(
                    this.userVotes.get(`question_${this.question.id}`),
                    this.question.votesScore,
                    (val) => this.voteQuestion(val)
                );
                voteSection.parentNode.replaceChild(newVoteSection, voteSection);
            }
        } else {
            Toast.error(result.error.message || 'خطا در ثبت رای');
        }
    }

    async voteAnswer(answerId, value) {
        if (!this.currentUser) {
            Toast.warning('لطفاً ابتدا وارد شوید');
            return;
        }

        const result = await this.answerService.vote(answerId, this.currentUser.id, value);
        if (result.isOk()) {
            // Update answer score
            const answer = this.answers.find(a => a.id === answerId);
            if (answer) {
                answer.votesScore = result.data.score;
            }
            await this.loadUserVotes();
            // Update vote buttons for this answer
            const answersContainer = DOM.$('#answers-container');
            if (answersContainer) {
                const answerItem = answersContainer.querySelector(`[data-answer-id="${answerId}"]`);
                if (answerItem && answer) {
                    const voteSection = answerItem.querySelector('.vote-section');
                    if (voteSection) {
                        const newVoteSection = VoteButtons.render(
                            this.userVotes.get(`answer_${answerId}`),
                            answer.votesScore,
                            (val) => this.voteAnswer(answerId, val)
                        );
                        voteSection.parentNode.replaceChild(newVoteSection, voteSection);
                    }
                }
            }
        } else {
            Toast.error(result.error.message || 'خطا در ثبت رای');
        }
    }

    async acceptAnswer(answerId) {
        if (!this.currentUser) return;

        const result = await this.questionService.acceptAnswer(this.question.id, answerId, this.currentUser);
        if (result.isOk()) {
            this.question.acceptedAnswerId = answerId;
            Toast.success('پاسخ با موفقیت پذیرفته شد');
            await this.loadAnswers();
        } else {
            Toast.error(result.error.message || 'خطا در پذیرش پاسخ');
        }
    }

    async deleteQuestion() {
        if (!confirm('آیا از حذف این سوال اطمینان دارید؟')) return;

        const result = await this.questionService.delete(this.question.id, this.currentUser);
        if (result.isOk()) {
            Toast.success('سوال با موفقیت حذف شد');
            eventBus.emit('question:deleted');
        } else {
            Toast.error(result.error.message || 'خطا در حذف سوال');
        }
    }

    async deleteAnswer(answerId) {
        if (!confirm('آیا از حذف این پاسخ اطمینان دارید؟')) return;

        const result = await this.answerService.delete(answerId, this.currentUser);
        if (result.isOk()) {
            Toast.success('پاسخ با موفقیت حذف شد');
            await this.loadAnswers();
        } else {
            Toast.error(result.error.message || 'خطا در حذف پاسخ');
        }
    }

    editQuestion() {
        // TODO: Implement edit question
        Toast.info('قابلیت ویرایش سوال به زودی اضافه می‌شود');
    }

    editAnswer(answer) {
        // TODO: Implement edit answer
        Toast.info('قابلیت ویرایش پاسخ به زودی اضافه می‌شود');
    }

    async loadUserVotes() {
        if (!this.currentUser) return;

        // Load question vote
        if (this.question) {
            const voteRepo = this.questionService.getVoteRepo();
            if (voteRepo) {
                const voteResult = await voteRepo.getByUserAndTarget(
                    this.currentUser.id, 'question', this.question.id
                );
                if (voteResult.isOk() && voteResult.data) {
                    this.userVotes.set(`question_${this.question.id}`, voteResult.data.value);
                }
            }
        }

        // Load answer votes
        const voteRepo = this.answerService.getVoteRepo();
        if (voteRepo) {
            for (const answer of this.answers) {
                const voteResult = await voteRepo.getByUserAndTarget(
                    this.currentUser.id, 'answer', answer.id
                );
                if (voteResult.isOk() && voteResult.data) {
                    this.userVotes.set(`answer_${answer.id}`, voteResult.data.value);
                }
            }
        }
    }

    async loadAuthors() {
        if (this.question && !this.authors.has(this.question.authorId)) {
            const userResult = await this.userService.getById(this.question.authorId);
            if (userResult.isOk() && userResult.data) {
                this.authors.set(this.question.authorId, userResult.data);
            }
        }
    }

    async loadAnswerAuthors() {
        for (const answer of this.answers) {
            if (!this.authors.has(answer.authorId)) {
                const userResult = await this.userService.getById(answer.authorId);
                if (userResult.isOk() && userResult.data) {
                    this.authors.set(answer.authorId, userResult.data);
                }
            }
        }
    }
}

