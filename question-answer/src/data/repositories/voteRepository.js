import { IndexedDBClient } from '../indexeddb.js';
import { Result, AppError } from '../../core/error.js';
import { logger } from '../../core/logger.js';

export class VoteRepository {
    constructor(db) {
        this.db = db;
    }

    async create(vote) {
        try {
            // Check if vote already exists
            const existing = await this.getByUserAndTarget(vote.userId, vote.targetType, vote.targetId);
            if (existing.isOk() && existing.data) {
                // Update existing vote
                vote.id = existing.data.id;
            }
            await this.db.put('votes', vote);
            logger.info('Vote created/updated', { id: vote.id });
            return Result.ok(vote);
        } catch (error) {
            logger.error('Error creating vote', error);
            return Result.fail(new AppError('خطا در ثبت رای', 'CREATE_VOTE_ERROR'));
        }
    }

    async getByUserAndTarget(userId, targetType, targetId) {
        try {
            const votes = await this.db.query('votes', 'userTarget', IDBKeyRange.only([userId, targetType, targetId]));
            return Result.ok(votes.length > 0 ? votes[0] : null);
        } catch (error) {
            logger.error('Error getting vote by user and target', error);
            return Result.fail(new AppError('خطا در دریافت رای', 'GET_VOTE_ERROR'));
        }
    }

    async getByTarget(targetType, targetId) {
        try {
            const allVotes = await this.db.getAll('votes');
            const votes = allVotes.filter(v => v.targetType === targetType && v.targetId === targetId);
            return Result.ok(votes);
        } catch (error) {
            logger.error('Error getting votes by target', error);
            return Result.fail(new AppError('خطا در دریافت رای‌ها', 'GET_VOTES_ERROR'));
        }
    }

    async delete(id) {
        try {
            await this.db.delete('votes', id);
            logger.info('Vote deleted', { id });
            return Result.ok();
        } catch (error) {
            logger.error('Error deleting vote', error);
            return Result.fail(new AppError('خطا در حذف رای', 'DELETE_VOTE_ERROR'));
        }
    }

    async deleteByUserAndTarget(userId, targetType, targetId) {
        try {
            const voteResult = await this.getByUserAndTarget(userId, targetType, targetId);
            if (voteResult.isOk() && voteResult.data) {
                await this.delete(voteResult.data.id);
            }
            return Result.ok();
        } catch (error) {
            logger.error('Error deleting vote by user and target', error);
            return Result.fail(new AppError('خطا در حذف رای', 'DELETE_VOTE_ERROR'));
        }
    }

    async getAll() {
        try {
            const votes = await this.db.getAll('votes');
            return Result.ok(votes);
        } catch (error) {
            logger.error('Error getting all votes', error);
            return Result.fail(new AppError('خطا در دریافت رای‌ها', 'GET_VOTES_ERROR'));
        }
    }
}

