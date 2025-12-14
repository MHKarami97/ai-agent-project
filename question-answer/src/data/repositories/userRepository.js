/**
 * User Repository
 */
import { dbClient } from '../indexeddb.js';
import { logger } from '../../core/logger.js';
import { AppError } from '../../core/error.js';

export class UserRepository {
    constructor() {
        this.storeName = 'users';
    }

    /**
     * Get all users
     * @returns {Promise<Array>}
     */
    async findAll() {
        const db = await dbClient.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                logger.debug('Users found:', request.result.length);
                resolve(request.result);
            };

            request.onerror = () => {
                logger.error('Error finding users:', request.error);
                reject(new AppError('خطا در دریافت کاربران', 'DB_ERROR'));
            };
        });
    }

    /**
     * Find user by ID
     * @param {number} id - User ID
     * @returns {Promise<Object|null>}
     */
    async findById(id) {
        const db = await dbClient.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);

            request.onsuccess = () => {
                logger.debug('User found:', request.result);
                resolve(request.result || null);
            };

            request.onerror = () => {
                logger.error('Error finding user:', request.error);
                reject(new AppError('خطا در دریافت کاربر', 'DB_ERROR'));
            };
        });
    }

    /**
     * Find user by username
     * @param {string} username - Username
     * @returns {Promise<Object|null>}
     */
    async findByUsername(username) {
        const db = await dbClient.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('username');
            const request = index.get(username);

            request.onsuccess = () => {
                logger.debug('User found by username:', request.result);
                resolve(request.result || null);
            };

            request.onerror = () => {
                logger.error('Error finding user by username:', request.error);
                reject(new AppError('خطا در دریافت کاربر', 'DB_ERROR'));
            };
        });
    }

    /**
     * Create a new user
     * @param {Object} userData - User data
     * @returns {Promise<Object>}
     */
    async create(userData) {
        const db = await dbClient.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const user = {
                ...userData,
                createdAt: new Date().toISOString()
            };

            const request = store.add(user);

            request.onsuccess = () => {
                const newUser = { ...user, id: request.result };
                logger.debug('User created:', newUser);
                resolve(newUser);
            };

            request.onerror = () => {
                if (request.error.name === 'ConstraintError') {
                    reject(new AppError('نام کاربری تکراری است', 'DUPLICATE_USERNAME'));
                } else {
                    logger.error('Error creating user:', request.error);
                    reject(new AppError('خطا در ایجاد کاربر', 'DB_ERROR'));
                }
            };
        });
    }

    /**
     * Update user
     * @param {number} id - User ID
     * @param {Object} updates - Update data
     * @returns {Promise<Object>}
     */
    async update(id, updates) {
        const db = await dbClient.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const user = getRequest.result;
                if (!user) {
                    reject(new AppError('کاربر یافت نشد', 'USER_NOT_FOUND'));
                    return;
                }

                const updatedUser = {
                    ...user,
                    ...updates,
                    id // Ensure ID is not overwritten
                };

                const putRequest = store.put(updatedUser);
                putRequest.onsuccess = () => {
                    logger.debug('User updated:', updatedUser);
                    resolve(updatedUser);
                };

                putRequest.onerror = () => {
                    logger.error('Error updating user:', putRequest.error);
                    reject(new AppError('خطا در به‌روزرسانی کاربر', 'DB_ERROR'));
                };
            };

            getRequest.onerror = () => {
                logger.error('Error getting user for update:', getRequest.error);
                reject(new AppError('خطا در دریافت کاربر', 'DB_ERROR'));
            };
        });
    }

    /**
     * Delete user
     * @param {number} id - User ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        const db = await dbClient.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                logger.debug('User deleted:', id);
                resolve();
            };

            request.onerror = () => {
                logger.error('Error deleting user:', request.error);
                reject(new AppError('خطا در حذف کاربر', 'DB_ERROR'));
            };
        });
    }
}
