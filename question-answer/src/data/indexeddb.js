import { logger } from '../core/logger.js';

export class IndexedDBClient {
    constructor(dbName, version) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
    }

    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                logger.error('IndexedDB open error', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                logger.info('IndexedDB opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createObjectStores(db);
            };
        });
    }

    createObjectStores(db) {
        // Users store
        if (!db.objectStoreNames.contains('users')) {
            const usersStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: false });
            usersStore.createIndex('username', 'username', { unique: true });
            usersStore.createIndex('role', 'role', { unique: false });
        }

        // Questions store
        if (!db.objectStoreNames.contains('questions')) {
            const questionsStore = db.createObjectStore('questions', { keyPath: 'id', autoIncrement: false });
            questionsStore.createIndex('authorId', 'authorId', { unique: false });
            questionsStore.createIndex('createdAt', 'createdAt', { unique: false });
            questionsStore.createIndex('department', 'department', { unique: false });
        }

        // Answers store
        if (!db.objectStoreNames.contains('answers')) {
            const answersStore = db.createObjectStore('answers', { keyPath: 'id', autoIncrement: false });
            answersStore.createIndex('questionId', 'questionId', { unique: false });
            answersStore.createIndex('authorId', 'authorId', { unique: false });
            answersStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Votes store
        if (!db.objectStoreNames.contains('votes')) {
            const votesStore = db.createObjectStore('votes', { keyPath: 'id', autoIncrement: true });
            votesStore.createIndex('userId', 'userId', { unique: false });
            votesStore.createIndex('targetType', 'targetType', { unique: false });
            votesStore.createIndex('targetId', 'targetId', { unique: false });
            votesStore.createIndex('userTarget', ['userId', 'targetType', 'targetId'], { unique: true });
        }

        // Meta store
        if (!db.objectStoreNames.contains('meta')) {
            db.createObjectStore('meta', { keyPath: 'key' });
        }
    }

    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onerror = () => {
                logger.error(`Error getting ${key} from ${storeName}`, request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve(request.result);
            };
        });
    }

    async getAll(storeName, indexName = null, query = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const source = indexName ? store.index(indexName) : store;
            const request = query ? source.getAll(query) : source.getAll();

            request.onerror = () => {
                logger.error(`Error getting all from ${storeName}`, request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve(request.result);
            };
        });
    }

    async getAllKeys(storeName, indexName = null, query = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const source = indexName ? store.index(indexName) : store;
            const request = query ? source.getAllKeys(query) : source.getAllKeys();

            request.onerror = () => {
                logger.error(`Error getting all keys from ${storeName}`, request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve(request.result);
            };
        });
    }

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onerror = () => {
                logger.error(`Error putting data to ${storeName}`, request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve(request.result);
            };
        });
    }

    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onerror = () => {
                logger.error(`Error adding data to ${storeName}`, request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve(request.result);
            };
        });
    }

    async delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onerror = () => {
                logger.error(`Error deleting ${key} from ${storeName}`, request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve();
            };
        });
    }

    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onerror = () => {
                logger.error(`Error clearing ${storeName}`, request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve();
            };
        });
    }

    async count(storeName, indexName = null, query = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const source = indexName ? store.index(indexName) : store;
            const request = query ? source.count(query) : source.count();

            request.onerror = () => {
                logger.error(`Error counting ${storeName}`, request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve(request.result);
            };
        });
    }

    async query(storeName, indexName, range) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.openCursor(range);

            const results = [];
            request.onerror = () => {
                logger.error(`Error querying ${storeName}`, request.error);
                reject(request.error);
            };

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
        });
    }

    async clearAll() {
        const storeNames = ['users', 'questions', 'answers', 'votes', 'meta'];
        for (const storeName of storeNames) {
            await this.clear(storeName);
        }
    }
}

