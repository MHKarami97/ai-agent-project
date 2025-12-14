import { Result, AppError } from '../core/error.js';
import { logger } from '../core/logger.js';

export class ExportImportService {
    constructor(userRepo, questionRepo, answerRepo, voteRepo) {
        this.userRepo = userRepo;
        this.questionRepo = questionRepo;
        this.answerRepo = answerRepo;
        this.voteRepo = voteRepo;
    }

    async export() {
        try {
            const usersResult = await this.userRepo.getAll();
            const questionsResult = await this.questionRepo.getAll();
            const answersResult = await this.answerRepo.getAll();
            const votesResult = await this.voteRepo.getAll();

            if (!usersResult.isOk() || !questionsResult.isOk() || !answersResult.isOk()) {
                return Result.fail(new AppError('خطا در خواندن داده‌ها', 'EXPORT_ERROR'));
            }

            const data = {
                version: '1.0.0',
                exportedAt: new Date().toISOString(),
                users: usersResult.data || [],
                questions: questionsResult.data || [],
                answers: answersResult.data || [],
                votes: votesResult.data || []
            };

            return Result.ok(data);
        } catch (error) {
            logger.error('Error in export', error);
            return Result.fail(new AppError('خطا در خروجی گرفتن', 'EXPORT_ERROR'));
        }
    }

    async import(data, mode = 'merge') {
        try {
            if (!data || typeof data !== 'object') {
                return Result.fail(new AppError('داده نامعتبر است', 'IMPORT_ERROR'));
            }

            if (!data.version) {
                return Result.fail(new AppError('نسخه schema مشخص نیست', 'IMPORT_ERROR'));
            }

            if (mode === 'replace') {
                // Clear all data
                const db = this.userRepo.db;
                if (db) {
                    await db.clear('users');
                    await db.clear('questions');
                    await db.clear('answers');
                    await db.clear('votes');
                }
            }

            // Import users
            if (data.users && Array.isArray(data.users)) {
                for (const user of data.users) {
                    await this.userRepo.create(user);
                }
            }

            // Import questions
            if (data.questions && Array.isArray(data.questions)) {
                for (const question of data.questions) {
                    await this.questionRepo.create(question);
                }
            }

            // Import answers
            if (data.answers && Array.isArray(data.answers)) {
                for (const answer of data.answers) {
                    await this.answerRepo.create(answer);
                }
            }

            // Import votes
            if (data.votes && Array.isArray(data.votes)) {
                for (const vote of data.votes) {
                    await this.voteRepo.create(vote);
                }
            }

            return Result.ok();
        } catch (error) {
            logger.error('Error in import', error);
            return Result.fail(new AppError('خطا در وارد کردن داده‌ها', 'IMPORT_ERROR'));
        }
    }
}

