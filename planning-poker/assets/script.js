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


var App = (function() {
    var translations = {};
    var currentLanguage = 'fa';
    var currentTheme = 'light';
    var db;
    var currentUser = null;
    var currentRoom = null;
    var isHost = false;

    var CARD_VALUES = [1, 2, 3, 5, 8, 13];
    var DB_NAME = 'PlanningPokerDB';
    var DB_VERSION = 1;

    function init() {
        initDB();
        loadSettings();
        loadTranslations();
        attachEventListeners();
        applyTheme();
        applyLanguage();
        checkExistingSession();
    }

    function initDB() {
        var request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = function() {
            console.error('Database failed to open');
        };

        request.onsuccess = function() {
            db = request.result;
        };

        request.onupgradeneeded = function(e) {
            var db = e.target.result;

            if (!db.objectStoreNames.contains('rooms')) {
                var roomStore = db.createObjectStore('rooms', { keyPath: 'id' });
                roomStore.createIndex('hostId', 'hostId', { unique: false });
            }

            if (!db.objectStoreNames.contains('participants')) {
                var participantStore = db.createObjectStore('participants', { keyPath: 'id', autoIncrement: true });
                participantStore.createIndex('roomId', 'roomId', { unique: false });
            }

            if (!db.objectStoreNames.contains('votes')) {
                var voteStore = db.createObjectStore('votes', { keyPath: 'id', autoIncrement: true });
                voteStore.createIndex('roomId', 'roomId', { unique: false });
                voteStore.createIndex('participantId', 'participantId', { unique: false });
            }
        };
    }

    function loadSettings() {
        currentLanguage = localStorage.getItem('language') || 'fa';
        currentTheme = localStorage.getItem('theme') || 'light';
    }

    function saveSettings() {
        localStorage.setItem('language', currentLanguage);
        localStorage.setItem('theme', currentTheme);
    }

    function loadTranslations() {
        fetch('assets/translations.json')
            .then(function(response) { return response.json(); })
            .then(function(data) {
                translations = data;
                applyLanguage();
            })
            .catch(function(error) {
                console.error('Failed to load translations:', error);
            });
    }

    function applyLanguage() {
        var html = document.documentElement;
        html.setAttribute('lang', currentLanguage);
        html.setAttribute('dir', currentLanguage === 'fa' ? 'rtl' : 'ltr');

        var elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(function(element) {
            var key = element.getAttribute('data-i18n');
            var translation = getTranslation(key);
            if (translation) {
                element.textContent = translation;
            }
        });

        var placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(function(element) {
            var key = element.getAttribute('data-i18n-placeholder');
            var translation = getTranslation(key);
            if (translation) {
                element.setAttribute('placeholder', translation);
            }
        });
    }

    function getTranslation(key) {
        var keys = key.split('.');
        var translation = translations[currentLanguage];
        for (var i = 0; i < keys.length; i++) {
            if (translation && translation[keys[i]]) {
                translation = translation[keys[i]];
            } else {
                return key;
            }
        }
        return translation;
    }

    function applyTheme() {
        document.documentElement.setAttribute('data-theme', currentTheme);
    }

    function attachEventListeners() {
        //document.getElementById('languageToggle').addEventListener('click', toggleLanguage);
        //document.getElementById('themeToggle').addEventListener('click', toggleTheme);
        document.getElementById('createRoomBtn').addEventListener('click', showCreateRoom);
        document.getElementById('joinRoomBtn').addEventListener('click', showJoinRoom);
        document.getElementById('cancelCreate').addEventListener('click', showHome);
        document.getElementById('cancelJoin').addEventListener('click', showHome);
        document.getElementById('createRoomForm').addEventListener('submit', handleCreateRoom);
        document.getElementById('joinRoomForm').addEventListener('submit', handleJoinRoom);
        document.getElementById('leaveRoomBtn').addEventListener('click', handleLeaveRoom);
        document.getElementById('copyRoomId').addEventListener('click', copyRoomId);
        document.getElementById('updateStoryBtn').addEventListener('click', updateStory);
        document.getElementById('revealBtn').addEventListener('click', revealVotes);
        document.getElementById('resetBtn').addEventListener('click', resetVoting);
    }

    function toggleLanguage() {
        currentLanguage = currentLanguage === 'fa' ? 'en' : 'fa';
        saveSettings();
        applyLanguage();
    }

    function toggleTheme() {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        saveSettings();
        applyTheme();
    }

    function showScreen(screenId) {
        var screens = document.querySelectorAll('.screen');
        screens.forEach(function(screen) {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    function showHome() {
        showScreen('homeScreen');
    }

    function showCreateRoom() {
        showScreen('createRoomScreen');
    }

    function showJoinRoom() {
        showScreen('joinRoomScreen');
    }

    function handleCreateRoom(e) {
        e.preventDefault();
        var hostName = document.getElementById('hostName').value.trim();
        var roomName = document.getElementById('roomName').value.trim();

        if (!hostName || !roomName) {
            return;
        }

        var roomId = generateRoomId();
        var room = {
            id: roomId,
            name: roomName,
            hostId: Date.now(),
            story: '',
            revealed: false,
            createdAt: Date.now()
        };

        var transaction = db.transaction(['rooms'], 'readwrite');
        var objectStore = transaction.objectStore('rooms');
        var request = objectStore.add(room);

        request.onsuccess = function() {
            currentUser = {
                id: room.hostId,
                name: hostName,
                roomId: roomId,
                isHost: true
            };
            currentRoom = room;
            isHost = true;

            addParticipant(currentUser);
            showToast(getTranslation('toast.roomCreated'));
            showRoomScreen();
        };

        request.onerror = function() {
            showToast(getTranslation('toast.error'));
        };
    }

    function handleJoinRoom(e) {
        e.preventDefault();
        var participantName = document.getElementById('participantName').value.trim();
        var roomId = document.getElementById('roomId').value.trim().toUpperCase();

        if (!participantName || !roomId) {
            return;
        }

        var transaction = db.transaction(['rooms'], 'readonly');
        var objectStore = transaction.objectStore('rooms');
        var request = objectStore.get(roomId);

        request.onsuccess = function() {
            var room = request.result;
            if (room) {
                currentUser = {
                    id: Date.now(),
                    name: participantName,
                    roomId: roomId,
                    isHost: false
                };
                currentRoom = room;
                isHost = false;

                addParticipant(currentUser);
                showToast(getTranslation('toast.joinedRoom'));
                showRoomScreen();
            } else {
                showToast(getTranslation('toast.roomNotFound'));
            }
        };

        request.onerror = function() {
            showToast(getTranslation('toast.error'));
        };
    }

    function addParticipant(user) {
        var transaction = db.transaction(['participants'], 'readwrite');
        var objectStore = transaction.objectStore('participants');
        objectStore.add({
            userId: user.id,
            name: user.name,
            roomId: user.roomId,
            isHost: user.isHost,
            joinedAt: Date.now()
        });
    }

    function handleLeaveRoom() {
        if (confirm(currentLanguage === 'fa' ? 'آیا مطمئن هستید که می‌خواهید اتاق را ترک کنید؟' : 'Are you sure you want to leave the room?')) {
            currentUser = null;
            currentRoom = null;
            isHost = false;
            showToast(getTranslation('toast.leftRoom'));
            showHome();
        }
    }

    function showRoomScreen() {
        document.getElementById('roomTitle').textContent = currentRoom.name;
        document.getElementById('roomIdDisplay').textContent = currentRoom.id;

        if (isHost) {
            document.getElementById('hostControls').style.display = 'flex';
            document.getElementById('storyInput').disabled = false;
            document.getElementById('updateStoryBtn').style.display = 'block';
        } else {
            document.getElementById('hostControls').style.display = 'none';
            document.getElementById('storyInput').disabled = true;
            document.getElementById('updateStoryBtn').style.display = 'none';
        }

        renderCards();
        updateParticipantsList();
        showScreen('roomScreen');
        startPolling();
    }

    function renderCards() {
        var container = document.getElementById('cardsContainer');
        container.innerHTML = '';

        CARD_VALUES.forEach(function(value) {
            var card = document.createElement('div');
            card.className = 'card';
            card.textContent = value;
            card.setAttribute('data-value', value);
            card.addEventListener('click', function() {
                selectCard(value);
            });
            container.appendChild(card);
        });
    }

    function selectCard(value) {
        if (currentRoom.revealed) {
            return;
        }

        var cards = document.querySelectorAll('.card');
        cards.forEach(function(card) {
            card.classList.remove('selected');
        });

        var selectedCard = document.querySelector('.card[data-value="' + value + '"]');
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }

        saveVote(value);
        showToast(getTranslation('toast.voteCast'));
    }

    function saveVote(value) {
        var transaction = db.transaction(['votes'], 'readwrite');
        var objectStore = transaction.objectStore('votes');
        var index = objectStore.index('participantId');
        var request = index.getAll(currentUser.id);

        request.onsuccess = function() {
            var existingVotes = request.result;
            var currentVote = existingVotes.find(function(v) {
                return v.roomId === currentRoom.id && !currentRoom.revealed;
            });

            if (currentVote) {
                currentVote.value = value;
                objectStore.put(currentVote);
            } else {
                objectStore.add({
                    participantId: currentUser.id,
                    roomId: currentRoom.id,
                    value: value,
                    timestamp: Date.now()
                });
            }

            updateParticipantsList();
        };
    }

    function updateParticipantsList() {
        var transaction = db.transaction(['participants', 'votes'], 'readonly');
        var participantStore = transaction.objectStore('participants');
        var voteStore = transaction.objectStore('votes');
        var participantIndex = participantStore.index('roomId');
        var request = participantIndex.getAll(currentRoom.id);

        request.onsuccess = function() {
            var participants = request.result;
            var voteRequest = voteStore.index('roomId').getAll(currentRoom.id);

            voteRequest.onsuccess = function() {
                var votes = voteRequest.result;
                renderParticipants(participants, votes);
            };
        };
    }

    function renderParticipants(participants, votes) {
        var container = document.getElementById('participantsList');
        container.innerHTML = '';

        var votedCount = 0;
        participants.forEach(function(participant) {
            var vote = votes.find(function(v) {
                return v.participantId === participant.userId && !currentRoom.revealed;
            });

            var card = document.createElement('div');
            card.className = 'participant-card';

            var info = document.createElement('div');
            info.className = 'participant-info';

            var name = document.createElement('div');
            name.className = 'participant-name';
            name.textContent = participant.name;

            var role = document.createElement('div');
            role.className = 'participant-role';
            role.textContent = participant.isHost ? getTranslation('room.host') : getTranslation('room.participant');

            info.appendChild(name);
            info.appendChild(role);

            var status = document.createElement('div');
            status.className = 'participant-status';

            if (currentRoom.revealed && vote) {
                status.classList.add('revealed');
                status.textContent = vote.value;
            } else if (vote) {
                status.classList.add('voted');
                status.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
                votedCount++;
            } else {
                status.classList.add('not-voted');
                status.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
            }

            card.appendChild(info);
            card.appendChild(status);
            container.appendChild(card);
        });

        var voteCountElement = document.getElementById('voteCount');
        voteCountElement.textContent = votedCount + '/' + participants.length;
    }

    function copyRoomId() {
        var roomId = currentRoom.id;
        navigator.clipboard.writeText(roomId).then(function() {
            showToast(getTranslation('toast.roomIdCopied'));
        });
    }

    function updateStory() {
        var story = document.getElementById('storyInput').value.trim();
        var transaction = db.transaction(['rooms'], 'readwrite');
        var objectStore = transaction.objectStore('rooms');
        var request = objectStore.get(currentRoom.id);

        request.onsuccess = function() {
            var room = request.result;
            room.story = story;
            objectStore.put(room);
            currentRoom = room;
            showToast(getTranslation('toast.storyUpdated'));
        };
    }

    function revealVotes() {
        var transaction = db.transaction(['rooms'], 'readwrite');
        var objectStore = transaction.objectStore('rooms');
        var request = objectStore.get(currentRoom.id);

        request.onsuccess = function() {
            var room = request.result;
            room.revealed = true;
            objectStore.put(room);
            currentRoom = room;
            showToast(getTranslation('toast.votesRevealed'));
            showResults();
            updateParticipantsList();
        };
    }

    function resetVoting() {
        if (confirm(currentLanguage === 'fa' ? 'آیا مطمئن هستید که می‌خواهید رای‌گیری را ریست کنید؟' : 'Are you sure you want to reset voting?')) {
            var transaction = db.transaction(['rooms', 'votes'], 'readwrite');
            var roomStore = transaction.objectStore('rooms');
            var voteStore = transaction.objectStore('votes');

            var roomRequest = roomStore.get(currentRoom.id);
            roomRequest.onsuccess = function() {
                var room = roomRequest.result;
                room.revealed = false;
                room.story = '';
                roomStore.put(room);
                currentRoom = room;

                var voteIndex = voteStore.index('roomId');
                var voteRequest = voteIndex.getAll(currentRoom.id);
                voteRequest.onsuccess = function() {
                    var votes = voteRequest.result;
                    votes.forEach(function(vote) {
                        voteStore.delete(vote.id);
                    });

                    document.getElementById('storyInput').value = '';
                    document.getElementById('resultsSection').style.display = 'none';
                    var cards = document.querySelectorAll('.card');
                    cards.forEach(function(card) {
                        card.classList.remove('selected');
                    });

                    showToast(getTranslation('toast.votingReset'));
                    updateParticipantsList();
                };
            };
        }
    }

    function showResults() {
        var transaction = db.transaction(['votes', 'participants'], 'readonly');
        var voteStore = transaction.objectStore('votes');
        var participantStore = transaction.objectStore('participants');

        var voteRequest = voteStore.index('roomId').getAll(currentRoom.id);
        voteRequest.onsuccess = function() {
            var votes = voteRequest.result;
            var participantRequest = participantStore.index('roomId').getAll(currentRoom.id);

            participantRequest.onsuccess = function() {
                var participants = participantRequest.result;
                renderResults(votes, participants);
            };
        };
    }

    function renderResults(votes, participants) {
        var resultsSection = document.getElementById('resultsSection');
        resultsSection.style.display = 'block';

        var resultsContent = document.getElementById('resultsContent');
        resultsContent.innerHTML = '';

        var voteGroups = {};
        votes.forEach(function(vote) {
            if (!voteGroups[vote.value]) {
                voteGroups[vote.value] = [];
            }
            var participant = participants.find(function(p) {
                return p.userId === vote.participantId;
            });
            if (participant) {
                voteGroups[vote.value].push(participant.name);
            }
        });

        var sortedVotes = Object.keys(voteGroups).sort(function(a, b) {
            return Number(a) - Number(b);
        });

        sortedVotes.forEach(function(voteValue) {
            var card = document.createElement('div');
            card.className = 'result-card';

            var value = document.createElement('div');
            value.className = 'result-vote';
            value.textContent = voteValue;

            var names = document.createElement('div');
            names.className = 'result-names';
            names.textContent = voteGroups[voteValue].join(', ');

            card.appendChild(value);
            card.appendChild(names);
            resultsContent.appendChild(card);
        });

        renderStatistics(votes);
    }

    function renderStatistics(votes) {
        var statisticsContent = document.getElementById('statisticsContent');
        statisticsContent.innerHTML = '';

        var values = votes.map(function(v) { return v.value; });
        if (values.length === 0) {
            return;
        }

        var sum = values.reduce(function(a, b) { return a + b; }, 0);
        var average = (sum / values.length).toFixed(1);

        var sortedValues = values.slice().sort(function(a, b) { return a - b; });
        var median;
        var mid = Math.floor(sortedValues.length / 2);
        if (sortedValues.length % 2 === 0) {
            median = ((sortedValues[mid - 1] + sortedValues[mid]) / 2).toFixed(1);
        } else {
            median = sortedValues[mid];
        }

        var frequency = {};
        var maxFreq = 0;
        var mode = [];
        values.forEach(function(val) {
            frequency[val] = (frequency[val] || 0) + 1;
            if (frequency[val] > maxFreq) {
                maxFreq = frequency[val];
                mode = [val];
            } else if (frequency[val] === maxFreq) {
                mode.push(val);
            }
        });

        var uniqueValues = new Set(values);
        var consensus = uniqueValues.size === 1 ? getTranslation('room.yes') : getTranslation('room.no');

        var stats = [
            { label: getTranslation('room.average'), value: average },
            { label: getTranslation('room.median'), value: median },
            { label: getTranslation('room.mode'), value: mode.join(', ') },
            { label: getTranslation('room.consensus'), value: consensus }
        ];

        stats.forEach(function(stat) {
            var row = document.createElement('div');
            row.className = 'stat-row';

            var label = document.createElement('span');
            label.className = 'stat-label';
            label.textContent = stat.label;

            var value = document.createElement('span');
            value.className = 'stat-value';
            value.textContent = stat.value;

            row.appendChild(label);
            row.appendChild(value);
            statisticsContent.appendChild(row);
        });
    }

    function generateRoomId() {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var result = '';
        for (var i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    function showToast(message) {
        var toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(function() {
            toast.classList.remove('show');
        }, 3000);
    }

    function checkExistingSession() {
        var sessionData = localStorage.getItem('currentSession');
        if (sessionData) {
            try {
                var session = JSON.parse(sessionData);
                if (session.roomId && session.userId) {
                    currentUser = session;
                }
            } catch (e) {
                localStorage.removeItem('currentSession');
            }
        }
    }

    function startPolling() {
        setInterval(function() {
            if (currentRoom && currentUser) {
                var transaction = db.transaction(['rooms'], 'readonly');
                var objectStore = transaction.objectStore('rooms');
                var request = objectStore.get(currentRoom.id);

                request.onsuccess = function() {
                    var room = request.result;
                    if (room) {
                        var oldRevealed = currentRoom.revealed;
                        currentRoom = room;

                        if (room.revealed && !oldRevealed) {
                            showResults();
                        }

                        document.getElementById('storyInput').value = room.story;
                        updateParticipantsList();
                    }
                };
            }
        }, 2000);
    }

    return {
        init: init
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    App.init();
});

