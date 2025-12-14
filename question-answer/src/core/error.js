/**
 * Error handling utilities
 */

export class AppError extends Error {
    constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

/**
 * Result pattern for error handling
 */
export class Result {
    constructor(success, data, error) {
        this.success = success;
        this.data = data;
        this.error = error;
    }

    static ok(data) {
        return new Result(true, data, null);
    }

    static fail(error) {
        return new Result(false, null, error);
    }

    isOk() {
        return this.success;
    }

    isFail() {
        return !this.success;
    }
}

/**
 * Handle async errors
 * @param {Function} fn - Async function
 * @returns {Promise<Result>}
 */
export async function handleAsync(fn) {
    try {
        const data = await fn();
        return Result.ok(data);
    } catch (error) {
        return Result.fail(error);
    }
}

/**
 * Get user-friendly error message
 * @param {Error} error - Error object
 * @returns {string}
 */
export function getErrorMessage(error) {
    if (error instanceof AppError) {
        return error.message;
    }
    if (error.name === 'ValidationError') {
        return error.message;
    }
    if (error.name === 'DOMException' && error.message.includes('QuotaExceededError')) {
        return 'فضای ذخیره‌سازی مرورگر پر شده است';
    }
    return 'خطایی رخ داد. لطفاً دوباره تلاش کنید.';
}
