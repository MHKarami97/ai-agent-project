import { DOM } from '../../core/dom.js';
import { eventBus } from '../../core/eventBus.js';
import { Toast } from '../../core/toast.js';
import { Validator } from '../../core/validation.js';

export class AdminView {
    constructor(userService, db, exportImportService) {
        this.userService = userService;
        this.db = db;
        this.exportImportService = exportImportService;
        this.users = [];
    }

    async render() {
        const container = DOM.create('div', { className: 'admin-section' });

        const title = DOM.create('h1', { className: 'card-title' }, 'پنل مدیریت');
        container.appendChild(title);

        const actions = DOM.create('div', { className: 'admin-actions' });

        const exportBtn = DOM.create('button', {
            className: 'btn btn-primary',
            'aria-label': 'خروجی JSON'
        }, 'خروجی JSON');
        exportBtn.addEventListener('click', () => this.exportData());
        actions.appendChild(exportBtn);

        const importBtn = DOM.create('button', {
            className: 'btn btn-secondary',
            'aria-label': 'وارد کردن JSON'
        }, 'وارد کردن JSON');
        importBtn.addEventListener('click', () => this.importData());
        actions.appendChild(importBtn);

        const clearBtn = DOM.create('button', {
            className: 'btn btn-danger',
            'aria-label': 'پاک‌سازی دیتابیس'
        }, 'پاک‌سازی دیتابیس');
        clearBtn.addEventListener('click', () => this.clearDatabase());
        actions.appendChild(clearBtn);

        container.appendChild(actions);

        // Users section
        const usersSection = DOM.create('div');
        const usersTitle = DOM.create('h2', {}, 'مدیریت کاربران');
        usersSection.appendChild(usersTitle);

        const addUserBtn = DOM.create('button', {
            className: 'btn btn-primary',
            style: 'margin-bottom: 1rem;'
        }, 'افزودن کاربر جدید');
        addUserBtn.addEventListener('click', () => this.showAddUserForm());
        usersSection.appendChild(addUserBtn);

        const usersTable = DOM.create('table', { className: 'users-table' });
        usersTable.innerHTML = `
            <thead>
                <tr>
                    <th>نام کاربری</th>
                    <th>نام نمایشی</th>
                    <th>نقش</th>
                    <th>دپارتمان</th>
                    <th>عملیات</th>
                </tr>
            </thead>
            <tbody id="users-tbody"></tbody>
        `;
        usersSection.appendChild(usersTable);

        container.appendChild(usersSection);

        await this.loadUsers();

        return container;
    }

    async loadUsers() {
        const tbody = DOM.$('#users-tbody');
        if (!tbody) return;

        const result = await this.userService.getAll();
        if (!result.isOk()) {
            Toast.error(result.error.message);
            return;
        }

        this.users = result.data;
        tbody.innerHTML = '';

        this.users.forEach(user => {
            const row = DOM.create('tr');
            row.innerHTML = `
                <td>${DOM.safeHTML(user.username)}</td>
                <td>${DOM.safeHTML(user.displayName)}</td>
                <td>${DOM.safeHTML(user.role)}</td>
                <td>${DOM.safeHTML(user.department || '-')}</td>
                <td>
                    <button class="btn btn-danger btn-small delete-user" data-id="${user.id}">حذف</button>
                </td>
            `;

            const deleteBtn = row.querySelector('.delete-user');
            deleteBtn.addEventListener('click', () => this.deleteUser(user.id));

            tbody.appendChild(row);
        });
    }

    showAddUserForm() {
        const username = prompt('نام کاربری:');
        if (!username || !username.trim()) return;

        const displayName = prompt('نام نمایشی:', username);
        if (!displayName || !displayName.trim()) return;

        const role = prompt('نقش (Admin/Moderator/Employee):', 'Employee');
        if (!['Admin', 'Moderator', 'Employee'].includes(role)) {
            Toast.error('نقش نامعتبر است');
            return;
        }

        const department = prompt('دپارتمان (اختیاری):', '');

        const data = {
            username: username.trim(),
            displayName: displayName.trim(),
            role,
            department: department.trim() || undefined
        };

        const validation = Validator.validateUser(data);
        if (!validation.isValid) {
            Toast.error(Object.values(validation.errors)[0]);
            return;
        }

        this.createUser(data);
    }

    async createUser(data) {
        const result = await this.userService.create(data);
        if (result.isOk()) {
            Toast.success('کاربر با موفقیت ایجاد شد');
            await this.loadUsers();
        } else {
            Toast.error(result.error.message || 'خطا در ایجاد کاربر');
        }
    }

    async deleteUser(id) {
        if (!confirm('آیا از حذف این کاربر اطمینان دارید؟')) return;

        const result = await this.userService.delete(id);
        if (result.isOk()) {
            Toast.success('کاربر با موفقیت حذف شد');
            await this.loadUsers();
        } else {
            Toast.error(result.error.message || 'خطا در حذف کاربر');
        }
    }

    async exportData() {
        const result = await this.exportImportService.export();
        if (result.isOk()) {
            const dataStr = JSON.stringify(result.data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = DOM.create('a', { href: url, download: `qa-export-${Date.now()}.json` });
            a.click();
            URL.revokeObjectURL(url);
            Toast.success('داده‌ها با موفقیت خروجی گرفته شد');
        } else {
            Toast.error(result.error.message || 'خطا در خروجی گرفتن');
        }
    }

    async importData() {
        const input = DOM.create('input', { type: 'file', accept: '.json' });
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const text = await file.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (error) {
                Toast.error('فایل JSON نامعتبر است');
                return;
            }

            const mode = confirm('آیا می‌خواهید داده‌های موجود را جایگزین کنید؟ (OK = جایگزین، Cancel = ادغام)') ? 'replace' : 'merge';

            const result = await this.exportImportService.import(data, mode);
            if (result.isOk()) {
                Toast.success('داده‌ها با موفقیت وارد شد');
                eventBus.emit('data:imported');
            } else {
                Toast.error(result.error.message || 'خطا در وارد کردن داده‌ها');
            }
        });
        input.click();
    }

    async clearDatabase() {
        if (!confirm('آیا از پاک‌سازی کامل دیتابیس اطمینان دارید؟ این عمل غیرقابل بازگشت است!')) return;

        try {
            await this.db.clearAll();
            Toast.success('دیتابیس با موفقیت پاک شد');
            eventBus.emit('database:cleared');
        } catch (error) {
            Toast.error('خطا در پاک‌سازی دیتابیس');
        }
    }
}

