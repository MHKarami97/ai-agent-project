/**
 * Simple logger utility
 */

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

class Logger {
    constructor() {
        this.level = LOG_LEVELS.INFO; // Default level
        this.enabled = true; // Can be disabled via flag
    }

    setLevel(level) {
        if (typeof level === 'string') {
            this.level = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
        } else {
            this.level = level;
        }
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    debug(...args) {
        if (this.enabled && this.level <= LOG_LEVELS.DEBUG) {
            console.debug('[DEBUG]', ...args);
        }
    }

    info(...args) {
        if (this.enabled && this.level <= LOG_LEVELS.INFO) {
            console.info('[INFO]', ...args);
        }
    }

    warn(...args) {
        if (this.enabled && this.level <= LOG_LEVELS.WARN) {
            console.warn('[WARN]', ...args);
        }
    }

    error(...args) {
        if (this.enabled && this.level <= LOG_LEVELS.ERROR) {
            console.error('[ERROR]', ...args);
        }
    }
}

export const logger = new Logger();
