export class Validator {
    static validateQuestion(data) {
        const errors = {};

        if (!data.title || data.title.trim().length === 0) {
            errors.title = 'عنوان سوال الزامی است';
        } else if (data.title.trim().length < 5) {
            errors.title = 'عنوان سوال باید حداقل 5 کاراکتر باشد';
        }

        if (!data.body || data.body.trim().length === 0) {
            errors.body = 'متن سوال الزامی است';
        } else if (data.body.trim().length < 10) {
            errors.body = 'متن سوال باید حداقل 10 کاراکتر باشد';
        }

        if (data.tags && Array.isArray(data.tags)) {
            if (data.tags.length > 5) {
                errors.tags = 'حداکثر 5 تگ مجاز است';
            }
            if (data.tags.some(tag => !tag || tag.trim().length === 0)) {
                errors.tags = 'تگ‌ها نمی‌توانند خالی باشند';
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    static validateAnswer(data) {
        const errors = {};

        if (!data.body || data.body.trim().length === 0) {
            errors.body = 'متن پاسخ الزامی است';
        } else if (data.body.trim().length < 10) {
            errors.body = 'متن پاسخ باید حداقل 10 کاراکتر باشد';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    static validateUser(data) {
        const errors = {};

        if (!data.username || data.username.trim().length === 0) {
            errors.username = 'نام کاربری الزامی است';
        } else if (data.username.trim().length < 3) {
            errors.username = 'نام کاربری باید حداقل 3 کاراکتر باشد';
        }

        if (!data.displayName || data.displayName.trim().length === 0) {
            errors.displayName = 'نام نمایشی الزامی است';
        }

        const validRoles = ['Admin', 'Moderator', 'Employee'];
        if (!data.role || !validRoles.includes(data.role)) {
            errors.role = 'نقش کاربری معتبر نیست';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
}

