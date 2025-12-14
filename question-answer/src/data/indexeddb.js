/**
 * IndexedDB client wrapper
 */
import { logger } from '../core/logger.js';
import { AppError } from '../core/error.js';

const DB_NAME = 'QASystemDB';
const DB_VERSION = 1;

class IndexedDBClient {
    constructor() {
        this.db = null;
        this.initPromise = null;
    }

    /**
     * Initialize database
     * @returns {Promise<IDBDatabase>}
     */
    async init() {
        if (this.db) {
            return this.db;
        }

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                logger.error('IndexedDB open error:', request.error);
                reject(new AppError('خطا در باز کردن پایگاه داده', 'DB_OPEN_ERROR'));
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

        return this.initPromise;
    }

    /**
     * Create object stores and indexes
     * @param {IDBDatabase} db - Database instance
     */
    createObjectStores(db) {
        // Users store
        if (!db.objectStoreNames.contains('users')) {
            const usersStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
            usersStore.createIndex('username', 'username', { unique: true });
            usersStore.createIndex('role', 'role', { unique: false });
        }

        // Questions store
        if (!db.objectStoreNames.contains('questions')) {
            const questionsStore = db.createObjectStore('questions', { keyPath: 'id', autoIncrement: true });
            questionsStore.createIndex('authorId', 'authorId', { unique: false });
            questionsStore.createIndex('createdAt', 'createdAt', { unique: false });
            questionsStore.createIndex('votesScore', 'votesScore', { unique: false });
            questionsStore.createIndex('department', 'department', { unique: false });
        }

        // Answers store
        if (!db.objectStoreNames.contains('answers')) {
            const answersStore = db.createObjectStore('answers', { keyPath: 'id', autoIncrement: true });
            answersStore.createIndex('questionId', 'questionId', { unique: false });
            answersStore.createIndex('authorId', 'authorId', { unique: false });
            answersStore.createIndex('createdAt', 'createdAt', { unique: false });
            answersStore.createIndex('votesScore', 'votesScore', { unique: false });
        }

        // Votes store
        if (!db.objectStoreNames.contains('votes')) {
            const votesStore = db.createObjectStore('votes', { keyPath: 'id', autoIncrement: true });
            votesStore.createIndex('userId', 'userId', { unique: false });
            votesStore.createIndex('targetType', 'targetType', { unique: false });
            votesStore.createIndex('targetId', 'targetId', { unique: false });
            votesStore.createIndex('userTarget', ['userId', 'targetType', 'targetId'], { unique: true });
        }

        // Meta store for settings and schema version
        if (!db.objectStoreNames.contains('meta')) {
            db.createObjectStore('meta', { keyPath: 'key' });
        }
    }

    /**
     * Get database instance
     * @returns {Promise<IDBDatabase>}
     */
    async getDB() {
        if (!this.db) {
            await this.init();
        }
        return this.db;
    }

    /**
     * Clear all data
     * @returns {Promise<void>}
     */
    async clearAll() {
        const db = await this.getDB();
        const transaction = db.transaction(['users', 'questions', 'answers', 'votes', 'meta'], 'readwrite');
        
        await Promise.all([
            this.clearStore(transaction, 'users'),
            this.clearStore(transaction, 'questions'),
            this.clearStore(transaction, 'answers'),
            this.clearStore(transaction, 'votes'),
            this.clearStore(transaction, 'meta')
        ]);
    }

    /**
     * Clear a specific store
     * @param {IDBTransaction} transaction - Transaction
     * @param {string} storeName - Store name
     * @returns {Promise<void>}
     */
    clearStore(transaction, storeName) {
        return new Promise((resolve, reject) => {
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

export const dbClient = new IndexedDBClient();
