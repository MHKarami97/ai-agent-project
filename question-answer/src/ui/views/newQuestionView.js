import { DOM } from '../../core/dom.js';
import { eventBus } from '../../core/eventBus.js';
import { Toast } from '../../core/toast.js';
import { Validator } from '../../core/validation.js';

export class NewQuestionView {
    constructor(questionService, currentUser) {
        this.questionService = questionService;
        this.currentUser = currentUser;
    }

    render() {
        if (!this.currentUser) {
            return DOM.create('div', { className: 'empty-state' }, 'لطفاً ابتدا وارد شوید');
        }

        const container = DOM.create('div');
        const card = DOM.create('div', { className: 'card' });

        const title = DOM.create('h1', { className: 'card-title' }, 'سوال جدید');
        card.appendChild(title);

        const form = DOM.create('form', {
            id: 'new-question-form',
            'aria-label': 'فرم سوال جدید'
        });

        const titleGroup = DOM.create('div', { className: 'form-group' });
        const titleLabel = DOM.create('label', {
            className: 'form-label',
            htmlFor: 'question-title'
        }, 'عنوان سوال:');
        const titleInput = DOM.create('input', {
            type: 'text',
            id: 'question-title',
            className: 'form-input',
            required: true,
            'aria-required': 'true'
        });
        titleGroup.appendChild(titleLabel);
        titleGroup.appendChild(titleInput);
        form.appendChild(titleGroup);

        const bodyGroup = DOM.create('div', { className: 'form-group' });
        const bodyLabel = DOM.create('label', {
            className: 'form-label',
            htmlFor: 'question-body'
        }, 'متن سوال:');
        const bodyTextarea = DOM.create('textarea', {
            id: 'question-body',
            className: 'form-textarea',
            required: true,
            'aria-required': 'true'
        });
        bodyGroup.appendChild(bodyLabel);
        bodyGroup.appendChild(bodyTextarea);
        form.appendChild(bodyGroup);

        const tagsGroup = DOM.create('div', { className: 'form-group' });
        const tagsLabel = DOM.create('label', {
            className: 'form-label',
            htmlFor: 'question-tags'
        }, 'تگ‌ها (با کاما جدا کنید، حداکثر 5 تگ):');
        const tagsInput = DOM.create('input', {
            type: 'text',
            id: 'question-tags',
            className: 'form-input',
            placeholder: 'مثال: javascript, html, css'
        });
        tagsGroup.appendChild(tagsLabel);
        tagsGroup.appendChild(tagsInput);
        form.appendChild(tagsGroup);

        const departmentGroup = DOM.create('div', { className: 'form-group' });
        const departmentLabel = DOM.create('label', {
            className: 'form-label',
            htmlFor: 'question-department'
        }, 'دپارتمان (اختیاری):');
        const departmentInput = DOM.create('input', {
            type: 'text',
            id: 'question-department',
            className: 'form-input'
        });
        departmentGroup.appendChild(departmentLabel);
        departmentGroup.appendChild(departmentInput);
        form.appendChild(departmentGroup);

        const priorityGroup = DOM.create('div', { className: 'form-group' });
        const priorityLabel = DOM.create('label', {
            className: 'form-label',
            htmlFor: 'question-priority'
        }, 'سطح اهمیت:');
        const prioritySelect = DOM.create('select', {
            id: 'question-priority',
            className: 'form-select'
        });
        prioritySelect.innerHTML = `
            <option value="Low">کم</option>
            <option value="Medium" selected>متوسط</option>
            <option value="High">زیاد</option>
        `;
        priorityGroup.appendChild(priorityLabel);
        priorityGroup.appendChild(prioritySelect);
        form.appendChild(priorityGroup);

        const submitBtn = DOM.create('button', {
            type: 'submit',
            className: 'btn btn-primary',
            style: 'width: 100%;'
        }, 'ثبت سوال');
        form.appendChild(submitBtn);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const tags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t.length > 0);

            const data = {
                title: titleInput.value.trim(),
                body: bodyTextarea.value.trim(),
                tags,
                department: departmentInput.value.trim() || undefined,
                priority: prioritySelect.value,
                authorId: this.currentUser.id
            };

            const validation = Validator.validateQuestion(data);
            if (!validation.isValid) {
                const firstError = Object.values(validation.errors)[0];
                Toast.error(firstError);
                return;
            }

            const result = await this.questionService.create(data);
            if (result.isOk()) {
                Toast.success('سوال با موفقیت ثبت شد');
                eventBus.emit('question:created', result.data);
            } else {
                Toast.error(result.error.message || 'خطا در ثبت سوال');
            }
        });

        card.appendChild(form);
        container.appendChild(card);

        return container;
    }
}

