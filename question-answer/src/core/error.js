export class AppError extends Error {
    constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

export class Result {
    constructor(success, data = null, error = null) {
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

