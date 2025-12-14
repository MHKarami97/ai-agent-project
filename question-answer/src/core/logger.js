class Logger {
    constructor() {
        this.enabled = true;
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    log(level, message, data = null) {
        if (!this.enabled) return;

        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level}] ${message}`;

        switch (level) {
            case 'ERROR':
                console.error(logMessage, data || '');
                break;
            case 'WARN':
                console.warn(logMessage, data || '');
                break;
            case 'INFO':
                console.info(logMessage, data || '');
                break;
            default:
                console.log(logMessage, data || '');
        }
    }

    error(message, data) {
        this.log('ERROR', message, data);
    }

    warn(message, data) {
        this.log('WARN', message, data);
    }

    info(message, data) {
        this.log('INFO', message, data);
    }

    debug(message, data) {
        this.log('DEBUG', message, data);
    }
}

export const logger = new Logger();

