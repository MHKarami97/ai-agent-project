/**
 * New Question View
 */
import { createElement, clearElement, $ } from '../../core/dom.js';
import { QuestionService } from '../../domain/services/questionService.js';
import { parseTags } from '../../core/utils.js';
import { toast } from '../../core/toast.js';
import { handleAsync, getErrorMessage } from '../../core/error.js';
import { ValidationError } from '../../core/validation.js';

export class NewQuestionView {
    constructor(container) {
        this.container = container;
        this.questionService = new QuestionService();
        this.currentUser = null;
    }

    setCurrentUser(user) {
        this.currentUser = user;
    }

    render() {
        if (!this.currentUser) {
            clearElement(this.container);
            this.container.appendChild(createElement('div', { className: 'empty-state' }, 'لطفاً ابتدا وارد شوید'));
            return;
        }

        clearElement(this.container);

        const form = createElement('div', { className: 'card', style: { maxWidth: '800px', margin: '0 auto' } },
            createElement('h2', { style: { marginBottom: '1.5rem' } }, 'سوال جدید'),
            createElement('form', {
                onsubmit: (e) => this.handleSubmit(e)
            },
                createElement('div', { className: 'form-group' },
                    createElement('label', { className: 'form-label', for: 'title' }, 'عنوان سوال *'),
                    createElement('input', {
                        type: 'text',
                        id: 'title',
                        className: 'form-input',
                        required: true,
                        placeholder: 'عنوان سوال را وارد کنید',
                        'aria-label': 'عنوان سوال'
                    }),
                    createElement('div', { className: 'form-error', id: 'titleError' })
                ),
                createElement('div', { className: 'form-group' },
                    createElement('label', { className: 'form-label', for: 'body' }, 'متن سوال *'),
                    createElement('textarea', {
                        id: 'body',
                        className: 'form-textarea',
                        required: true,
                        placeholder: 'متن سوال را وارد کنید',
                        'aria-label': 'متن سوال'
                    }),
                    createElement('div', { className: 'form-error', id: 'bodyError' })
                ),
                createElement('div', { className: 'form-group' },
                    createElement('label', { className: 'form-label', for: 'tags' }, 'تگ‌ها (حداکثر 5 تگ، با کاما جدا کنید)'),
                    createElement('input', {
                        type: 'text',
                        id: 'tags',
                        className: 'form-input',
                        placeholder: 'مثال: javascript, react, frontend',
                        'aria-label': 'تگ‌ها'
                    }),
                    createElement('div', { className: 'form-error', id: 'tagsError' })
                ),
                createElement('div', { className: 'form-group' },
                    createElement('label', { className: 'form-label', for: 'department' }, 'دپارتمان (اختیاری)'),
                    createElement('input', {
                        type: 'text',
                        id: 'department',
                        className: 'form-input',
                        placeholder: 'نام دپارتمان',
                        'aria-label': 'دپارتمان'
                    })
                ),
                createElement('div', { className: 'form-group' },
                    createElement('label', { className: 'form-label', for: 'priority' }, 'سطح اهمیت'),
                    createElement('select', {
                        id: 'priority',
                        className: 'form-select',
                        'aria-label': 'سطح اهمیت'
                    },
                        createElement('option', { value: 'Low' }, 'کم'),
                        createElement('option', { value: 'Medium', selected: true }, 'متوسط'),
                        createElement('option', { value: 'High' }, 'زیاد')
                    )
                ),
                createElement('div', { style: { display: 'flex', gap: '1rem', justifyContent: 'flex-end' } },
                    createElement('button', {
                        type: 'button',
                        className: 'btn btn-secondary',
                        onclick: () => {
                            window.location.hash = '#/questions';
                        }
                    }, 'انصراف'),
                    createElement('button', {
                        type: 'submit',
                        className: 'btn btn-primary'
                    }, 'ایجاد سوال')
                )
            )
        );

        this.container.appendChild(form);
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        // Clear previous errors
        ['titleError', 'bodyError', 'tagsError'].forEach(id => {
            const errorEl = $(`#${id}`, this.container);
            if (errorEl) errorEl.textContent = '';
        });

        const title = $('#title', this.container).value.trim();
        const body = $('#body', this.container).value.trim();
        const tagsString = $('#tags', this.container).value.trim();
        const department = $('#department', this.container).value.trim() || null;
        const priority = $('#priority', this.container).value;

        try {
            const tags = parseTags(tagsString);
            
            const result = await handleAsync(() => 
                this.questionService.createQuestion({
                    title,
                    body,
                    tags,
                    department,
                    priority
                }, this.currentUser.id)
            );

            if (result.isOk()) {
                toast.success('سوال با موفقیت ایجاد شد');
                window.location.hash = `#/questions/${result.data.id}`;
            } else {
                if (result.error instanceof ValidationError) {
                    const errorEl = $(`#${result.error.field}Error`, this.container);
                    if (errorEl) {
                        errorEl.textContent = result.error.message;
                    } else {
                        toast.error(result.error.message);
                    }
                } else {
                    toast.error(getErrorMessage(result.error));
                }
            }
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    }
}
