import { DOM } from '../../core/dom.js';
import { eventBus } from '../../core/eventBus.js';
import { Toast } from '../../core/toast.js';

export class LoginView {
    constructor(userService) {
        this.userService = userService;
    }

    render() {
        const container = DOM.create('div', { className: 'login-container' });
        const card = DOM.create('div', { className: 'card' });

        const title = DOM.create('h1', { className: 'card-title' }, 'ورود به سیستم');
        card.appendChild(title);

        const form = DOM.create('form', {
            id: 'login-form',
            'aria-label': 'فرم ورود'
        });

        const usernameGroup = DOM.create('div', { className: 'form-group' });
        const usernameLabel = DOM.create('label', {
            className: 'form-label',
            htmlFor: 'username'
        }, 'نام کاربری');
        const usernameInput = DOM.create('input', {
            type: 'text',
            id: 'username',
            className: 'form-input',
            required: true,
            autocomplete: 'username',
            'aria-required': 'true'
        });
        usernameGroup.appendChild(usernameLabel);
        usernameGroup.appendChild(usernameInput);
        form.appendChild(usernameGroup);

        const submitBtn = DOM.create('button', {
            type: 'submit',
            className: 'btn btn-primary',
            style: 'width: 100%; margin-top: 1rem;'
        }, 'ورود');
        form.appendChild(submitBtn);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = usernameInput.value.trim();
            if (!username) {
                Toast.error('لطفاً نام کاربری را وارد کنید');
                return;
            }

            const result = await this.userService.login(username);
            if (result.isOk()) {
                eventBus.emit('user:logged-in', result.data);
                Toast.success('ورود موفقیت‌آمیز بود');
            } else {
                Toast.error(result.error.message || 'خطا در ورود');
            }
        });

        card.appendChild(form);
        container.appendChild(card);

        return container;
    }
}

