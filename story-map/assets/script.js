// Theme Manager
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.applyTheme();
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.currentTheme);
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        this.applyTheme();
    }

    getTheme() {
        return this.currentTheme;
    }
}

const themeManager = new ThemeManager();

// I18n System
class I18n {
    constructor() {
        this.translations = {};
        this.currentLang = localStorage.getItem('lang') || 'fa';
        this.loadTranslations();
    }

    async loadTranslations() {
        try {
            const response = await fetch('assets/translations.json');
            this.translations = await response.json();
            this.applyTranslations();
        } catch (error) {
            console.error('Failed to load translations:', error);
        }
    }

    t(key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];
        
        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                return key;
            }
        }
        
        return value;
    }

    applyTranslations() {
        const html = document.documentElement;
        html.setAttribute('lang', this.currentLang);
        html.setAttribute('dir', this.currentLang === 'fa' ? 'rtl' : 'ltr');
        
        // Update all elements with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' && element.type !== 'checkbox') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Update document title
        const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
        if (titleKey) {
            document.title = this.t(titleKey);
        }
    }

    switchLanguage() {
        this.currentLang = this.currentLang === 'fa' ? 'en' : 'fa';
        localStorage.setItem('lang', this.currentLang);
        this.applyTranslations();
    }
}

const i18n = new I18n();



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


