/**
 * Answer Repository
 */
import { dbClient } from '../indexeddb.js';
import { logger } from '../../core/logger.js';
import { AppError } from '../../core/error.js';

export class AnswerRepository {
    constructor() {
        this.storeName = 'answers';
    }

    /**
     * Get all answers for a question
     * @param {number} questionId - Question ID
     * @returns {Promise<Array>}
     */
    async findByQuestionId(questionId) {
        const db = await dbClient.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('questionId');
            const request = index.getAll(questionId);

            request.onsuccess = () => {
                // Sort by votesScore desc, then createdAt asc
                const answers = request.result.sort((a, b) => {
                    if (b.votesScore !== a.votesScore) {
                        return b.votesScore - a.votesScore;
                    }
                    return new Date(a.createdAt) - new Date(b.createdAt);
                });
                logger.debug(`Answers found for question ${questionId}:`, answers.length);
                resolve(answers);
            };

            request.onerror = () => {
                logger.error('Error finding answers:', request.error);
                reject(new AppError('خطا در دریافت پاسخ‌ها', 'DB_ERROR'));
            };
        });
    }

    /**
     * Find answer by ID
     * @param {number} id - Answer ID
     * @returns {Promise<Object|null>}
     */
    async findById(id) {
        const db = await dbClient.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);

            request.onsuccess = () => {
                logger.debug('Answer found:', request.result);
                resolve(request.result || null);
            };

            request.onerror = () => {
                logger.error('Error finding answer:', request.error);
                reject(new AppError('خطا در دریافت پاسخ', 'DB_ERROR'));
            };
        });
    }

    /**
     * Create a new answer
     * @param {Object} answerData - Answer data
     * @returns {Promise<Object>}
     */
    async create(answerData) {
        const db = await dbClient.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const answer = {
                ...answerData,
                votesScore: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const request = store.add(answer);

            request.onsuccess = () => {
                const newAnswer = { ...answer, id: request.result };
                logger.debug('Answer created:', newAnswer);
                resolve(newAnswer);
            };

            request.onerror = () => {
                logger.error('Error creating answer:', request.error);
                reject(new AppError('خطا در ایجاد پاسخ', 'DB_ERROR'));
            };
        });
    }

    /**
     * Update answer
     * @param {number} id - Answer ID
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
                const answer = getRequest.result;
                if (!answer) {
                    reject(new AppError('پاسخ یافت نشد', 'ANSWER_NOT_FOUND'));
                    return;
                }

                const updatedAnswer = {
                    ...answer,
                    ...updates,
                    id,
                    updatedAt: new Date().toISOString()
                };

                const putRequest = store.put(updatedAnswer);
                putRequest.onsuccess = () => {
                    logger.debug('Answer updated:', updatedAnswer);
                    resolve(updatedAnswer);
                };

                putRequest.onerror = () => {
                    logger.error('Error updating answer:', putRequest.error);
                    reject(new AppError('خطا در به‌روزرسانی پاسخ', 'DB_ERROR'));
                };
            };

            getRequest.onerror = () => {
                logger.error('Error getting answer for update:', getRequest.error);
                reject(new AppError('خطا در دریافت پاسخ', 'DB_ERROR'));
            };
        });
    }

    /**
     * Delete answer
     * @param {number} id - Answer ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        const db = await dbClient.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                logger.debug('Answer deleted:', id);
                resolve();
            };

            request.onerror = () => {
                logger.error('Error deleting answer:', request.error);
                reject(new AppError('خطا در حذف پاسخ', 'DB_ERROR'));
            };
        });
    }
}
