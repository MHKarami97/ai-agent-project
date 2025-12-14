/**
 * Question Service
 */
import { QuestionRepository } from '../../data/repositories/questionRepository.js';
import { AnswerRepository } from '../../data/repositories/answerRepository.js';
import { VoteRepository } from '../../data/repositories/voteRepository.js';
import { Question } from '../models/question.js';
import { validateQuestion } from '../../core/validation.js';
import { sanitizeTags } from '../../core/validation.js';
import { logger } from '../../core/logger.js';

export class QuestionService {
    constructor() {
        this.questionRepo = new QuestionRepository();
        this.answerRepo = new AnswerRepository();
        this.voteRepo = new VoteRepository();
    }

    /**
     * Get questions with filters and pagination
     * @param {Object} options - Query options
     * @returns {Promise<{questions: Array<Question>, total: number}>}
     */
    async getQuestions(options = {}) {
        const result = await this.questionRepo.findAll(options);
        return {
            questions: result.questions.map(q => new Question(q)),
            total: result.total
        };
    }

    /**
     * Get question by ID with answers
     * @param {number} id - Question ID
     * @returns {Promise<{question: Question, answers: Array}>}
     */
    async getQuestionById(id) {
        const question = await this.questionRepo.findById(id);
        if (!question) {
            return null;
        }

        const answers = await this.answerRepo.findByQuestionId(id);
        return {
            question: new Question(question),
            answers: answers.map(a => ({ ...a }))
        };
    }

    /**
     * Create a new question
     * @param {Object} questionData - Question data
     * @param {number} authorId - Author ID
     * @returns {Promise<Question>}
     */
    async createQuestion(questionData, authorId) {
        validateQuestion(questionData);
        
        const data = {
            ...questionData,
            tags: sanitizeTags(questionData.tags),
            authorId
        };

        const created = await this.questionRepo.create(data);
        return new Question(created);
    }

    /**
     * Update question
     * @param {number} id - Question ID
     * @param {Object} updates - Update data
     * @returns {Promise<Question>}
     */
    async updateQuestion(id, updates) {
        if (updates.tags) {
            updates.tags = sanitizeTags(updates.tags);
        }
        if (updates.title || updates.body) {
            validateQuestion(updates);
        }
        const updated = await this.questionRepo.update(id, updates);
        return new Question(updated);
    }

    /**
     * Delete question and its answers
     * @param {number} id - Question ID
     * @returns {Promise<void>}
     */
    async deleteQuestion(id) {
        // Delete all answers for this question
        const answers = await this.answerRepo.findByQuestionId(id);
        await Promise.all(answers.map(a => this.answerRepo.delete(a.id)));

        // Delete all votes for this question
        const votes = await this.voteRepo.findByTarget('question', id);
        await Promise.all(votes.map(v => this.voteRepo.delete(v.id)));

        // Delete question
        return this.questionRepo.delete(id);
    }

    /**
     * Accept an answer
     * @param {number} questionId - Question ID
     * @param {number} answerId - Answer ID
     * @returns {Promise<Question>}
     */
    async acceptAnswer(questionId, answerId) {
        const updated = await this.questionRepo.update(questionId, {
            acceptedAnswerId: answerId
        });
        return new Question(updated);
    }

    /**
     * Vote on a question
     * @param {number} questionId - Question ID
     * @param {number} userId - User ID
     * @param {number} value - Vote value (1 or -1)
     * @returns {Promise<Question>}
     */
    async voteOnQuestion(questionId, userId, value) {
        // Check if user already voted
        const existingVote = await this.voteRepo.findByUserAndTarget(userId, 'question', questionId);
        
        if (existingVote && existingVote.value === value) {
            // Same vote - remove it (toggle)
            await this.voteRepo.delete(existingVote.id);
            value = 0; // No vote
        } else {
            // Create or update vote
            await this.voteRepo.upsert({
                userId,
                targetType: 'question',
                targetId: questionId,
                value
            });
        }

        // Recalculate votes score
        const votes = await this.voteRepo.findByTarget('question', questionId);
        const votesScore = votes.reduce((sum, v) => sum + v.value, 0);

        const updated = await this.questionRepo.update(questionId, { votesScore });
        return new Question(updated);
    }
}
