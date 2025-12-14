import { IndexedDBClient } from '../indexeddb.js';
import { Result, AppError } from '../../core/error.js';
import { logger } from '../../core/logger.js';

export class AnswerRepository {
    constructor(db) {
        this.db = db;
    }

    async create(answer) {
        try {
            await this.db.put('answers', answer);
            logger.info('Answer created', { id: answer.id });
            return Result.ok(answer);
        } catch (error) {
            logger.error('Error creating answer', error);
            return Result.fail(new AppError('خطا در ایجاد پاسخ', 'CREATE_ANSWER_ERROR'));
        }
    }

    async getById(id) {
        try {
            const answer = await this.db.get('answers', id);
            return Result.ok(answer);
        } catch (error) {
            logger.error('Error getting answer by id', error);
            return Result.fail(new AppError('خطا در دریافت پاسخ', 'GET_ANSWER_ERROR'));
        }
    }

    async getByQuestionId(questionId) {
        try {
            const answers = await this.db.query('answers', 'questionId', IDBKeyRange.only(questionId));
            return Result.ok(answers);
        } catch (error) {
            logger.error('Error getting answers by question id', error);
            return Result.fail(new AppError('خطا در دریافت پاسخ‌ها', 'GET_ANSWERS_ERROR'));
        }
    }

    async update(answer) {
        try {
            await this.db.put('answers', answer);
            logger.info('Answer updated', { id: answer.id });
            return Result.ok(answer);
        } catch (error) {
            logger.error('Error updating answer', error);
            return Result.fail(new AppError('خطا در به‌روزرسانی پاسخ', 'UPDATE_ANSWER_ERROR'));
        }
    }

    async delete(id) {
        try {
            await this.db.delete('answers', id);
            logger.info('Answer deleted', { id });
            return Result.ok();
        } catch (error) {
            logger.error('Error deleting answer', error);
            return Result.fail(new AppError('خطا در حذف پاسخ', 'DELETE_ANSWER_ERROR'));
        }
    }
}

