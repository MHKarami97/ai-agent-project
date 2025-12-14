/**
 * Vote Repository
 */
import { dbClient } from '../indexeddb.js';
import { logger } from '../../core/logger.js';
import { AppError } from '../../core/error.js';

export class VoteRepository {
    constructor() {
        this.storeName = 'votes';
    }

    /**
     * Find vote by user and target
     * @param {number} userId - User ID
     * @param {string} targetType - 'question' or 'answer'
     * @param {number} targetId - Target ID
     * @returns {Promise<Object|null>}
     */
    async findByUserAndTarget(userId, targetType, targetId) {
        const db = await dbClient.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('userTarget');
            const key = [userId, targetType, targetId];
            const request = index.get(key);

            request.onsuccess = () => {
                logger.debug('Vote found:', request.result);
                resolve(request.result || null);
            };

            request.onerror = () => {
                logger.error('Error finding vote:', request.error);
                reject(new AppError('خطا در دریافت رای', 'DB_ERROR'));
            };
        });
    }

    /**
     * Get all votes for a target
     * @param {string} targetType - 'question' or 'answer'
     * @param {number} targetId - Target ID
     * @returns {Promise<Array>}
     */
    async findByTarget(targetType, targetId) {
        const db = await dbClient.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('targetId');
            const request = index.getAll(targetId);

            request.onsuccess = () => {
                const votes = request.result.filter(v => v.targetType === targetType);
                logger.debug(`Votes found for ${targetType} ${targetId}:`, votes.length);
                resolve(votes);
            };

            request.onerror = () => {
                logger.error('Error finding votes:', request.error);
                reject(new AppError('خطا در دریافت رای‌ها', 'DB_ERROR'));
            };
        });
    }

    /**
     * Create or update a vote
     * @param {Object} voteData - Vote data
     * @returns {Promise<Object>}
     */
    async upsert(voteData) {
        const db = await dbClient.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('userTarget');
            const key = [voteData.userId, voteData.targetType, voteData.targetId];
            const getRequest = index.get(key);

            getRequest.onsuccess = () => {
                const existingVote = getRequest.result;
                
                if (existingVote) {
                    // Update existing vote
                    const updatedVote = {
                        ...existingVote,
                        value: voteData.value
                    };
                    const putRequest = store.put(updatedVote);
                    putRequest.onsuccess = () => {
                        logger.debug('Vote updated:', updatedVote);
                        resolve(updatedVote);
                    };
                    putRequest.onerror = () => {
                        logger.error('Error updating vote:', putRequest.error);
                        reject(new AppError('خطا در به‌روزرسانی رای', 'DB_ERROR'));
                    };
                } else {
                    // Create new vote
                    const vote = {
                        ...voteData
                    };
                    const addRequest = store.add(vote);
                    addRequest.onsuccess = () => {
                        const newVote = { ...vote, id: addRequest.result };
                        logger.debug('Vote created:', newVote);
                        resolve(newVote);
                    };
                    addRequest.onerror = () => {
                        logger.error('Error creating vote:', addRequest.error);
                        reject(new AppError('خطا در ایجاد رای', 'DB_ERROR'));
                    };
                }
            };

            getRequest.onerror = () => {
                logger.error('Error checking existing vote:', getRequest.error);
                reject(new AppError('خطا در بررسی رای موجود', 'DB_ERROR'));
            };
        });
    }

    /**
     * Delete vote
     * @param {number} id - Vote ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        const db = await dbClient.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                logger.debug('Vote deleted:', id);
                resolve();
            };

            request.onerror = () => {
                logger.error('Error deleting vote:', request.error);
                reject(new AppError('خطا در حذف رای', 'DB_ERROR'));
            };
        });
    }

    /**
     * Delete vote by user and target
     * @param {number} userId - User ID
     * @param {string} targetType - 'question' or 'answer'
     * @param {number} targetId - Target ID
     * @returns {Promise<void>}
     */
    async deleteByUserAndTarget(userId, targetType, targetId) {
        const vote = await this.findByUserAndTarget(userId, targetType, targetId);
        if (vote) {
            return this.delete(vote.id);
        }
    }
}
