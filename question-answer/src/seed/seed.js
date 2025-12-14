import { seedData } from './seedData.js';
import { UserRepository } from '../data/repositories/userRepository.js';
import { QuestionRepository } from '../data/repositories/questionRepository.js';
import { AnswerRepository } from '../data/repositories/answerRepository.js';
import { VoteRepository } from '../data/repositories/voteRepository.js';
import { logger } from '../core/logger.js';

export async function seedDatabase(db) {
    try {
        const userRepo = new UserRepository(db);
        const questionRepo = new QuestionRepository(db);
        const answerRepo = new AnswerRepository(db);
        const voteRepo = new VoteRepository(db);

        // Check if already seeded
        const usersResult = await userRepo.getAll();
        if (usersResult.isOk() && usersResult.data && usersResult.data.length > 0) {
            logger.info('Database already seeded, skipping...');
            return;
        }

        logger.info('Seeding database...');

        // Seed users
        for (const user of seedData.users) {
            await userRepo.create(user);
        }

        // Seed questions
        for (const question of seedData.questions) {
            await questionRepo.create(question);
        }

        // Seed answers
        for (const answer of seedData.answers) {
            await answerRepo.create(answer);
        }

        // Seed votes
        for (const vote of seedData.votes) {
            await voteRepo.create(vote);
        }

        logger.info('Database seeded successfully');
    } catch (error) {
        logger.error('Error seeding database', error);
        throw error;
    }
}

