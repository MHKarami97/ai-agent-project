/**
 * Admin View
 */
import { createElement, clearElement, $ } from '../../core/dom.js';
import { UserService } from '../../domain/services/userService.js';
import { dbClient } from '../../data/indexeddb.js';
import { exportData, importData } from '../../data/exportImport.js';
import { toast } from '../../core/toast.js';
import { handleAsync, getErrorMessage } from '../../core/error.js';
import { ValidationError } from '../../core/validation.js';
import { eventBus } from '../../core/eventBus.js';

export class AdminView {
    constructor(container) {
        this.container = container;
        this.userService = new UserService();
        this.currentUser = null;
    }

    setCurrentUser(user) {
        this.currentUser = user;
    }

    async render() {
        if (!this.currentUser || !this.currentUser.isAdmin()) {
            clearElement(this.container);
            this.container.appendChild(createElement('div', { className: 'empty-state' }, 'دسترسی غیرمجاز'));
            return;
        }

        clearElement(this.container);

        const adminPanel = createElement('div', {},
            createElement('h1', { style: { marginBottom: '2rem' } }, 'پنل مدیریت'),
            
            // Users Management Section
            createElement('div', { className: 'card', style: { marginBottom: '2rem' } },
                createElement('h2', { style: { marginBottom: '1rem' } }, 'مدیریت کاربران'),
                createElement('div', { id: 'usersList' }, 'در حال بارگذاری...')
            ),

            // Database Management Section
            createElement('div', { className: 'card', style: { marginBottom: '2rem' } },
                createElement('h2', { style: { marginBottom: '1rem' } }, 'مدیریت پایگاه داده'),
                createElement('div', { style: { display: 'flex', gap: '1rem', flexWrap: 'wrap' } },
                    createElement('button', {
                        className: 'btn btn-danger',
                        onclick: () => this.handleClearDatabase()
                    }, 'پاک‌سازی کل پایگاه داده'),
                    createElement('button', {
                        className: 'btn btn-primary',
                        onclick: () => this.handleExport()
                    }, 'خروجی JSON'),
                    createElement('label', {
                        className: 'btn btn-primary',
                        style: { cursor: 'pointer' }
                    },
                        'ورودی JSON',
                        createElement('input', {
                            type: 'file',
                            accept: '.json',
                            style: { display: 'none' },
                            onchange: (e) => this.handleImport(e)
                        })
                    )
                )
            )
        );

        this.container.appendChild(adminPanel);
        await this.loadUsers();
    }

    async loadUsers() {
        const usersList = $('#usersList', this.container);
        if (!usersList) return;

        usersList.textContent = 'در حال بارگذاری...';

        const result = await handleAsync(() => this.userService.getAllUsers());

        if (result.isFail()) {
            usersList.textContent = 'خطا در بارگذاری کاربران';
            toast.error(getErrorMessage(result.error));
            return;
        }

        const users = result.data;
        clearElement(usersList);

        if (users.length === 0) {
            usersList.appendChild(createElement('div', { className: 'empty-state' }, 'هیچ کاربری یافت نشد'));
            return;
        }

        const table = createElement('table', {
            style: { width: '100%', borderCollapse: 'collapse' }
        },
            createElement('thead', {},
                createElement('tr', {},
                    createElement('th', { style: { padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid var(--border-color)' } }, 'نام کاربری'),
                    createElement('th', { style: { padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid var(--border-color)' } }, 'نام نمایشی'),
                    createElement('th', { style: { padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid var(--border-color)' } }, 'نقش'),
                    createElement('th', { style: { padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid var(--border-color)' } }, 'دپارتمان'),
                    createElement('th', { style: { padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid var(--border-color)' } }, 'عملیات')
                )
            ),
            createElement('tbody', {},
                ...users.map(user => createElement('tr', { key: user.id },
                    createElement('td', { style: { padding: '0.5rem', borderBottom: '1px solid var(--border-color)' } }, user.username),
                    createElement('td', { style: { padding: '0.5rem', borderBottom: '1px solid var(--border-color)' } }, user.displayName),
                    createElement('td', { style: { padding: '0.5rem', borderBottom: '1px solid var(--border-color)' } }, user.role),
                    createElement('td', { style: { padding: '0.5rem', borderBottom: '1px solid var(--border-color)' } }, user.department || '-'),
                    createElement('td', { style: { padding: '0.5rem', borderBottom: '1px solid var(--border-color)' } },
                        createElement('button', {
                            className: 'btn btn-sm btn-danger',
                            onclick: () => {
                                if (confirm(`آیا از حذف کاربر ${user.username} اطمینان دارید؟`)) {
                                    this.handleDeleteUser(user.id);
                                }
                            },
                            disabled: user.id === this.currentUser.id
                        }, 'حذف')
                    )
                ))
            )
        );

        usersList.appendChild(table);
    }

    async handleDeleteUser(userId) {
        const result = await handleAsync(() => this.userService.deleteUser(userId));

        if (result.isOk()) {
            toast.success('کاربر حذف شد');
            this.loadUsers();
        } else {
            toast.error(getErrorMessage(result.error));
        }
    }

    async handleClearDatabase() {
        if (!confirm('آیا از پاک‌سازی کامل پایگاه داده اطمینان دارید؟ این عمل غیرقابل بازگشت است!')) {
            return;
        }

        const result = await handleAsync(() => dbClient.clearAll());

        if (result.isOk()) {
            toast.success('پایگاه داده پاک شد');
            eventBus.emit('user:loggedOut');
            window.location.hash = '#/login';
        } else {
            toast.error(getErrorMessage(result.error));
        }
    }

    async handleExport() {
        try {
            const result = await handleAsync(() => exportData());
            if (result.isOk()) {
                const dataStr = JSON.stringify(result.data, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = createElement('a', {
                    href: url,
                    download: `qa-system-export-${new Date().toISOString().split('T')[0]}.json`
                });
                link.click();
                URL.revokeObjectURL(url);
                toast.success('داده‌ها با موفقیت خروجی گرفته شد');
            } else {
                toast.error(getErrorMessage(result.error));
            }
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    }

    async handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!confirm('آیا می‌خواهید داده‌های فعلی را با داده‌های فایل جایگزین کنید؟')) {
                return;
            }

            const result = await handleAsync(() => importData(data, 'replace'));

            if (result.isOk()) {
                toast.success('داده‌ها با موفقیت وارد شد');
                eventBus.emit('data:imported');
                window.location.reload();
            } else {
                toast.error(getErrorMessage(result.error));
            }
        } catch (error) {
            toast.error('خطا در خواندن فایل: ' + getErrorMessage(error));
        }

        // Reset file input
        e.target.value = '';
    }
}
