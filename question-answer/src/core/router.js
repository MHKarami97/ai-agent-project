/**
 * Simple Hash-based Router
 */
export class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.beforeRoute = null;
        this.init();
    }

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    /**
     * Register a route
     * @param {string} path - Route path (supports :param)
     * @param {Function} handler - Route handler function
     */
    on(path, handler) {
        this.routes.set(path, handler);
    }

    /**
     * Set before route hook
     * @param {Function} hook - Function that returns boolean or Promise<boolean>
     */
    beforeEach(hook) {
        this.beforeRoute = hook;
    }

    /**
     * Navigate to a route
     * @param {string} path - Route path
     */
    navigate(path) {
        window.location.hash = path;
    }

    /**
     * Get current hash without #
     */
    getCurrentHash() {
        return window.location.hash.slice(1) || '/';
    }

    /**
     * Match route pattern with actual path
     * @param {string} pattern - Route pattern
     * @param {string} path - Actual path
     * @returns {Object|null} - Params object or null
     */
    matchRoute(pattern, path) {
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');

        if (patternParts.length !== pathParts.length) {
            return null;
        }

        const params = {};
        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
                params[patternParts[i].slice(1)] = pathParts[i];
            } else if (patternParts[i] !== pathParts[i]) {
                return null;
            }
        }

        return params;
    }

    /**
     * Handle route change
     */
    async handleRoute() {
        const hash = this.getCurrentHash();
        
        if (this.beforeRoute) {
            const canProceed = await this.beforeRoute(hash);
            if (!canProceed) {
                return;
            }
        }

        let matched = false;
        for (const [pattern, handler] of this.routes.entries()) {
            const params = this.matchRoute(pattern, hash);
            if (params !== null) {
                this.currentRoute = { pattern, hash, params };
                await handler(params);
                matched = true;
                break;
            }
        }

        if (!matched) {
            this.navigate('/questions');
        }
    }
}
