/**
 * Answer Service
 */
import { AnswerRepository } from '../../data/repositories/answerRepository.js';
import { VoteRepository } from '../../data/repositories/voteRepository.js';
import { Answer } from '../models/answer.js';
import { validateAnswer } from '../../core/validation.js';
import { logger } from '../../core/logger.js';

export class AnswerService {
    constructor() {
        this.answerRepo = new AnswerRepository();
        this.voteRepo = new VoteRepository();
    }

    /**
     * Get answers for a question
     * @param {number} questionId - Question ID
     * @returns {Promise<Array<Answer>>}
     */
    async getAnswersByQuestionId(questionId) {
        const answers = await this.answerRepo.findByQuestionId(questionId);
        return answers.map(a => new Answer(a));
    }

    /**
     * Get answer by ID
     * @param {number} id - Answer ID
     * @returns {Promise<Answer|null>}
     */
    async getAnswerById(id) {
        const answer = await this.answerRepo.findById(id);
        return answer ? new Answer(answer) : null;
    }

    /**
     * Create a new answer
     * @param {Object} answerData - Answer data
     * @param {number} authorId - Author ID
     * @returns {Promise<Answer>}
     */
    async createAnswer(answerData, authorId) {
        validateAnswer(answerData);
        
        const data = {
            ...answerData,
            authorId
        };

        const created = await this.answerRepo.create(data);
        return new Answer(created);
    }

    /**
     * Update answer
     * @param {number} id - Answer ID
     * @param {Object} updates - Update data
     * @returns {Promise<Answer>}
     */
    async updateAnswer(id, updates) {
        if (updates.body) {
            validateAnswer(updates);
        }
        const updated = await this.answerRepo.update(id, updates);
        return new Answer(updated);
    }

    /**
     * Delete answer
     * @param {number} id - Answer ID
     * @returns {Promise<void>}
     */
    async deleteAnswer(id) {
        // Delete all votes for this answer
        const votes = await this.voteRepo.findByTarget('answer', id);
        await Promise.all(votes.map(v => this.voteRepo.delete(v.id)));

        return this.answerRepo.delete(id);
    }

    /**
     * Vote on an answer
     * @param {number} answerId - Answer ID
     * @param {number} userId - User ID
     * @param {number} value - Vote value (1 or -1)
     * @returns {Promise<Answer>}
     */
    async voteOnAnswer(answerId, userId, value) {
        // Check if user already voted
        const existingVote = await this.voteRepo.findByUserAndTarget(userId, 'answer', answerId);
        
        if (existingVote && existingVote.value === value) {
            // Same vote - remove it (toggle)
            await this.voteRepo.delete(existingVote.id);
            value = 0; // No vote
        } else {
            // Create or update vote
            await this.voteRepo.upsert({
                userId,
                targetType: 'answer',
                targetId: answerId,
                value
            });
        }

        // Recalculate votes score
        const votes = await this.voteRepo.findByTarget('answer', answerId);
        const votesScore = votes.reduce((sum, v) => sum + v.value, 0);

        const updated = await this.answerRepo.update(answerId, { votesScore });
        return new Answer(updated);
    }
}
