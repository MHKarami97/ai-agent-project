// Theme Manager
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.applyTheme();
    }

    applyTheme() {
        return
        document.body.setAttribute('data-theme', this.currentTheme);
    }

    toggleTheme() {
        return
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        this.applyTheme();
    }

    getTheme() {
        return this.currentTheme;
    }
}

const themeManager = new ThemeManager();

// Listen to tool-wrapper theme changes
window.addEventListener('themeChanged', (e) => {
    themeManager.currentTheme = e.detail;
    themeManager.applyTheme();
});

// Listen to tool-wrapper language changes
window.addEventListener('languageChanged', (e) => {
    const newLang = e.detail;
    localStorage.setItem('lang', newLang);
    // Reload page to apply language changes
    location.reload();
});


(function() {
    'use strict';

    class StorageManager {
        constructor() {
            this.DB_NAME = 'OpportunityCanvasDB';
            this.DB_VERSION = 1;
            this.BOARDS_STORE = 'boards';
            this.db = null;
        }

        async init() {
            return new Promise((resolve, reject) => {
                var request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    this.db = request.result;
                    resolve();
                };

                request.onupgradeneeded = (event) => {
                    var db = event.target.result;
                    if (!db.objectStoreNames.contains(this.BOARDS_STORE)) {
                        db.createObjectStore(this.BOARDS_STORE, { keyPath: 'id' });
                    }
                };
            });
        }

        async getAllBoards() {
            return new Promise((resolve, reject) => {
                var transaction = this.db.transaction([this.BOARDS_STORE], 'readonly');
                var store = transaction.objectStore(this.BOARDS_STORE);
                var request = store.getAll();

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        async getBoard(id) {
            return new Promise((resolve, reject) => {
                var transaction = this.db.transaction([this.BOARDS_STORE], 'readonly');
                var store = transaction.objectStore(this.BOARDS_STORE);
                var request = store.get(id);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        async saveBoard(board) {
            return new Promise((resolve, reject) => {
                var transaction = this.db.transaction([this.BOARDS_STORE], 'readwrite');
                var store = transaction.objectStore(this.BOARDS_STORE);
                var request = store.put(board);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }

        async deleteBoard(id) {
            return new Promise((resolve, reject) => {
                var transaction = this.db.transaction([this.BOARDS_STORE], 'readwrite');
                var store = transaction.objectStore(this.BOARDS_STORE);
                var request = store.delete(id);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    }

    class Board {
        constructor(id, name, sections) {
            this.id = id;
            this.name = name;
            this.sections = sections || this.getDefaultSections();
            this.createdAt = new Date().toISOString();
            this.updatedAt = new Date().toISOString();
        }

        getDefaultSections() {
            return {
                problems: [],
                solution: [],
                benefits: [],
                users: [],
                metrics: [],
                channels: [],
                costs: [],
                revenue: []
            };
        }

        addItem(section, text) {
            var item = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                text: text,
                createdAt: new Date().toISOString()
            };
            this.sections[section].push(item);
            this.updatedAt = new Date().toISOString();
            return item;
        }

        updateItem(section, itemId, text) {
            var item = this.sections[section].find(i => i.id === itemId);
            if (item) {
                item.text = text;
                item.updatedAt = new Date().toISOString();
                this.updatedAt = new Date().toISOString();
            }
        }

        deleteItem(section, itemId) {
            this.sections[section] = this.sections[section].filter(i => i.id !== itemId);
            this.updatedAt = new Date().toISOString();
        }

        moveItem(fromSection, toSection, itemId, toIndex) {
            var item = this.sections[fromSection].find(i => i.id === itemId);
            if (!item) return;

            this.sections[fromSection] = this.sections[fromSection].filter(i => i.id !== itemId);
            this.sections[toSection].splice(toIndex, 0, item);
            this.updatedAt = new Date().toISOString();
        }

        clear() {
            this.sections = this.getDefaultSections();
            this.updatedAt = new Date().toISOString();
        }

        toJSON() {
            return {
                id: this.id,
                name: this.name,
                sections: this.sections,
                createdAt: this.createdAt,
                updatedAt: this.updatedAt
            };
        }
    }

    class I18n {
        constructor() {
            this.currentLang = 'fa';
            this.translations = {};
        }

        async init() {
            try {
                console.log('Fetching translations from assets/translations.json...');
                var response = await fetch('assets/translations.json');
                console.log('Fetch response:', response.status, response.statusText);
                
                this.translations = await response.json();
                console.log('Translations loaded:', Object.keys(this.translations));
                
                var savedLang = localStorage.getItem('language');
                if (savedLang) {
                    this.currentLang = savedLang;
                }
                console.log('Current language:', this.currentLang);
            } catch (error) {
                console.error('Error loading translations:', error);
                throw error;
            }
        }

        setLanguage(lang) {
            this.currentLang = lang;
            localStorage.setItem('language', lang);
            
            document.documentElement.lang = lang;
            document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
            
            this.updateTexts();
        }

        t(key) {
            var keys = key.split('.');
            var value = this.translations[this.currentLang];
            
            for (var i = 0; i < keys.length; i++) {
                value = value[keys[i]];
                if (!value) return key;
            }
            
            return value;
        }

        updateTexts() {
            document.querySelectorAll('[data-i18n]').forEach(el => {
                var key = el.getAttribute('data-i18n');
                el.textContent = this.t(key);
            });
            
            document.querySelectorAll('[data-i18n-title]').forEach(el => {
                var key = el.getAttribute('data-i18n-title');
                el.title = this.t(key);
            });
            
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                var key = el.getAttribute('data-i18n-placeholder');
                el.placeholder = this.t(key);
            });
        }

        getCurrentLanguage() {
            return this.currentLang;
        }
    }

    class UI {
        constructor(app) {
            this.app = app;
            this.draggedElement = null;
            this.draggedData = null;
        }

        showModal(title, placeholder, defaultValue, callback) {
            var modal = document.getElementById('modal');
            var modalTitle = document.getElementById('modalTitle');
            var modalInput = document.getElementById('modalInput');
            var modalConfirm = document.getElementById('modalConfirm');
            var modalCancel = document.getElementById('modalCancel');
            var modalClose = document.querySelector('.modal-close');

            modalTitle.textContent = title;
            modalInput.placeholder = placeholder;
            modalInput.value = defaultValue || '';
            modal.classList.add('active');
            modalInput.focus();

            var confirmHandler = () => {
                var value = modalInput.value.trim();
                if (value) {
                    callback(value);
                    closeModal();
                }
            };

            var closeModal = () => {
                modal.classList.remove('active');
                modalConfirm.removeEventListener('click', confirmHandler);
                modalCancel.removeEventListener('click', closeModal);
                modalClose.removeEventListener('click', closeModal);
                modalInput.removeEventListener('keypress', keypressHandler);
            };

            var keypressHandler = (e) => {
                if (e.key === 'Enter') confirmHandler();
            };

            modalConfirm.addEventListener('click', confirmHandler);
            modalCancel.addEventListener('click', closeModal);
            modalClose.addEventListener('click', closeModal);
            modalInput.addEventListener('keypress', keypressHandler);
        }

        showToast(message, type) {
            var toast = document.getElementById('toast');
            toast.textContent = message;
            toast.className = 'toast show ' + (type || '');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }

        renderBoards(boards, currentBoardId) {
            var selector = document.getElementById('boardSelector');
            selector.innerHTML = '<option value="" data-i18n="board.selectBoard">' + 
                this.app.i18n.t('board.selectBoard') + '</option>';
            
            boards.forEach(board => {
                var option = document.createElement('option');
                option.value = board.id;
                option.textContent = board.name;
                if (board.id === currentBoardId) {
                    option.selected = true;
                }
                selector.appendChild(option);
            });
        }

        renderBoard(board) {
            if (!board) {
                this.clearCanvas();
                return;
            }

            Object.keys(board.sections).forEach(sectionKey => {
                var container = document.querySelector(`.items-container[data-section="${sectionKey}"]`);
                container.innerHTML = '';
                
                board.sections[sectionKey].forEach(item => {
                    this.renderItem(container, item, sectionKey);
                });
            });
        }

        renderItem(container, item, section) {
            var itemEl = document.createElement('div');
            itemEl.className = 'canvas-item';
            itemEl.draggable = true;
            itemEl.dataset.itemId = item.id;
            itemEl.dataset.section = section;

            var content = document.createElement('div');
            content.className = 'item-content';
            content.textContent = item.text;

            var actions = document.createElement('div');
            actions.className = 'item-actions';

            var editBtn = document.createElement('button');
            editBtn.className = 'item-action-btn edit';
            editBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
            editBtn.title = this.app.i18n.t('item.edit');
            editBtn.onclick = () => this.app.editItem(section, item.id);

            var deleteBtn = document.createElement('button');
            deleteBtn.className = 'item-action-btn delete';
            deleteBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
            deleteBtn.title = this.app.i18n.t('item.delete');
            deleteBtn.onclick = () => this.app.deleteItem(section, item.id);

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);

            itemEl.appendChild(content);
            itemEl.appendChild(actions);

            this.setupDragAndDrop(itemEl);

            container.appendChild(itemEl);
        }

        setupDragAndDrop(itemEl) {
            itemEl.addEventListener('dragstart', (e) => {
                this.draggedElement = itemEl;
                this.draggedData = {
                    itemId: itemEl.dataset.itemId,
                    fromSection: itemEl.dataset.section
                };
                itemEl.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            itemEl.addEventListener('dragend', () => {
                itemEl.classList.remove('dragging');
                document.querySelectorAll('.drag-over').forEach(el => {
                    el.classList.remove('drag-over');
                });
            });

            itemEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                
                if (this.draggedElement !== itemEl) {
                    itemEl.classList.add('drag-over');
                }
            });

            itemEl.addEventListener('dragleave', () => {
                itemEl.classList.remove('drag-over');
            });

            itemEl.addEventListener('drop', (e) => {
                e.preventDefault();
                itemEl.classList.remove('drag-over');
                
                if (this.draggedElement !== itemEl) {
                    var toSection = itemEl.dataset.section;
                    var container = itemEl.parentElement;
                    var items = Array.from(container.children);
                    var toIndex = items.indexOf(itemEl);
                    
                    this.app.moveItem(
                        this.draggedData.fromSection,
                        toSection,
                        this.draggedData.itemId,
                        toIndex
                    );
                }
            });
        }

        setupContainerDragAndDrop() {
            document.querySelectorAll('.items-container').forEach(container => {
                container.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    container.classList.add('drag-over');
                });

                container.addEventListener('dragleave', (e) => {
                    if (e.target === container) {
                        container.classList.remove('drag-over');
                    }
                });

                container.addEventListener('drop', (e) => {
                    e.preventDefault();
                    container.classList.remove('drag-over');
                    
                    if (this.draggedElement && this.draggedData) {
                        var toSection = container.dataset.section;
                        var toIndex = container.children.length;
                        
                        this.app.moveItem(
                            this.draggedData.fromSection,
                            toSection,
                            this.draggedData.itemId,
                            toIndex
                        );
                    }
                });
            });
        }

        clearCanvas() {
            document.querySelectorAll('.items-container').forEach(container => {
                container.innerHTML = '';
            });
        }
    }

    class App {
        constructor() {
            this.storage = new StorageManager();
            this.i18n = new I18n();
            this.ui = new UI(this);
            this.boards = [];
            this.currentBoard = null;
        }

        async init() {
            try {
                console.log('Initializing storage...');
                await this.storage.init();
                console.log('Storage initialized successfully');
                
                console.log('Loading translations...');
                await this.i18n.init();
                console.log('Translations loaded successfully');
                
                var savedTheme = localStorage.getItem('theme') || 'light';
                document.documentElement.setAttribute('data-theme', savedTheme);
                
                this.i18n.setLanguage(this.i18n.currentLang);
                
                console.log('Loading boards...');
                await this.loadBoards();
                console.log('Boards loaded:', this.boards.length);
                
                console.log('Setting up event listeners...');
                this.setupEventListeners();
                this.ui.setupContainerDragAndDrop();
                console.log('Event listeners setup complete');
                
                if (this.boards.length === 0) {
                    console.log('No boards found, creating default board...');
                    await this.createBoard(this.i18n.t('board.defaultName'));
                }
                
                console.log('App initialized successfully!');
            } catch (error) {
                console.error('Error during initialization:', error);
                throw error;
            }
        }

        async loadBoards() {
            var boardsData = await this.storage.getAllBoards();
            this.boards = boardsData.map(data => {
                var board = new Board(data.id, data.name, data.sections);
                board.createdAt = data.createdAt;
                board.updatedAt = data.updatedAt;
                return board;
            });
            
            this.boards.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            
            var currentBoardId = localStorage.getItem('currentBoardId');
            if (currentBoardId) {
                this.currentBoard = this.boards.find(b => b.id === currentBoardId);
            }
            
            if (!this.currentBoard && this.boards.length > 0) {
                this.currentBoard = this.boards[0];
            }
            
            this.ui.renderBoards(this.boards, this.currentBoard?.id);
            this.ui.renderBoard(this.currentBoard);
        }

        setupEventListeners() {
            document.getElementById('newBoardBtn').addEventListener('click', () => {
                this.ui.showModal(
                    this.i18n.t('board.newTitle'),
                    this.i18n.t('board.nameRequired'),
                    '',
                    (name) => this.createBoard(name)
                );
            });

            document.getElementById('renameBoardBtn').addEventListener('click', () => {
                if (!this.currentBoard) {
                    this.ui.showToast(this.i18n.t('board.selectFirst'), 'warning');
                    return;
                }
                this.ui.showModal(
                    this.i18n.t('board.renameTitle'),
                    this.i18n.t('board.nameRequired'),
                    this.currentBoard.name,
                    (name) => this.renameBoard(name)
                );
            });

            document.getElementById('deleteBoardBtn').addEventListener('click', () => {
                if (!this.currentBoard) {
                    this.ui.showToast(this.i18n.t('board.selectFirst'), 'warning');
                    return;
                }
                if (confirm(this.i18n.t('board.deleteConfirm'))) {
                    this.deleteBoard();
                }
            });

            document.getElementById('clearBoardBtn').addEventListener('click', () => {
                if (!this.currentBoard) {
                    this.ui.showToast(this.i18n.t('board.selectFirst'), 'warning');
                    return;
                }
                if (confirm(this.i18n.t('board.clearConfirm'))) {
                    this.clearBoard();
                }
            });

            document.getElementById('exportBtn').addEventListener('click', () => {
                if (!this.currentBoard) {
                    this.ui.showToast(this.i18n.t('board.selectFirst'), 'warning');
                    return;
                }
                this.exportBoard();
            });

            document.getElementById('importBtn').addEventListener('click', () => {
                document.getElementById('importFile').click();
            });

            document.getElementById('importFile').addEventListener('change', (e) => {
                var file = e.target.files[0];
                if (file) {
                    this.importBoard(file);
                }
                e.target.value = '';
            });

            document.getElementById('boardSelector').addEventListener('change', (e) => {
                var boardId = e.target.value;
                if (boardId) {
                    this.switchBoard(boardId);
                }
            });

            document.querySelectorAll('.add-item-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    if (!this.currentBoard) {
                        this.ui.showToast(this.i18n.t('board.selectFirst'), 'warning');
                        return;
                    }
                    var section = e.target.dataset.section;
                    this.addItem(section);
                });
            });
        }

        async createBoard(name) {
            var id = Date.now().toString();
            var board = new Board(id, name);
            this.boards.unshift(board);
            
            await this.storage.saveBoard(board.toJSON());
            
            this.currentBoard = board;
            localStorage.setItem('currentBoardId', board.id);
            
            this.ui.renderBoards(this.boards, this.currentBoard.id);
            this.ui.renderBoard(this.currentBoard);
            this.ui.showToast(this.i18n.t('board.created'), 'success');
        }

        async renameBoard(name) {
            this.currentBoard.name = name;
            this.currentBoard.updatedAt = new Date().toISOString();
            
            await this.storage.saveBoard(this.currentBoard.toJSON());
            
            this.ui.renderBoards(this.boards, this.currentBoard.id);
            this.ui.showToast(this.i18n.t('board.renamed'), 'success');
        }

        async deleteBoard() {
            await this.storage.deleteBoard(this.currentBoard.id);
            
            this.boards = this.boards.filter(b => b.id !== this.currentBoard.id);
            
            if (this.boards.length > 0) {
                this.currentBoard = this.boards[0];
                localStorage.setItem('currentBoardId', this.currentBoard.id);
            } else {
                this.currentBoard = null;
                localStorage.removeItem('currentBoardId');
            }
            
            this.ui.renderBoards(this.boards, this.currentBoard?.id);
            this.ui.renderBoard(this.currentBoard);
            this.ui.showToast(this.i18n.t('board.deleted'), 'success');
        }

        async clearBoard() {
            this.currentBoard.clear();
            await this.storage.saveBoard(this.currentBoard.toJSON());
            this.ui.renderBoard(this.currentBoard);
            this.ui.showToast(this.i18n.t('board.cleared'), 'success');
        }

        exportBoard() {
            var data = JSON.stringify(this.currentBoard.toJSON(), null, 2);
            var blob = new Blob([data], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = this.currentBoard.name + '_' + new Date().toISOString().split('T')[0] + '.json';
            a.click();
            URL.revokeObjectURL(url);
            this.ui.showToast(this.i18n.t('board.exported'), 'success');
        }

        async importBoard(file) {
            try {
                var text = await file.text();
                var data = JSON.parse(text);
                
                var board = new Board(data.id || Date.now().toString(), data.name, data.sections);
                board.createdAt = data.createdAt || new Date().toISOString();
                board.updatedAt = new Date().toISOString();
                
                var existingIndex = this.boards.findIndex(b => b.id === board.id);
                if (existingIndex !== -1) {
                    this.boards[existingIndex] = board;
                } else {
                    this.boards.unshift(board);
                }
                
                await this.storage.saveBoard(board.toJSON());
                
                this.currentBoard = board;
                localStorage.setItem('currentBoardId', board.id);
                
                this.ui.renderBoards(this.boards, this.currentBoard.id);
                this.ui.renderBoard(this.currentBoard);
                this.ui.showToast(this.i18n.t('board.imported'), 'success');
            } catch (error) {
                this.ui.showToast(this.i18n.t('board.importError'), 'error');
            }
        }

        switchBoard(boardId) {
            this.currentBoard = this.boards.find(b => b.id === boardId);
            localStorage.setItem('currentBoardId', boardId);
            this.ui.renderBoard(this.currentBoard);
        }

        addItem(section) {
            this.ui.showModal(
                this.i18n.t('item.add'),
                this.i18n.t('item.placeholder'),
                '',
                async (text) => {
                    this.currentBoard.addItem(section, text);
                    await this.storage.saveBoard(this.currentBoard.toJSON());
                    this.ui.renderBoard(this.currentBoard);
                    this.ui.showToast(this.i18n.t('item.added'), 'success');
                }
            );
        }

        editItem(section, itemId) {
            var item = this.currentBoard.sections[section].find(i => i.id === itemId);
            if (!item) return;

            this.ui.showModal(
                this.i18n.t('item.edit'),
                this.i18n.t('item.placeholder'),
                item.text,
                async (text) => {
                    this.currentBoard.updateItem(section, itemId, text);
                    await this.storage.saveBoard(this.currentBoard.toJSON());
                    this.ui.renderBoard(this.currentBoard);
                    this.ui.showToast(this.i18n.t('item.updated'), 'success');
                }
            );
        }

        async deleteItem(section, itemId) {
            this.currentBoard.deleteItem(section, itemId);
            await this.storage.saveBoard(this.currentBoard.toJSON());
            this.ui.renderBoard(this.currentBoard);
            this.ui.showToast(this.i18n.t('item.deleted'), 'success');
        }

        async moveItem(fromSection, toSection, itemId, toIndex) {
            this.currentBoard.moveItem(fromSection, toSection, itemId, toIndex);
            await this.storage.saveBoard(this.currentBoard.toJSON());
            this.ui.renderBoard(this.currentBoard);
            this.ui.showToast(this.i18n.t('item.moved'), 'success');
        }

        toggleTheme() {
            var currentTheme = document.documentElement.getAttribute('data-theme');
            var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        }

        toggleLanguage() {
            var newLang = this.i18n.getCurrentLanguage() === 'fa' ? 'en' : 'fa';
            this.i18n.setLanguage(newLang);
        }
    }

    var app = new App();
    app.init().catch(error => {
        console.error('Failed to initialize app:', error);
        alert('خطا در بارگذاری برنامه. لطفاً صفحه را رفرش کنید.');
    });
})();

