import { IndexedDBClient } from '../indexeddb.js';
import { Result, AppError } from '../../core/error.js';
import { logger } from '../../core/logger.js';

export class UserRepository {
    constructor(db) {
        this.db = db;
    }

    async create(user) {
        try {
            await this.db.put('users', user);
            logger.info('User created', { id: user.id, username: user.username });
            return Result.ok(user);
        } catch (error) {
            logger.error('Error creating user', error);
            return Result.fail(new AppError('خطا در ایجاد کاربر', 'CREATE_USER_ERROR'));
        }
    }

    async getById(id) {
        try {
            const user = await this.db.get('users', id);
            return Result.ok(user);
        } catch (error) {
            logger.error('Error getting user by id', error);
            return Result.fail(new AppError('خطا در دریافت کاربر', 'GET_USER_ERROR'));
        }
    }

    async getByUsername(username) {
        try {
            const users = await this.db.query('users', 'username', IDBKeyRange.only(username));
            return Result.ok(users.length > 0 ? users[0] : null);
        } catch (error) {
            logger.error('Error getting user by username', error);
            return Result.fail(new AppError('خطا در دریافت کاربر', 'GET_USER_ERROR'));
        }
    }

    async getAll() {
        try {
            const users = await this.db.getAll('users');
            return Result.ok(users);
        } catch (error) {
            logger.error('Error getting all users', error);
            return Result.fail(new AppError('خطا در دریافت لیست کاربران', 'GET_USERS_ERROR'));
        }
    }

    async update(user) {
        try {
            await this.db.put('users', user);
            logger.info('User updated', { id: user.id });
            return Result.ok(user);
        } catch (error) {
            logger.error('Error updating user', error);
            return Result.fail(new AppError('خطا در به‌روزرسانی کاربر', 'UPDATE_USER_ERROR'));
        }
    }

    async delete(id) {
        try {
            await this.db.delete('users', id);
            logger.info('User deleted', { id });
            return Result.ok();
        } catch (error) {
            logger.error('Error deleting user', error);
            return Result.fail(new AppError('خطا در حذف کاربر', 'DELETE_USER_ERROR'));
        }
    }
}

