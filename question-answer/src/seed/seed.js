/**
 * Seed script to populate database with initial data
 */
import { UserRepository } from '../data/repositories/userRepository.js';
import { QuestionRepository } from '../data/repositories/questionRepository.js';
import { AnswerRepository } from '../data/repositories/answerRepository.js';
import { VoteRepository } from '../data/repositories/voteRepository.js';
import { seedUsers, seedQuestions, seedAnswers, seedVotes } from './seedData.js';
import { logger } from '../core/logger.js';

export async function seedDatabase() {
    const userRepo = new UserRepository();
    const questionRepo = new QuestionRepository();
    const answerRepo = new AnswerRepository();
    const voteRepo = new VoteRepository();

    try {
        // Check if data already exists
        const existingUsers = await userRepo.findAll();
        if (existingUsers.length > 0) {
            logger.info('Database already has data, skipping seed');
            return { seeded: false, message: 'Database already seeded' };
        }

        logger.info('Starting database seed...');

        // Seed users
        const createdUsers = [];
        for (const userData of seedUsers) {
            const user = await userRepo.create(userData);
            createdUsers.push(user);
            logger.debug('User created:', user);
        }

        // Seed questions (need to map authorId to actual created user IDs)
        const createdQuestions = [];
        for (let i = 0; i < seedQuestions.length; i++) {
            const qData = seedQuestions[i];
            const authorIndex = qData.authorId - 1; // Convert 1-based to 0-based
            const questionData = {
                ...qData,
                authorId: createdUsers[authorIndex].id
            };
            const question = await questionRepo.create(questionData);
            createdQuestions.push(question);
            logger.debug('Question created:', question);
        }

        // Seed answers
        const createdAnswers = [];
        for (let i = 0; i < seedAnswers.length; i++) {
            const aData = seedAnswers[i];
            const questionIndex = aData.questionId - 1;
            const authorIndex = aData.authorId - 1;
            const answerData = {
                ...aData,
                questionId: createdQuestions[questionIndex].id,
                authorId: createdUsers[authorIndex].id
            };
            const answer = await answerRepo.create(answerData);
            createdAnswers.push(answer);
            logger.debug('Answer created:', answer);
        }

        // Seed votes
        for (const voteData of seedVotes) {
            const userIndex = voteData.userId - 1;
            let targetId;
            
            if (voteData.targetType === 'question') {
                const questionIndex = voteData.targetId - 1;
                targetId = createdQuestions[questionIndex].id;
            } else {
                const answerIndex = voteData.targetId - 1;
                targetId = createdAnswers[answerIndex].id;
            }

            const vote = {
                userId: createdUsers[userIndex].id,
                targetType: voteData.targetType,
                targetId: targetId,
                value: voteData.value
            };

            await voteRepo.upsert(vote);
            logger.debug('Vote created:', vote);
        }

        logger.info('Database seed completed successfully');
        return {
            seeded: true,
            users: createdUsers.length,
            questions: createdQuestions.length,
            answers: createdAnswers.length,
            votes: seedVotes.length
        };
    } catch (error) {
        logger.error('Seed error:', error);
        throw error;
    }
}
