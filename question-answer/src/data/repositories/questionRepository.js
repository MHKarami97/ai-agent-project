/**
 * Question Repository
 */
import { dbClient } from '../indexeddb.js';
import { logger } from '../../core/logger.js';
import { AppError } from '../../core/error.js';

export class QuestionRepository {
    constructor() {
        this.storeName = 'questions';
    }

    /**
     * Get all questions with pagination
     * @param {Object} options - Query options
     * @returns {Promise<{questions: Array, total: number}>}
     */
    async findAll(options = {}) {
        const {
            page = 1,
            pageSize = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            tag = null,
            department = null,
            search = null
        } = options;

        const db = await dbClient.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                let questions = request.result;

                // Filter by tag
                if (tag) {
                    questions = questions.filter(q => q.tags && q.tags.includes(tag));
                }

                // Filter by department
                if (department) {
                    questions = questions.filter(q => q.department === department);
                }

                // Search in title
                if (search) {
                    const searchLower = search.toLowerCase();
                    questions = questions.filter(q => 
                        q.title.toLowerCase().includes(searchLower)
                    );
                }

                // Sort
                questions.sort((a, b) => {
                    let aVal = a[sortBy];
                    let bVal = b[sortBy];

                    if (sortBy === 'createdAt') {
                        aVal = new Date(aVal).getTime();
                        bVal = new Date(bVal).getTime();
                    }

                    if (sortOrder === 'asc') {
                        return aVal > bVal ? 1 : -1;
                    } else {
                        return aVal < bVal ? 1 : -1;
                    }
                });

                const total = questions.length;
                const start = (page - 1) * pageSize;
                const end = start + pageSize;
                const paginatedQuestions = questions.slice(start, end);

                logger.debug(`Questions found: ${paginatedQuestions.length} of ${total}`);
                resolve({ questions: paginatedQuestions, total });
            };

            request.onerror = () => {
                logger.error('Error finding questions:', request.error);
                reject(new AppError('خطا در دریافت سوال‌ها', 'DB_ERROR'));
            };
        });
    }

    /**
     * Find question by ID
     * @param {number} id - Question ID
     * @returns {Promise<Object|null>}
     */
    async findById(id) {
        const db = await dbClient.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);

            request.onsuccess = () => {
                const question = request.result;
                if (question) {
                    // Increment views
                    question.views = (question.views || 0) + 1;
                    const updateRequest = store.put(question);
                    updateRequest.onsuccess = () => {
                        logger.debug('Question found and views updated:', question);
                        resolve(question);
                    };
                    updateRequest.onerror = () => {
                        logger.warn('Error updating views:', updateRequest.error);
                        resolve(question); // Still return question even if view update fails
                    };
                } else {
                    resolve(null);
                }
            };

            request.onerror = () => {
                logger.error('Error finding question:', request.error);
                reject(new AppError('خطا در دریافت سوال', 'DB_ERROR'));
            };
        });
    }

    /**
     * Create a new question
     * @param {Object} questionData - Question data
     * @returns {Promise<Object>}
     */
    async create(questionData) {
        const db = await dbClient.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const question = {
                ...questionData,
                votesScore: 0,
                views: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const request = store.add(question);

            request.onsuccess = () => {
                const newQuestion = { ...question, id: request.result };
                logger.debug('Question created:', newQuestion);
                resolve(newQuestion);
            };

            request.onerror = () => {
                logger.error('Error creating question:', request.error);
                reject(new AppError('خطا در ایجاد سوال', 'DB_ERROR'));
            };
        });
    }

    /**
     * Update question
     * @param {number} id - Question ID
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
                const question = getRequest.result;
                if (!question) {
                    reject(new AppError('سوال یافت نشد', 'QUESTION_NOT_FOUND'));
                    return;
                }

                const updatedQuestion = {
                    ...question,
                    ...updates,
                    id,
                    updatedAt: new Date().toISOString()
                };

                const putRequest = store.put(updatedQuestion);
                putRequest.onsuccess = () => {
                    logger.debug('Question updated:', updatedQuestion);
                    resolve(updatedQuestion);
                };

                putRequest.onerror = () => {
                    logger.error('Error updating question:', putRequest.error);
                    reject(new AppError('خطا در به‌روزرسانی سوال', 'DB_ERROR'));
                };
            };

            getRequest.onerror = () => {
                logger.error('Error getting question for update:', getRequest.error);
                reject(new AppError('خطا در دریافت سوال', 'DB_ERROR'));
            };
        });
    }

    /**
     * Delete question
     * @param {number} id - Question ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        const db = await dbClient.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                logger.debug('Question deleted:', id);
                resolve();
            };

            request.onerror = () => {
                logger.error('Error deleting question:', request.error);
                reject(new AppError('خطا در حذف سوال', 'DB_ERROR'));
            };
        });
    }
}