var StoryMapApp = (function() {
    'use strict';

    var DB_NAME = 'StoryMapDB';
    var DB_VERSION = 1;
    var BOARDS_STORE = 'boards';
    var db;

    var State = {
        currentLanguage: localStorage.getItem('language') || 'fa',
        currentTheme: localStorage.getItem('theme') || 'light',
        currentBoardId: localStorage.getItem('currentBoardId') || null,
        currentViewMode: localStorage.getItem('viewMode') || 'storymap',
        boards: [],
        translations: {},
        draggedElement: null,
        draggedStoryId: null,
        draggedFromColumnId: null,
        draggedColumnId: null,
        draggedColumnElement: null
    };

    var Elements = {};

    function Board(id, name, columns) {
        this.id = id || generateId();
        this.name = name || 'New Board';
        this.columns = columns || [];
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    function Column(id, title, stories) {
        this.id = id || generateId();
        this.title = title || 'New Column';
        this.stories = stories || [];
    }

    function Story(id, title, description, points, status) {
        this.id = id || generateId();
        this.title = title || '';
        this.description = description || '';
        this.points = points || 0;
        this.status = status || 'pending';
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    function initIndexedDB() {
        return new Promise(function(resolve, reject) {
            var request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = function() {
                reject(new Error('Failed to open database'));
            };

            request.onsuccess = function(event) {
                db = event.target.result;
                resolve(db);
            };

            request.onupgradeneeded = function(event) {
                var database = event.target.result;
                if (!database.objectStoreNames.contains(BOARDS_STORE)) {
                    var objectStore = database.createObjectStore(BOARDS_STORE, { keyPath: 'id' });
                    objectStore.createIndex('name', 'name', { unique: false });
                }
            };
        });
    }

    function saveBoard(board) {
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction([BOARDS_STORE], 'readwrite');
            var objectStore = transaction.objectStore(BOARDS_STORE);
            board.updatedAt = new Date().toISOString();
            var request = objectStore.put(board);

            request.onsuccess = function() {
                resolve(board);
            };

            request.onerror = function() {
                reject(new Error('Failed to save board'));
            };
        });
    }

    function getAllBoards() {
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction([BOARDS_STORE], 'readonly');
            var objectStore = transaction.objectStore(BOARDS_STORE);
            var request = objectStore.getAll();

            request.onsuccess = function(event) {
                resolve(event.target.result);
            };

            request.onerror = function() {
                reject(new Error('Failed to get boards'));
            };
        });
    }

    function getBoard(id) {
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction([BOARDS_STORE], 'readonly');
            var objectStore = transaction.objectStore(BOARDS_STORE);
            var request = objectStore.get(id);

            request.onsuccess = function(event) {
                resolve(event.target.result);
            };

            request.onerror = function() {
                reject(new Error('Failed to get board'));
            };
        });
    }

    function deleteBoard(id) {
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction([BOARDS_STORE], 'readwrite');
            var objectStore = transaction.objectStore(BOARDS_STORE);
            var request = objectStore.delete(id);

            request.onsuccess = function() {
                resolve();
            };

            request.onerror = function() {
                reject(new Error('Failed to delete board'));
            };
        });
    }

    function loadTranslations() {
        return fetch('assets/translations.json')
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                State.translations = data;
                updateLanguage();
            });
    }

    function translate(key) {
        return State.translations[State.currentLanguage][key] || key;
    }

    function updateLanguage() {
        var html = document.documentElement;
        html.setAttribute('lang', State.currentLanguage);
        html.setAttribute('dir', State.currentLanguage === 'fa' ? 'rtl' : 'ltr');

        var elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(function(element) {
            var key = element.getAttribute('data-i18n');
            var translation = translate(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else if (element.tagName === 'OPTION') {
                element.textContent = translation;
            } else {
                element.textContent = translation;
            }
        });

        Elements.langToggle.querySelector('.lang-text').textContent = State.currentLanguage === 'fa' ? 'EN' : 'فا';
        localStorage.setItem('language', State.currentLanguage);
    }

    function toggleLanguage() {
        State.currentLanguage = State.currentLanguage === 'fa' ? 'en' : 'fa';
        updateLanguage();
        if (State.currentBoardId) {
            renderBoard();
        }
    }

    function updateTheme() {
        document.documentElement.setAttribute('data-theme', State.currentTheme);
        Elements.themeToggle.querySelector('.theme-icon').textContent = State.currentTheme === 'dark' ? '☀️' : '🌙';
        localStorage.setItem('theme', State.currentTheme);
    }

    function toggleTheme() {
        State.currentTheme = State.currentTheme === 'dark' ? 'light' : 'dark';
        updateTheme();
    }

    function showModal(title, content, onConfirm) {
        Elements.modalTitle.textContent = title;
        Elements.modalContent.innerHTML = content;
        Elements.modalOverlay.classList.add('active');

        Elements.modalConfirm.onclick = function() {
            if (onConfirm) {
                onConfirm();
            }
            closeModal();
        };
    }

    function closeModal() {
        Elements.modalOverlay.classList.remove('active');
        Elements.modalContent.innerHTML = '';
        Elements.modalConfirm.onclick = null;
    }

    function showCreateBoardModal() {
        var content = '<div class="form-group">' +
            '<label class="form-label" data-i18n="boardName">' + translate('boardName') + '</label>' +
            '<input type="text" id="boardNameInput" class="form-input" placeholder="' + translate('boardNamePlaceholder') + '" />' +
            '</div>';

        showModal(translate('createBoard'), content, function() {
            var name = document.getElementById('boardNameInput').value.trim();
            if (name) {
                createBoard(name);
            }
        });

        setTimeout(function() {
            document.getElementById('boardNameInput').focus();
        }, 100);
    }

    function createBoard(name) {
        var board = new Board(null, name, []);
        saveBoard(board).then(function() {
            loadBoards().then(function() {
                State.currentBoardId = board.id;
                localStorage.setItem('currentBoardId', board.id);
                Elements.boardSelector.value = board.id;
                renderBoard();
            });
        });
    }

    function loadBoards() {
        return getAllBoards().then(function(boards) {
            State.boards = boards;
            renderBoardSelector();
        });
    }

    function renderBoardSelector() {
        Elements.boardSelector.innerHTML = '<option value="">' + translate('selectBoard') + '</option>';
        
        State.boards.forEach(function(board) {
            var option = document.createElement('option');
            option.value = board.id;
            option.textContent = board.name;
            if (board.id === State.currentBoardId) {
                option.selected = true;
            }
            Elements.boardSelector.appendChild(option);
        });
    }

    function showCreateColumnModal() {
        var content = '<div class="form-group">' +
            '<label class="form-label" data-i18n="columnName">' + translate('columnName') + '</label>' +
            '<input type="text" id="columnNameInput" class="form-input" placeholder="' + translate('columnNamePlaceholder') + '" />' +
            '</div>';

        showModal(translate('createColumn'), content, function() {
            var name = document.getElementById('columnNameInput').value.trim();
            if (name) {
                createColumn(name);
            }
        });

        setTimeout(function() {
            document.getElementById('columnNameInput').focus();
        }, 100);
    }

    function createColumn(name) {
        getBoard(State.currentBoardId).then(function(board) {
            var column = new Column(null, name, []);
            board.columns.push(column);
            saveBoard(board).then(function() {
                renderBoard();
            });
        });
    }

    function showEditColumnModal(columnId) {
        getBoard(State.currentBoardId).then(function(board) {
            var column = board.columns.find(function(col) {
                return col.id === columnId;
            });

            var content = '<div class="form-group">' +
                '<label class="form-label" data-i18n="columnName">' + translate('columnName') + '</label>' +
                '<input type="text" id="columnNameInput" class="form-input" value="' + column.title + '" />' +
                '</div>';

            showModal(translate('editColumn'), content, function() {
                var name = document.getElementById('columnNameInput').value.trim();
                if (name) {
                    column.title = name;
                    saveBoard(board).then(function() {
                        renderBoard();
                    });
                }
            });

            setTimeout(function() {
                document.getElementById('columnNameInput').focus();
            }, 100);
        });
    }

    function deleteColumn(columnId) {
        var content = '<p>' + translate('deleteColumnConfirm') + '</p>';
        
        showModal(translate('deleteColumn'), content, function() {
            getBoard(State.currentBoardId).then(function(board) {
                board.columns = board.columns.filter(function(col) {
                    return col.id !== columnId;
                });
                saveBoard(board).then(function() {
                    renderBoard();
                });
            });
        });
    }

    function showCreateStoryModal(columnId) {
        var content = '<div class="form-group">' +
            '<label class="form-label" data-i18n="storyTitle">' + translate('storyTitle') + '</label>' +
            '<input type="text" id="storyTitleInput" class="form-input" placeholder="' + translate('storyTitlePlaceholder') + '" />' +
            '</div>' +
            '<div class="form-group">' +
            '<label class="form-label" data-i18n="storyDescription">' + translate('storyDescription') + '</label>' +
            '<textarea id="storyDescriptionInput" class="form-textarea" placeholder="' + translate('storyDescriptionPlaceholder') + '"></textarea>' +
            '</div>' +
            '<div class="form-group">' +
            '<label class="form-label" data-i18n="storyPoints">' + translate('storyPoints') + '</label>' +
            '<input type="number" id="storyPointsInput" class="form-input" value="0" min="0" />' +
            '</div>' +
            '<div class="form-group">' +
            '<label class="form-label" data-i18n="storyStatus">' + translate('storyStatus') + '</label>' +
            '<div class="form-radio-group">' +
            '<label class="form-radio-label"><input type="radio" name="status" value="pending" checked /><span>' + translate('statusPending') + '</span></label>' +
            '<label class="form-radio-label"><input type="radio" name="status" value="in-progress" /><span>' + translate('statusInProgress') + '</span></label>' +
            '<label class="form-radio-label"><input type="radio" name="status" value="completed" /><span>' + translate('statusCompleted') + '</span></label>' +
            '<label class="form-radio-label"><input type="radio" name="status" value="rejected" /><span>' + translate('statusRejected') + '</span></label>' +
            '</div>' +
            '</div>';

        showModal(translate('createStory'), content, function() {
            var title = document.getElementById('storyTitleInput').value.trim();
            var description = document.getElementById('storyDescriptionInput').value.trim();
            var points = parseInt(document.getElementById('storyPointsInput').value) || 0;
            var status = document.querySelector('input[name="status"]:checked').value;

            if (title) {
                createStory(columnId, title, description, points, status);
            }
        });

        setTimeout(function() {
            document.getElementById('storyTitleInput').focus();
        }, 100);
    }

    function createStory(columnId, title, description, points, status) {
        getBoard(State.currentBoardId).then(function(board) {
            var column = board.columns.find(function(col) {
                return col.id === columnId;
            });
            var story = new Story(null, title, description, points, status);
            column.stories.push(story);
            saveBoard(board).then(function() {
                renderBoard();
            });
        });
    }

    function showEditStoryModal(columnId, storyId) {
        getBoard(State.currentBoardId).then(function(board) {
            var column = board.columns.find(function(col) {
                return col.id === columnId;
            });
            var story = column.stories.find(function(s) {
                return s.id === storyId;
            });

            var content = '<div class="form-group">' +
                '<label class="form-label" data-i18n="storyTitle">' + translate('storyTitle') + '</label>' +
                '<input type="text" id="storyTitleInput" class="form-input" value="' + story.title + '" />' +
                '</div>' +
                '<div class="form-group">' +
                '<label class="form-label" data-i18n="storyDescription">' + translate('storyDescription') + '</label>' +
                '<textarea id="storyDescriptionInput" class="form-textarea">' + story.description + '</textarea>' +
                '</div>' +
                '<div class="form-group">' +
                '<label class="form-label" data-i18n="storyPoints">' + translate('storyPoints') + '</label>' +
                '<input type="number" id="storyPointsInput" class="form-input" value="' + story.points + '" min="0" />' +
                '</div>' +
                '<div class="form-group">' +
                '<label class="form-label" data-i18n="storyStatus">' + translate('storyStatus') + '</label>' +
                '<div class="form-radio-group">' +
                '<label class="form-radio-label"><input type="radio" name="status" value="pending" ' + (story.status === 'pending' ? 'checked' : '') + ' /><span>' + translate('statusPending') + '</span></label>' +
                '<label class="form-radio-label"><input type="radio" name="status" value="in-progress" ' + (story.status === 'in-progress' ? 'checked' : '') + ' /><span>' + translate('statusInProgress') + '</span></label>' +
                '<label class="form-radio-label"><input type="radio" name="status" value="completed" ' + (story.status === 'completed' ? 'checked' : '') + ' /><span>' + translate('statusCompleted') + '</span></label>' +
                '<label class="form-radio-label"><input type="radio" name="status" value="rejected" ' + (story.status === 'rejected' ? 'checked' : '') + ' /><span>' + translate('statusRejected') + '</span></label>' +
                '</div>' +
                '</div>';

            showModal(translate('editStory'), content, function() {
                var title = document.getElementById('storyTitleInput').value.trim();
                var description = document.getElementById('storyDescriptionInput').value.trim();
                var points = parseInt(document.getElementById('storyPointsInput').value) || 0;
                var status = document.querySelector('input[name="status"]:checked').value;

                if (title) {
                    story.title = title;
                    story.description = description;
                    story.points = points;
                    story.status = status;
                    story.updatedAt = new Date().toISOString();
                    saveBoard(board).then(function() {
                        renderBoard();
                    });
                }
            });

            setTimeout(function() {
                document.getElementById('storyTitleInput').focus();
            }, 100);
        });
    }

    function deleteStory(columnId, storyId) {
        var content = '<p>' + translate('deleteStoryConfirm') + '</p>';
        
        showModal(translate('deleteStory'), content, function() {
            getBoard(State.currentBoardId).then(function(board) {
                var column = board.columns.find(function(col) {
                    return col.id === columnId;
                });
                column.stories = column.stories.filter(function(s) {
                    return s.id !== storyId;
                });
                saveBoard(board).then(function() {
                    renderBoard();
                });
            });
        });
    }

    function cycleStoryStatus(columnId, storyId) {
        getBoard(State.currentBoardId).then(function(board) {
            var column = board.columns.find(function(col) {
                return col.id === columnId;
            });
            var story = column.stories.find(function(s) {
                return s.id === storyId;
            });

            var statuses = ['pending', 'in-progress', 'completed', 'rejected'];
            var currentIndex = statuses.indexOf(story.status);
            var nextIndex = (currentIndex + 1) % statuses.length;
            story.status = statuses[nextIndex];
            story.updatedAt = new Date().toISOString();

            saveBoard(board).then(function() {
                renderBoard();
            });
        });
    }

    function renderBoard() {
        if (!State.currentBoardId) {
            Elements.boardContainer.innerHTML = '<div class="empty-state">' +
                '<div class="empty-icon">📋</div>' +
                '<h2 data-i18n="emptyStateTitle">' + translate('emptyStateTitle') + '</h2>' +
                '<p data-i18n="emptyStateText">' + translate('emptyStateText') + '</p>' +
                '</div>';
            Elements.addColumnBtn.style.display = 'none';
            return;
        }

        Elements.addColumnBtn.style.display = 'block';

        getBoard(State.currentBoardId).then(function(board) {
            if (!board) {
                State.currentBoardId = null;
                localStorage.removeItem('currentBoardId');
                renderBoard();
                return;
            }

            Elements.boardContainer.innerHTML = '';
            
            if (State.currentViewMode === 'roadmap') {
                Elements.boardContainer.className = 'board-container roadmap-view';
                renderRoadmapView(board);
            } else {
                Elements.boardContainer.className = 'board-container';
                renderStoryMapView(board);
            }
        });
    }

    function renderStoryMapView(board) {
        board.columns.forEach(function(column) {
            var columnElement = createColumnElement(column);
            Elements.boardContainer.appendChild(columnElement);
        });

        if (board.columns.length === 0) {
            Elements.boardContainer.innerHTML = '<div class="empty-state">' +
                '<div class="empty-icon">📝</div>' +
                '<h2>' + translate('addColumn') + '</h2>' +
                '<p>' + translate('emptyStateText') + '</p>' +
                '</div>';
        }
    }

    function renderRoadmapView(board) {
        var roadmapContainer = document.createElement('div');
        roadmapContainer.className = 'roadmap-container';

        board.columns.forEach(function(column) {
            var columnElement = createRoadmapColumnElement(column);
            roadmapContainer.appendChild(columnElement);
        });

        Elements.boardContainer.appendChild(roadmapContainer);

        if (board.columns.length === 0) {
            Elements.boardContainer.innerHTML = '<div class="empty-state">' +
                '<div class="empty-icon">📝</div>' +
                '<h2>' + translate('addColumn') + '</h2>' +
                '<p>' + translate('emptyStateText') + '</p>' +
                '</div>';
        }
    }

    function createRoadmapColumnElement(column) {
        var columnDiv = document.createElement('div');
        columnDiv.className = 'roadmap-column';
        columnDiv.setAttribute('data-column-id', column.id);
        columnDiv.setAttribute('draggable', 'true');

        columnDiv.ondragstart = function(e) {
            State.draggedColumnElement = columnDiv;
            State.draggedColumnId = column.id;
            columnDiv.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        };

        columnDiv.ondragend = function() {
            columnDiv.classList.remove('dragging');
            State.draggedColumnElement = null;
            State.draggedColumnId = null;
            
            var allColumns = document.querySelectorAll('.roadmap-column');
            allColumns.forEach(function(col) {
                col.classList.remove('drag-over-column');
            });
        };

        columnDiv.ondragover = function(e) {
            e.preventDefault();
            if (State.draggedColumnId && State.draggedColumnId !== column.id) {
                columnDiv.classList.add('drag-over-column');
            }
        };

        columnDiv.ondragleave = function() {
            columnDiv.classList.remove('drag-over-column');
        };

        columnDiv.ondrop = function(e) {
            e.preventDefault();
            e.stopPropagation();
            columnDiv.classList.remove('drag-over-column');
            
            if (State.draggedColumnId && State.draggedColumnId !== column.id) {
                handleColumnDrop(column.id);
            }
        };

        var headerDiv = document.createElement('div');
        headerDiv.className = 'roadmap-column-header';

        var titleDiv = document.createElement('div');
        titleDiv.className = 'roadmap-column-title';
        titleDiv.textContent = column.title;
        titleDiv.onclick = function(e) {
            e.stopPropagation();
            showEditColumnModal(column.id);
        };

        var actionsDiv = document.createElement('div');
        actionsDiv.className = 'column-actions';

        var deleteBtn = document.createElement('button');
        deleteBtn.className = 'icon-btn';
        deleteBtn.textContent = '🗑️';
        deleteBtn.onclick = function(e) {
            e.stopPropagation();
            deleteColumn(column.id);
        };

        actionsDiv.appendChild(deleteBtn);
        headerDiv.appendChild(titleDiv);
        headerDiv.appendChild(actionsDiv);

        var storiesDiv = document.createElement('div');
        storiesDiv.className = 'roadmap-stories-container';
        storiesDiv.setAttribute('data-column-id', column.id);

        storiesDiv.ondragover = function(e) {
            if (State.draggedStoryId) {
                e.preventDefault();
                e.stopPropagation();
                storiesDiv.classList.add('drag-over');
            }
        };

        storiesDiv.ondragleave = function(e) {
            if (State.draggedStoryId) {
                storiesDiv.classList.remove('drag-over');
            }
        };

        storiesDiv.ondrop = function(e) {
            if (State.draggedStoryId) {
                e.preventDefault();
                e.stopPropagation();
                storiesDiv.classList.remove('drag-over');
                handleStoryDrop(column.id);
            }
        };

        column.stories.forEach(function(story) {
            var storyElement = createRoadmapStoryElement(column.id, story);
            storiesDiv.appendChild(storyElement);
        });

        var addStoryBtn = document.createElement('button');
        addStoryBtn.className = 'add-story-btn';
        addStoryBtn.setAttribute('data-i18n', 'addStory');
        addStoryBtn.textContent = translate('addStory');
        addStoryBtn.onclick = function(e) {
            e.stopPropagation();
            showCreateStoryModal(column.id);
        };

        columnDiv.appendChild(headerDiv);
        columnDiv.appendChild(storiesDiv);
        columnDiv.appendChild(addStoryBtn);

        return columnDiv;
    }

    function createRoadmapStoryElement(columnId, story) {
        var storyDiv = document.createElement('div');
        storyDiv.className = 'roadmap-story-card ' + story.status;
        storyDiv.setAttribute('data-story-id', story.id);
        storyDiv.setAttribute('draggable', 'true');

        storyDiv.ondragstart = function(e) {
            State.draggedElement = storyDiv;
            State.draggedStoryId = story.id;
            State.draggedFromColumnId = columnId;
            storyDiv.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        };

        storyDiv.ondragend = function() {
            storyDiv.classList.remove('dragging');
            State.draggedElement = null;
            State.draggedStoryId = null;
            State.draggedFromColumnId = null;
        };

        var titleDiv = document.createElement('div');
        titleDiv.className = 'roadmap-story-title';
        titleDiv.textContent = story.title;

        var metaDiv = document.createElement('div');
        metaDiv.className = 'roadmap-story-meta';

        var statusBtn = document.createElement('button');
        statusBtn.className = 'story-status-btn';
        var statusIcons = {
            'pending': '⏳',
            'in-progress': '🔄',
            'completed': '✅',
            'rejected': '❌'
        };
        statusBtn.textContent = statusIcons[story.status];
        statusBtn.onclick = function(e) {
            e.stopPropagation();
            cycleStoryStatus(columnId, story.id);
        };

        var pointsSpan = document.createElement('span');
        pointsSpan.className = 'story-points';
        pointsSpan.textContent = story.points + ' ' + translate('points');

        var actionsDiv = document.createElement('div');
        actionsDiv.className = 'story-actions';

        var editBtn = document.createElement('button');
        editBtn.className = 'icon-btn';
        editBtn.textContent = '✏️';
        editBtn.onclick = function(e) {
            e.stopPropagation();
            showEditStoryModal(columnId, story.id);
        };

        var deleteBtn = document.createElement('button');
        deleteBtn.className = 'icon-btn';
        deleteBtn.textContent = '🗑️';
        deleteBtn.onclick = function(e) {
            e.stopPropagation();
            deleteStory(columnId, story.id);
        };

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        metaDiv.appendChild(statusBtn);
        metaDiv.appendChild(pointsSpan);
        metaDiv.appendChild(actionsDiv);

        storyDiv.appendChild(titleDiv);
        storyDiv.appendChild(metaDiv);

        return storyDiv;
    }

    function createColumnElement(column) {
        var columnDiv = document.createElement('div');
        columnDiv.className = 'column';
        columnDiv.setAttribute('data-column-id', column.id);
        columnDiv.setAttribute('draggable', 'true');

        columnDiv.ondragstart = function(e) {
            State.draggedColumnElement = columnDiv;
            State.draggedColumnId = column.id;
            columnDiv.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', columnDiv.innerHTML);
        };

        columnDiv.ondragend = function() {
            columnDiv.classList.remove('dragging');
            State.draggedColumnElement = null;
            State.draggedColumnId = null;
            
            var allColumns = document.querySelectorAll('.column');
            allColumns.forEach(function(col) {
                col.classList.remove('drag-over-column');
            });
        };

        columnDiv.ondragover = function(e) {
            e.preventDefault();
            if (State.draggedColumnId && State.draggedColumnId !== column.id) {
                columnDiv.classList.add('drag-over-column');
            }
        };

        columnDiv.ondragleave = function() {
            columnDiv.classList.remove('drag-over-column');
        };

        columnDiv.ondrop = function(e) {
            e.preventDefault();
            e.stopPropagation();
            columnDiv.classList.remove('drag-over-column');
            
            if (State.draggedColumnId && State.draggedColumnId !== column.id) {
                handleColumnDrop(column.id);
            }
        };

        var headerDiv = document.createElement('div');
        headerDiv.className = 'column-header';

        var titleDiv = document.createElement('div');
        titleDiv.className = 'column-title';
        titleDiv.textContent = column.title;
        titleDiv.onclick = function(e) {
            e.stopPropagation();
            showEditColumnModal(column.id);
        };

        var actionsDiv = document.createElement('div');
        actionsDiv.className = 'column-actions';

        var deleteBtn = document.createElement('button');
        deleteBtn.className = 'icon-btn';
        deleteBtn.textContent = '🗑️';
        deleteBtn.onclick = function(e) {
            e.stopPropagation();
            deleteColumn(column.id);
        };

        actionsDiv.appendChild(deleteBtn);
        headerDiv.appendChild(titleDiv);
        headerDiv.appendChild(actionsDiv);

        var storiesDiv = document.createElement('div');
        storiesDiv.className = 'stories-container';
        storiesDiv.setAttribute('data-column-id', column.id);

        storiesDiv.ondragover = function(e) {
            if (State.draggedStoryId) {
                e.preventDefault();
                e.stopPropagation();
                storiesDiv.classList.add('drag-over');
            }
        };

        storiesDiv.ondragleave = function(e) {
            if (State.draggedStoryId) {
                storiesDiv.classList.remove('drag-over');
            }
        };

        storiesDiv.ondrop = function(e) {
            if (State.draggedStoryId) {
                e.preventDefault();
                e.stopPropagation();
                storiesDiv.classList.remove('drag-over');
                handleStoryDrop(column.id);
            }
        };

        column.stories.forEach(function(story) {
            var storyElement = createStoryElement(column.id, story);
            storiesDiv.appendChild(storyElement);
        });

        var addStoryBtn = document.createElement('button');
        addStoryBtn.className = 'add-story-btn';
        addStoryBtn.setAttribute('data-i18n', 'addStory');
        addStoryBtn.textContent = translate('addStory');
        addStoryBtn.onclick = function(e) {
            e.stopPropagation();
            showCreateStoryModal(column.id);
        };

        columnDiv.appendChild(headerDiv);
        columnDiv.appendChild(storiesDiv);
        columnDiv.appendChild(addStoryBtn);

        return columnDiv;
    }

    function createStoryElement(columnId, story) {
        var storyDiv = document.createElement('div');
        storyDiv.className = 'story-card ' + story.status;
        storyDiv.setAttribute('data-story-id', story.id);
        storyDiv.setAttribute('draggable', 'true');

        storyDiv.ondragstart = function(e) {
            State.draggedElement = storyDiv;
            State.draggedStoryId = story.id;
            State.draggedFromColumnId = columnId;
            storyDiv.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        };

        storyDiv.ondragend = function() {
            storyDiv.classList.remove('dragging');
            State.draggedElement = null;
            State.draggedStoryId = null;
            State.draggedFromColumnId = null;
        };

        var headerDiv = document.createElement('div');
        headerDiv.className = 'story-header';

        var titleDiv = document.createElement('div');
        titleDiv.className = 'story-title';
        titleDiv.textContent = story.title;

        var actionsDiv = document.createElement('div');
        actionsDiv.className = 'story-actions';

        var statusBtn = document.createElement('button');
        statusBtn.className = 'story-status-btn';
        var statusIcons = {
            'pending': '⏳',
            'in-progress': '🔄',
            'completed': '✅',
            'rejected': '❌'
        };
        statusBtn.textContent = statusIcons[story.status];
        statusBtn.onclick = function(e) {
            e.stopPropagation();
            cycleStoryStatus(columnId, story.id);
        };

        var editBtn = document.createElement('button');
        editBtn.className = 'icon-btn';
        editBtn.textContent = '✏️';
        editBtn.onclick = function(e) {
            e.stopPropagation();
            showEditStoryModal(columnId, story.id);
        };

        var deleteBtn = document.createElement('button');
        deleteBtn.className = 'icon-btn';
        deleteBtn.textContent = '🗑️';
        deleteBtn.onclick = function(e) {
            e.stopPropagation();
            deleteStory(columnId, story.id);
        };

        actionsDiv.appendChild(statusBtn);
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        headerDiv.appendChild(titleDiv);
        headerDiv.appendChild(actionsDiv);

        storyDiv.appendChild(headerDiv);

        if (story.description) {
            var descDiv = document.createElement('div');
            descDiv.className = 'story-description';
            descDiv.textContent = story.description;
            storyDiv.appendChild(descDiv);
        }

        var metaDiv = document.createElement('div');
        metaDiv.className = 'story-meta';

        var statusSpan = document.createElement('span');
        statusSpan.className = 'story-status ' + story.status;
        statusSpan.textContent = translate('status' + story.status.charAt(0).toUpperCase() + story.status.slice(1).replace('-', ''));

        var pointsSpan = document.createElement('span');
        pointsSpan.className = 'story-points';
        pointsSpan.textContent = story.points + ' ' + translate('points');

        metaDiv.appendChild(statusSpan);
        metaDiv.appendChild(pointsSpan);

        storyDiv.appendChild(metaDiv);

        return storyDiv;
    }

    function handleStoryDrop(toColumnId) {
        if (!State.draggedStoryId || !State.draggedFromColumnId) {
            return;
        }

        if (State.draggedFromColumnId === toColumnId) {
            return;
        }

        getBoard(State.currentBoardId).then(function(board) {
            var fromColumn = board.columns.find(function(col) {
                return col.id === State.draggedFromColumnId;
            });
            var toColumn = board.columns.find(function(col) {
                return col.id === toColumnId;
            });

            var storyIndex = fromColumn.stories.findIndex(function(s) {
                return s.id === State.draggedStoryId;
            });
            var story = fromColumn.stories[storyIndex];

            fromColumn.stories.splice(storyIndex, 1);
            toColumn.stories.push(story);

            saveBoard(board).then(function() {
                renderBoard();
            });
        });
    }

    function handleColumnDrop(toColumnId) {
        if (!State.draggedColumnId || State.draggedColumnId === toColumnId) {
            return;
        }

        getBoard(State.currentBoardId).then(function(board) {
            var fromIndex = board.columns.findIndex(function(col) {
                return col.id === State.draggedColumnId;
            });
            var toIndex = board.columns.findIndex(function(col) {
                return col.id === toColumnId;
            });

            if (fromIndex === -1 || toIndex === -1) {
                return;
            }

            var draggedColumn = board.columns[fromIndex];
            board.columns.splice(fromIndex, 1);
            board.columns.splice(toIndex, 0, draggedColumn);

            saveBoard(board).then(function() {
                renderBoard();
            });
        });
    }

    function clearBoard() {
        var content = '<p>' + translate('clearBoardConfirm') + '</p>';
        
        showModal(translate('clearBoard'), content, function() {
            getBoard(State.currentBoardId).then(function(board) {
                board.columns = [];
                saveBoard(board).then(function() {
                    renderBoard();
                });
            });
        });
    }

    function exportBoard() {
        if (!State.currentBoardId) {
            return;
        }

        getBoard(State.currentBoardId).then(function(board) {
            var dataStr = JSON.stringify(board, null, 2);
            var dataBlob = new Blob([dataStr], { type: 'application/json' });
            var url = URL.createObjectURL(dataBlob);
            var link = document.createElement('a');
            link.href = url;
            link.download = board.name + '_' + new Date().toISOString().split('T')[0] + '.json';
            link.click();
            URL.revokeObjectURL(url);
        });
    }

    function importBoard() {
        Elements.fileInput.click();
    }

    function handleFileImport(event) {
        var file = event.target.files[0];
        if (!file) {
            return;
        }

        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var board = JSON.parse(e.target.result);
                board.id = generateId();
                board.name = board.name + ' (Imported)';
                board.createdAt = new Date().toISOString();
                board.updatedAt = new Date().toISOString();

                saveBoard(board).then(function() {
                    loadBoards().then(function() {
                        State.currentBoardId = board.id;
                        localStorage.setItem('currentBoardId', board.id);
                        Elements.boardSelector.value = board.id;
                        renderBoard();
                    });
                });
            } catch (error) {
                alert(translate('importError'));
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    function bindEvents() {
        Elements.themeToggle.addEventListener('click', toggleTheme);
        Elements.langToggle.addEventListener('click', toggleLanguage);
        Elements.newBoardBtn.addEventListener('click', showCreateBoardModal);
        Elements.exportBtn.addEventListener('click', exportBoard);
        Elements.importBtn.addEventListener('click', importBoard);
        Elements.clearBoardBtn.addEventListener('click', clearBoard);
        Elements.addColumnBtn.addEventListener('click', showCreateColumnModal);
        Elements.modalClose.addEventListener('click', closeModal);
        Elements.modalCancel.addEventListener('click', closeModal);
        Elements.fileInput.addEventListener('change', handleFileImport);

        Elements.viewModeSelector.addEventListener('change', function(e) {
            State.currentViewMode = e.target.value;
            localStorage.setItem('viewMode', State.currentViewMode);
            renderBoard();
        });

        Elements.boardSelector.addEventListener('change', function(e) {
            State.currentBoardId = e.target.value || null;
            if (State.currentBoardId) {
                localStorage.setItem('currentBoardId', State.currentBoardId);
            } else {
                localStorage.removeItem('currentBoardId');
            }
            renderBoard();
        });

        Elements.modalOverlay.addEventListener('click', function(e) {
            if (e.target === Elements.modalOverlay) {
                closeModal();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && Elements.modalOverlay.classList.contains('active')) {
                closeModal();
            }
        });
    }

    function initElements() {
        Elements.viewModeSelector = document.getElementById('viewModeSelector');
        Elements.boardSelector = document.getElementById('boardSelector');
        Elements.boardContainer = document.getElementById('boardContainer');
        Elements.themeToggle = document.getElementById('themeToggle');
        Elements.langToggle = document.getElementById('langToggle');
        Elements.newBoardBtn = document.getElementById('newBoardBtn');
        Elements.exportBtn = document.getElementById('exportBtn');
        Elements.importBtn = document.getElementById('importBtn');
        Elements.clearBoardBtn = document.getElementById('clearBoardBtn');
        Elements.addColumnBtn = document.getElementById('addColumnBtn');
        Elements.modalOverlay = document.getElementById('modalOverlay');
        Elements.modalTitle = document.getElementById('modalTitle');
        Elements.modalContent = document.getElementById('modalContent');
        Elements.modalClose = document.getElementById('modalClose');
        Elements.modalCancel = document.getElementById('modalCancel');
        Elements.modalConfirm = document.getElementById('modalConfirm');
        Elements.fileInput = document.getElementById('fileInput');
    }

    function init() {
        initElements();
        updateTheme();
        Elements.viewModeSelector.value = State.currentViewMode;
        
        initIndexedDB()
            .then(function() {
                return loadTranslations();
            })
            .then(function() {
                return loadBoards();
            })
            .then(function() {
                bindEvents();
                renderBoard();
            })
            .catch(function(error) {
                console.error('Initialization error:', error);
            });
    }

    return {
        init: init
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    StoryMapApp.init();
});

