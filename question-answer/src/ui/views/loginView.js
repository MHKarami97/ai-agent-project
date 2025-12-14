/**
 * Login View
 */
import { createElement, clearElement, $ } from '../../core/dom.js';
import { UserService } from '../../domain/services/userService.js';
import { toast } from '../../core/toast.js';
import { handleAsync, getErrorMessage } from '../../core/error.js';
import { eventBus } from '../../core/eventBus.js';

export class LoginView {
    constructor(container) {
        this.container = container;
        this.userService = new UserService();
    }

    async render() {
        clearElement(this.container);

        const form = createElement('div', { className: 'card', style: { maxWidth: '400px', margin: '2rem auto' } },
            createElement('h2', { style: { marginBottom: '1.5rem', textAlign: 'center' } }, 'ورود به سیستم'),
            createElement('form', {
                onsubmit: (e) => this.handleSubmit(e)
            },
                createElement('div', { className: 'form-group' },
                    createElement('label', { className: 'form-label', for: 'username' }, 'نام کاربری'),
                    createElement('input', {
                        type: 'text',
                        id: 'username',
                        className: 'form-input',
                        required: true,
                        autofocus: true,
                        placeholder: 'نام کاربری خود را وارد کنید',
                        'aria-label': 'نام کاربری'
                    })
                ),
                createElement('button', {
                    type: 'submit',
                    className: 'btn btn-primary',
                    style: { width: '100%' }
                }, 'ورود')
            )
        );

        this.container.appendChild(form);
        
        // Focus on input
        setTimeout(() => {
            const input = $('#username', this.container);
            if (input) input.focus();
        }, 100);
    }

    async handleSubmit(e) {
        e.preventDefault();
        const username = $('#username', this.container).value.trim();

        if (!username) {
            toast.error('لطفاً نام کاربری را وارد کنید');
            return;
        }

        const result = await handleAsync(() => this.userService.loginOrCreateUser(username));
        
        if (result.isOk()) {
            const user = result.data;
            eventBus.emit('user:loggedIn', user);
            toast.success(`خوش آمدید ${user.displayName}`);
            window.location.hash = '#/questions';
        } else {
            toast.error(getErrorMessage(result.error));
        }
    }
}
