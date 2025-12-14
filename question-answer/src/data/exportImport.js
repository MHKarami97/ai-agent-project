/**
 * Export/Import functionality
 */
import { UserRepository } from './repositories/userRepository.js';
import { QuestionRepository } from './repositories/questionRepository.js';
import { AnswerRepository } from './repositories/answerRepository.js';
import { VoteRepository } from './repositories/voteRepository.js';
import { AppError } from '../core/error.js';
import { logger } from '../core/logger.js';

const SCHEMA_VERSION = 1;

export async function exportData() {
    const userRepo = new UserRepository();
    const questionRepo = new QuestionRepository();
    const answerRepo = new AnswerRepository();
    const voteRepo = new VoteRepository();

    try {
        const [users, questionsResult] = await Promise.all([
            userRepo.findAll(),
            questionRepo.findAll({ page: 1, pageSize: 10000 })
        ]);

        const questions = questionsResult.questions;
        
        // Get all answers
        const answersPromises = questions.map(q => answerRepo.findByQuestionId(q.id));
        const answersResults = await Promise.all(answersPromises);
        const answers = answersResults.flat();

        // Get all votes for questions and answers
        const allVotes = [];
        for (const question of questions) {
            const qVotes = await voteRepo.findByTarget('question', question.id);
            allVotes.push(...qVotes);
        }
        for (const answer of answers) {
            const aVotes = await voteRepo.findByTarget('answer', answer.id);
            allVotes.push(...aVotes);
        }

        const exportData = {
            schemaVersion: SCHEMA_VERSION,
            exportDate: new Date().toISOString(),
            data: {
                users,
                questions,
                answers,
                votes: allVotes
            }
        };

        logger.info('Data exported:', exportData);
        return exportData;
    } catch (error) {
        logger.error('Export error:', error);
        throw new AppError('خطا در خروجی گرفتن داده‌ها', 'EXPORT_ERROR');
    }
}

export async function importData(data, mode = 'replace') {
    if (!data || typeof data !== 'object') {
        throw new AppError('فرمت فایل نامعتبر است', 'INVALID_FORMAT');
    }

    if (!data.schemaVersion || data.schemaVersion !== SCHEMA_VERSION) {
        throw new AppError('نسخه schema فایل با نسخه فعلی سازگار نیست', 'SCHEMA_MISMATCH');
    }

    if (!data.data || typeof data.data !== 'object') {
        throw new AppError('داده‌های فایل نامعتبر است', 'INVALID_DATA');
    }

    const { users, questions, answers, votes } = data.data;

    if (!Array.isArray(users) || !Array.isArray(questions) || !Array.isArray(answers) || !Array.isArray(votes)) {
        throw new AppError('فرمت داده‌ها نامعتبر است', 'INVALID_DATA_FORMAT');
    }

    const userRepo = new UserRepository();
    const questionRepo = new QuestionRepository();
    const answerRepo = new AnswerRepository();
    const voteRepo = new VoteRepository();

    try {
        if (mode === 'replace') {
            // Clear existing data (except current user session)
            // We'll keep the current session user if exists
            const currentUsers = await userRepo.findAll();
            
            // Delete all data
            for (const question of await questionRepo.findAll({ page: 1, pageSize: 10000 }).then(r => r.questions)) {
                await questionRepo.delete(question.id);
            }
            for (const answer of answers) {
                try {
                    await answerRepo.delete(answer.id);
                } catch (e) {
                    // Ignore if doesn't exist
                }
            }
            for (const user of currentUsers) {
                await userRepo.delete(user.id);
            }
        }

        // Import users
        for (const user of users) {
            try {
                await userRepo.create(user);
            } catch (error) {
                if (error.code !== 'DUPLICATE_USERNAME') {
                    logger.warn('Error importing user:', error);
                }
            }
        }

        // Import questions
        for (const question of questions) {
            try {
                await questionRepo.create(question);
            } catch (error) {
                logger.warn('Error importing question:', error);
            }
        }

        // Import answers
        for (const answer of answers) {
            try {
                await answerRepo.create(answer);
            } catch (error) {
                logger.warn('Error importing answer:', error);
            }
        }

        // Import votes
        for (const vote of votes) {
            try {
                await voteRepo.upsert(vote);
            } catch (error) {
                logger.warn('Error importing vote:', error);
            }
        }

        logger.info('Data imported successfully');
        return { success: true, imported: { users: users.length, questions: questions.length, answers: answers.length, votes: votes.length } };
    } catch (error) {
        logger.error('Import error:', error);
        throw new AppError('خطا در وارد کردن داده‌ها', 'IMPORT_ERROR');
    }
}
