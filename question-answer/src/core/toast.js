import { DOM } from './dom.js';

export class Toast {
    static show(message, type = 'info', duration = 3000) {
        const container = DOM.$('#toast-container');
        if (!container) return;

        const toast = DOM.create('div', {
            className: `toast ${type}`,
            role: 'alert',
            'aria-live': 'assertive'
        });

        const messageEl = DOM.create('div', {
            className: 'toast-message'
        }, message);

        toast.appendChild(messageEl);
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                DOM.remove(toast);
            }, 300);
        }, duration);
    }

    static success(message) {
        this.show(message, 'success');
    }

    static error(message) {
        this.show(message, 'error');
    }

    static warning(message) {
        this.show(message, 'warning');
    }

    static info(message) {
        this.show(message, 'info');
    }
}

