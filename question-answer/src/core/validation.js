/**
 * Validation utilities
 */

export class ValidationError extends Error {
    constructor(message, field) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}

/**
 * Validate question data
 * @param {Object} data - Question data
 * @throws {ValidationError}
 */
export function validateQuestion(data) {
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
        throw new ValidationError('عنوان سوال الزامی است', 'title');
    }

    if (data.title.trim().length < 10) {
        throw new ValidationError('عنوان سوال باید حداقل 10 کاراکتر باشد', 'title');
    }

    if (data.title.trim().length > 200) {
        throw new ValidationError('عنوان سوال نباید بیشتر از 200 کاراکتر باشد', 'title');
    }

    if (!data.body || typeof data.body !== 'string' || data.body.trim().length === 0) {
        throw new ValidationError('متن سوال الزامی است', 'body');
    }

    if (data.body.trim().length < 20) {
        throw new ValidationError('متن سوال باید حداقل 20 کاراکتر باشد', 'body');
    }

    if (data.tags && Array.isArray(data.tags)) {
        if (data.tags.length > 5) {
            throw new ValidationError('حداکثر 5 تگ مجاز است', 'tags');
        }

        data.tags.forEach(tag => {
            if (typeof tag !== 'string' || tag.trim().length === 0) {
                throw new ValidationError('تگ‌ها باید رشته غیر خالی باشند', 'tags');
            }
        });
    }

    if (data.priority && !['Low', 'Medium', 'High'].includes(data.priority)) {
        throw new ValidationError('سطح اهمیت باید Low، Medium یا High باشد', 'priority');
    }
}

/**
 * Validate answer data
 * @param {Object} data - Answer data
 * @throws {ValidationError}
 */
export function validateAnswer(data) {
    if (!data.body || typeof data.body !== 'string' || data.body.trim().length === 0) {
        throw new ValidationError('متن پاسخ الزامی است', 'body');
    }

    if (data.body.trim().length < 10) {
        throw new ValidationError('متن پاسخ باید حداقل 10 کاراکتر باشد', 'body');
    }

    if (!data.questionId) {
        throw new ValidationError('شناسه سوال الزامی است', 'questionId');
    }
}

/**
 * Validate user data
 * @param {Object} data - User data
 * @throws {ValidationError}
 */
export function validateUser(data) {
    if (!data.username || typeof data.username !== 'string' || data.username.trim().length === 0) {
        throw new ValidationError('نام کاربری الزامی است', 'username');
    }

    if (data.username.trim().length < 3) {
        throw new ValidationError('نام کاربری باید حداقل 3 کاراکتر باشد', 'username');
    }

    if (data.username.trim().length > 50) {
        throw new ValidationError('نام کاربری نباید بیشتر از 50 کاراکتر باشد', 'username');
    }

    if (!/^[a-zA-Z0-9_]+$/.test(data.username.trim())) {
        throw new ValidationError('نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد و زیرخط باشد', 'username');
    }

    if (data.role && !['Admin', 'Moderator', 'Employee'].includes(data.role)) {
        throw new ValidationError('نقش باید Admin، Moderator یا Employee باشد', 'role');
    }
}

/**
 * Sanitize string input
 * @param {string} input - Input string
 * @returns {string} - Sanitized string
 */
export function sanitizeString(input) {
    if (typeof input !== 'string') return '';
    return input.trim();
}

/**
 * Sanitize tags array
 * @param {Array} tags - Tags array
 * @returns {Array} - Sanitized tags array
 */
export function sanitizeTags(tags) {
    if (!Array.isArray(tags)) return [];
    return tags
        .map(tag => sanitizeString(tag))
        .filter(tag => tag.length > 0)
        .slice(0, 5); // Max 5 tags
}
