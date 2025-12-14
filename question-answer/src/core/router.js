export class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.init();
    }

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    }

    register(path, handler) {
        this.routes.set(path, handler);
    }

    handleRoute() {
        const hash = window.location.hash.slice(1) || '/login';
        const [path, ...params] = hash.split('/');
        const route = `/${path}`;
        
        let matchedRoute = null;
        let matchedParams = {};

        for (const [routePath, handler] of this.routes.entries()) {
            const routeParts = routePath.split('/');
            const hashParts = hash.split('/');

            if (routeParts.length === hashParts.length) {
                let match = true;
                const params = {};

                for (let i = 0; i < routeParts.length; i++) {
                    if (routeParts[i].startsWith(':')) {
                        params[routeParts[i].slice(1)] = hashParts[i];
                    } else if (routeParts[i] !== hashParts[i]) {
                        match = false;
                        break;
                    }
                }

                if (match) {
                    matchedRoute = routePath;
                    matchedParams = params;
                    break;
                }
            }
        }

        if (matchedRoute && this.routes.has(matchedRoute)) {
            this.currentRoute = { path: matchedRoute, params: matchedParams };
            this.routes.get(matchedRoute)(matchedParams);
        } else if (this.routes.has(route)) {
            this.currentRoute = { path: route, params: {} };
            this.routes.get(route)({});
        } else {
            this.navigate('/login');
        }
    }

    navigate(path) {
        window.location.hash = path;
    }

    getCurrentRoute() {
        return this.currentRoute;
    }
}

