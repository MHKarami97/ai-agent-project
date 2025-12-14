/**
 * Toast notification system
 */
import { createElement, $ } from './dom.js';

const TOAST_DURATION = 3000;

class ToastManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        this.container = $('#toastContainer');
        if (!this.container) {
            this.container = createElement('div', { id: 'toastContainer', className: 'toast-container' });
            document.body.appendChild(this.container);
        }
    }

    /**
     * Show a toast message
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, info)
     * @param {number} duration - Duration in ms
     */
    show(message, type = 'info', duration = TOAST_DURATION) {
        const toast = createElement('div', {
            className: `toast toast-${type}`,
            role: 'alert'
        },
            createElement('span', { className: 'toast-message' }, message),
            createElement('button', {
                className: 'toast-close',
                'aria-label': 'بستن',
                onclick: () => this.remove(toast)
            }, '×')
        );

        this.container.appendChild(toast);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => this.remove(toast), duration);
        }

        return toast;
    }

    /**
     * Remove a toast
     * @param {HTMLElement} toast - Toast element
     */
    remove(toast) {
        if (toast && toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }

    success(message, duration = TOAST_DURATION) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = TOAST_DURATION) {
        return this.show(message, 'error', duration);
    }

    info(message, duration = TOAST_DURATION) {
        return this.show(message, 'info', duration);
    }
}

export const toast = new ToastManager();
