/**
 * Main Application Entry Point
 */
import { Router } from './core/router.js';
import { eventBus } from './core/eventBus.js';
import { dbClient } from './data/indexeddb.js';
import { seedDatabase } from './seed/seed.js';
import { LoginView } from './ui/views/loginView.js';
import { QuestionsListView } from './ui/views/questionsListView.js';
import { NewQuestionView } from './ui/views/newQuestionView.js';
import { QuestionDetailView } from './ui/views/questionDetailView.js';
import { AdminView } from './ui/views/adminView.js';
import { UserService } from './domain/services/userService.js';
import { toast } from './core/toast.js';
import { $, hideElement, showElement, setTextContent } from './core/dom.js';
import { logger } from './core/logger.js';

class App {
    constructor() {
        this.router = new Router();
        this.currentUser = null;
        this.userService = new UserService();
        this.mainContent = $('#mainContent');
        
        // Initialize views
        this.loginView = new LoginView(this.mainContent);
        this.questionsListView = new QuestionsListView(this.mainContent);
        this.newQuestionView = new NewQuestionView(this.mainContent);
        this.questionDetailView = new QuestionDetailView(this.mainContent);
        this.adminView = new AdminView(this.mainContent);
    }

    async init() {
        try {
            // Initialize database
            await dbClient.init();
            logger.info('Database initialized');

            // Seed database if empty
            await seedDatabase();

            // Load current user from sessionStorage
            this.loadUserFromSession();

            // Setup router
            this.setupRoutes();

            // Setup event listeners
            this.setupEventListeners();

            // Setup navigation
            this.updateNavigation();

            // Handle initial route
            this.router.handleRoute();
        } catch (error) {
            logger.error('App initialization error:', error);
            toast.error('خطا در راه‌اندازی برنامه');
        }
    }

    setupRoutes() {
        // Before route hook - check authentication
        this.router.beforeEach(async (hash) => {
            // Allow login page without authentication
            if (hash === '/login' || hash.startsWith('/login')) {
                return true;
            }

            // Check if user is logged in
            if (!this.currentUser) {
                this.router.navigate('/login');
                return false;
            }

            return true;
        });

        // Routes
        this.router.on('/login', () => {
            this.loginView.render();
        });

        this.router.on('/questions', () => {
            this.questionsListView.setCurrentUser(this.currentUser);
            this.questionsListView.render();
        });

        this.router.on('/questions/new', () => {
            this.newQuestionView.setCurrentUser(this.currentUser);
            this.newQuestionView.render();
        });

        this.router.on('/questions/:id', (params) => {
            this.questionDetailView.setCurrentUser(this.currentUser);
            this.questionDetailView.render(parseInt(params.id));
        });

        this.router.on('/admin', () => {
            this.adminView.setCurrentUser(this.currentUser);
            this.adminView.render();
        });
    }

    setupEventListeners() {
        // User login event
        eventBus.on('user:loggedIn', (user) => {
            this.setCurrentUser(user);
        });

        // User logout event
        eventBus.on('user:loggedOut', () => {
            this.setCurrentUser(null);
            this.router.navigate('/login');
        });

        // Logout button
        const logoutBtn = $('#logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Data imported event
        eventBus.on('data:imported', () => {
            this.setCurrentUser(null);
        });
    }

    setCurrentUser(user) {
        this.currentUser = user;
        if (user) {
            sessionStorage.setItem('currentUser', JSON.stringify({
                id: user.id,
                username: user.username
            }));
        } else {
            sessionStorage.removeItem('currentUser');
        }
        this.updateNavigation();
    }

    loadUserFromSession() {
        try {
            const userData = sessionStorage.getItem('currentUser');
            if (userData) {
                const { id, username } = JSON.parse(userData);
                // Load full user data
                this.userService.getUserById(id).then(user => {
                    if (user) {
                        this.setCurrentUser(user);
                    }
                }).catch(() => {
                    // User not found, clear session
                    sessionStorage.removeItem('currentUser');
                });
            }
        } catch (error) {
            logger.warn('Error loading user from session:', error);
            sessionStorage.removeItem('currentUser');
        }
    }

    updateNavigation() {
        const userInfo = $('#userInfo');
        const logoutBtn = $('#logoutBtn');
        const adminLink = $('#adminLink');

        if (this.currentUser) {
            if (userInfo) {
                setTextContent(userInfo, `کاربر: ${this.currentUser.displayName} (${this.currentUser.role})`);
            }
            if (logoutBtn) {
                showElement(logoutBtn);
            }
            if (adminLink) {
                if (this.currentUser.isAdmin()) {
                    showElement(adminLink);
                } else {
                    hideElement(adminLink);
                }
            }
        } else {
            if (userInfo) {
                setTextContent(userInfo, '');
            }
            if (logoutBtn) {
                hideElement(logoutBtn);
            }
            if (adminLink) {
                hideElement(adminLink);
            }
        }
    }

    logout() {
        this.setCurrentUser(null);
        toast.info('با موفقیت خارج شدید');
        this.router.navigate('/login');
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new App();
        app.init();
    });
} else {
    const app = new App();
    app.init();
}
