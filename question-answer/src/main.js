import { Router } from './core/router.js';
import { eventBus } from './core/eventBus.js';
import { Toast } from './core/toast.js';
import { IndexedDBClient } from './data/indexeddb.js';
import { UserRepository } from './data/repositories/userRepository.js';
import { QuestionRepository } from './data/repositories/questionRepository.js';
import { AnswerRepository } from './data/repositories/answerRepository.js';
import { VoteRepository } from './data/repositories/voteRepository.js';
import { UserService } from './domain/services/userService.js';
import { QuestionService } from './domain/services/questionService.js';
import { AnswerService } from './domain/services/answerService.js';
import { ExportImportService } from './data/exportImport.js';
import { LoginView } from './ui/views/loginView.js';
import { QuestionsListView } from './ui/views/questionsListView.js';
import { QuestionDetailView } from './ui/views/questionDetailView.js';
import { NewQuestionView } from './ui/views/newQuestionView.js';
import { AdminView } from './ui/views/adminView.js';
import { DOM } from './core/dom.js';
import { seedDatabase } from './seed/seed.js';

class App {
    constructor() {
        this.db = null;
        this.router = null;
        this.currentUser = null;
        this.userService = null;
        this.questionService = null;
        this.answerService = null;
        this.exportImportService = null;
    }

    async init() {
        try {
            // Initialize IndexedDB
            this.db = new IndexedDBClient('QASystemDB', 1);
            await this.db.open();

            // Initialize repositories
            const userRepo = new UserRepository(this.db);
            const questionRepo = new QuestionRepository(this.db);
            const answerRepo = new AnswerRepository(this.db);
            const voteRepo = new VoteRepository(this.db);

            // Initialize services
            this.userService = new UserService(userRepo);
            this.questionService = new QuestionService(questionRepo, answerRepo, voteRepo);
            this.answerService = new AnswerService(answerRepo, voteRepo, questionRepo);
            this.exportImportService = new ExportImportService(userRepo, questionRepo, answerRepo, voteRepo);

            // Seed database if empty
            await seedDatabase(this.db);

            // Initialize router
            this.router = new Router();
            this.setupRoutes();

            // Setup event listeners
            this.setupEventListeners();

            // Check for existing session
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                try {
                    const userData = JSON.parse(savedUser);
                    const result = await this.userService.getById(userData.id);
                    if (result.isOk() && result.data) {
                        this.setCurrentUser(result.data);
                    }
                } catch (error) {
                    localStorage.removeItem('currentUser');
                }
            }

            // Handle initial route
            this.router.handleRoute();
        } catch (error) {
            console.error('Error initializing app:', error);
            Toast.error('خطا در راه‌اندازی برنامه');
        }
    }

    setupRoutes() {
        this.router.register('/login', () => this.showLogin());
        this.router.register('/questions', () => this.showQuestionsList());
        this.router.register('/questions/new', () => this.showNewQuestion());
        this.router.register('/questions/:id', (params) => this.showQuestionDetail(params));
        this.router.register('/admin', () => this.showAdmin());
    }

    setupEventListeners() {
        eventBus.on('user:logged-in', (user) => {
            this.setCurrentUser(user);
            this.router.navigate('/questions');
        });

        eventBus.on('user:logged-out', () => {
            this.setCurrentUser(null);
            this.router.navigate('/login');
        });

        eventBus.on('question:created', () => {
            this.router.navigate('/questions');
        });

        eventBus.on('question:deleted', () => {
            this.router.navigate('/questions');
        });

        eventBus.on('data:imported', () => {
            this.router.navigate('/questions');
        });

        // Logout button
        const logoutBtn = DOM.$('#logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.setCurrentUser(null);
            });
        }
    }

    setCurrentUser(user) {
        this.currentUser = user;
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user.toJSON()));
            const userInfo = DOM.$('#user-info');
            if (userInfo) {
                userInfo.textContent = `${user.displayName} (${user.role})`;
            }
            const logoutBtn = DOM.$('#logout-btn');
            if (logoutBtn) {
                logoutBtn.style.display = 'block';
            }
            // Show admin link for admins
            let adminLink = DOM.$('#admin-link');
            if (user.isAdmin()) {
                if (!adminLink) {
                    const navLinks = DOM.$('.nav-links');
                    if (navLinks) {
                        adminLink = DOM.create('a', {
                            href: '#/admin',
                            className: 'nav-link',
                            id: 'admin-link'
                        }, 'مدیریت');
                        navLinks.insertBefore(adminLink, navLinks.firstChild);
                    }
                }
                if (adminLink) adminLink.style.display = 'block';
            } else {
                if (adminLink) adminLink.style.display = 'none';
            }
        } else {
            localStorage.removeItem('currentUser');
            const userInfo = DOM.$('#user-info');
            if (userInfo) {
                userInfo.textContent = '';
            }
            const logoutBtn = DOM.$('#logout-btn');
            if (logoutBtn) {
                logoutBtn.style.display = 'none';
            }
            const adminLink = DOM.$('#admin-link');
            if (adminLink) {
                adminLink.style.display = 'none';
            }
        }
    }

    requireAuth() {
        if (!this.currentUser) {
            this.router.navigate('/login');
            return false;
        }
        return true;
    }

    requireAdmin() {
        if (!this.requireAuth()) return false;
        if (!this.currentUser.isAdmin()) {
            Toast.error('شما دسترسی به این بخش را ندارید');
            this.router.navigate('/questions');
            return false;
        }
        return true;
    }

    async showLogin() {
        const mainContent = DOM.$('#main-content');
        if (!mainContent) return;

        const view = new LoginView(this.userService);
        DOM.render(mainContent, view.render());
    }

    async showQuestionsList() {
        const mainContent = DOM.$('#main-content');
        if (!mainContent) return;

        const view = new QuestionsListView(this.questionService, this.userService);
        DOM.render(mainContent, await view.render());
    }

    async showNewQuestion() {
        if (!this.requireAuth()) return;

        const mainContent = DOM.$('#main-content');
        if (!mainContent) return;

        const view = new NewQuestionView(this.questionService, this.currentUser);
        DOM.render(mainContent, view.render());
    }

    async showQuestionDetail(params) {
        const mainContent = DOM.$('#main-content');
        if (!mainContent) return;

        const view = new QuestionDetailView(
            this.questionService,
            this.answerService,
            this.userService,
            this.currentUser
        );
        DOM.render(mainContent, await view.render(params));
    }

    async showAdmin() {
        if (!this.requireAdmin()) return;

        const mainContent = DOM.$('#main-content');
        if (!mainContent) return;

        const view = new AdminView(this.userService, this.db, this.exportImportService);
        DOM.render(mainContent, await view.render());
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

