import { IndexedDBClient } from '../indexeddb.js';
import { Result, AppError } from '../../core/error.js';
import { logger } from '../../core/logger.js';

export class QuestionRepository {
    constructor(db) {
        this.db = db;
    }

    async create(question) {
        try {
            await this.db.put('questions', question);
            logger.info('Question created', { id: question.id });
            return Result.ok(question);
        } catch (error) {
            logger.error('Error creating question', error);
            return Result.fail(new AppError('خطا در ایجاد سوال', 'CREATE_QUESTION_ERROR'));
        }
    }

    async getById(id) {
        try {
            const question = await this.db.get('questions', id);
            return Result.ok(question);
        } catch (error) {
            logger.error('Error getting question by id', error);
            return Result.fail(new AppError('خطا در دریافت سوال', 'GET_QUESTION_ERROR'));
        }
    }

    async getAll() {
        try {
            const questions = await this.db.getAll('questions');
            return Result.ok(questions);
        } catch (error) {
            logger.error('Error getting all questions', error);
            return Result.fail(new AppError('خطا در دریافت لیست سوالات', 'GET_QUESTIONS_ERROR'));
        }
    }

    async update(question) {
        try {
            await this.db.put('questions', question);
            logger.info('Question updated', { id: question.id });
            return Result.ok(question);
        } catch (error) {
            logger.error('Error updating question', error);
            return Result.fail(new AppError('خطا در به‌روزرسانی سوال', 'UPDATE_QUESTION_ERROR'));
        }
    }

    async delete(id) {
        try {
            await this.db.delete('questions', id);
            logger.info('Question deleted', { id });
            return Result.ok();
        } catch (error) {
            logger.error('Error deleting question', error);
            return Result.fail(new AppError('خطا در حذف سوال', 'DELETE_QUESTION_ERROR'));
        }
    }

    async getByAuthor(authorId) {
        try {
            const questions = await this.db.query('questions', 'authorId', IDBKeyRange.only(authorId));
            return Result.ok(questions);
        } catch (error) {
            logger.error('Error getting questions by author', error);
            return Result.fail(new AppError('خطا در دریافت سوالات', 'GET_QUESTIONS_ERROR'));
        }
    }
}

