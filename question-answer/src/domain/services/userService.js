import { User } from '../models/user.js';
import { UserRepository } from '../../data/repositories/userRepository.js';
import { Result, AppError } from '../../core/error.js';
import { logger } from '../../core/logger.js';

export class UserService {
    constructor(userRepo) {
        this.userRepo = userRepo;
    }

    async login(username) {
        try {
            const result = await this.userRepo.getByUsername(username);
            if (result.isOk() && result.data) {
                return Result.ok(new User(result.data));
            }
            return Result.fail(new AppError('کاربر یافت نشد', 'USER_NOT_FOUND'));
        } catch (error) {
            logger.error('Error in user service login', error);
            return Result.fail(new AppError('خطا در ورود', 'LOGIN_ERROR'));
        }
    }

    async getById(id) {
        try {
            const result = await this.userRepo.getById(id);
            if (result.isOk() && result.data) {
                return Result.ok(new User(result.data));
            }
            return Result.fail(new AppError('کاربر یافت نشد', 'USER_NOT_FOUND'));
        } catch (error) {
            logger.error('Error in user service getById', error);
            return Result.fail(new AppError('خطا در دریافت کاربر', 'GET_USER_ERROR'));
        }
    }

    async create(data) {
        try {
            // Check if username exists
            const existingResult = await this.userRepo.getByUsername(data.username);
            if (existingResult.isOk() && existingResult.data) {
                return Result.fail(new AppError('نام کاربری تکراری است', 'USERNAME_EXISTS'));
            }

            const user = new User(data);
            const result = await this.userRepo.create(user);
            if (result.isOk()) {
                return Result.ok(new User(result.data));
            }
            return result;
        } catch (error) {
            logger.error('Error in user service create', error);
            return Result.fail(new AppError('خطا در ایجاد کاربر', 'CREATE_USER_ERROR'));
        }
    }

    async getAll() {
        try {
            const result = await this.userRepo.getAll();
            if (!result.isOk()) {
                return result;
            }

            const users = result.data.map(u => new User(u));
            return Result.ok(users);
        } catch (error) {
            logger.error('Error in user service getAll', error);
            return Result.fail(new AppError('خطا در دریافت لیست کاربران', 'GET_USERS_ERROR'));
        }
    }

    async update(id, data) {
        try {
            const userResult = await this.userRepo.getById(id);
            if (!userResult.isOk() || !userResult.data) {
                return Result.fail(new AppError('کاربر یافت نشد', 'USER_NOT_FOUND'));
            }

            const user = new User(userResult.data);
            Object.assign(user, data);

            return await this.userRepo.update(user);
        } catch (error) {
            logger.error('Error in user service update', error);
            return Result.fail(new AppError('خطا در به‌روزرسانی کاربر', 'UPDATE_USER_ERROR'));
        }
    }

    async delete(id) {
        try {
            return await this.userRepo.delete(id);
        } catch (error) {
            logger.error('Error in user service delete', error);
            return Result.fail(new AppError('خطا در حذف کاربر', 'DELETE_USER_ERROR'));
        }
    }
}

