import { Question } from '../models/question.js';
import { QuestionRepository } from '../../data/repositories/questionRepository.js';
import { AnswerRepository } from '../../data/repositories/answerRepository.js';
import { VoteRepository } from '../../data/repositories/voteRepository.js';
import { Result, AppError } from '../../core/error.js';
import { logger } from '../../core/logger.js';

export class QuestionService {
    constructor(questionRepo, answerRepo, voteRepo) {
        this.questionRepo = questionRepo;
        this.answerRepo = answerRepo;
        this.voteRepo = voteRepo;
    }

    getVoteRepo() {
        return this.voteRepo;
    }

    async create(data) {
        try {
            const question = new Question(data);
            const result = await this.questionRepo.create(question);
            return result;
        } catch (error) {
            logger.error('Error in question service create', error);
            return Result.fail(new AppError('خطا در ایجاد سوال', 'CREATE_QUESTION_ERROR'));
        }
    }

    async getById(id, incrementViews = false) {
        try {
            const result = await this.questionRepo.getById(id);
            if (result.isOk() && result.data) {
                if (incrementViews) {
                    result.data.incrementViews();
                    await this.questionRepo.update(result.data);
                }
            }
            return result;
        } catch (error) {
            logger.error('Error in question service getById', error);
            return Result.fail(new AppError('خطا در دریافت سوال', 'GET_QUESTION_ERROR'));
        }
    }

    async getAll(sortBy = 'newest', filters = {}) {
        try {
            const result = await this.questionRepo.getAll();
            if (!result.isOk()) {
                return result;
            }

            let questions = result.data;

            // Apply filters
            if (filters.tag) {
                questions = questions.filter(q => q.tags && q.tags.includes(filters.tag));
            }
            if (filters.department) {
                questions = questions.filter(q => q.department === filters.department);
            }
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                questions = questions.filter(q => 
                    q.title.toLowerCase().includes(searchLower) ||
                    q.body.toLowerCase().includes(searchLower)
                );
            }
            if (filters.unanswered) {
                const answersResult = await this.answerRepo.getAll();
                if (answersResult.isOk()) {
                    const answeredIds = new Set(answersResult.data.map(a => a.questionId));
                    questions = questions.filter(q => !answeredIds.has(q.id));
                }
            }

            // Sort
            questions.sort((a, b) => {
                switch (sortBy) {
                    case 'newest':
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    case 'votes':
                        return b.votesScore - a.votesScore;
                    case 'oldest':
                        return new Date(a.createdAt) - new Date(b.createdAt);
                    default:
                        return new Date(b.createdAt) - new Date(a.createdAt);
                }
            });

            return Result.ok(questions);
        } catch (error) {
            logger.error('Error in question service getAll', error);
            return Result.fail(new AppError('خطا در دریافت سوالات', 'GET_QUESTIONS_ERROR'));
        }
    }

    async update(id, data, user) {
        try {
            const questionResult = await this.questionRepo.getById(id);
            if (!questionResult.isOk() || !questionResult.data) {
                return Result.fail(new AppError('سوال یافت نشد', 'QUESTION_NOT_FOUND'));
            }

            const question = questionResult.data;
            if (!user.canEditQuestion(question)) {
                return Result.fail(new AppError('شما اجازه ویرایش این سوال را ندارید', 'PERMISSION_DENIED'));
            }

            Object.assign(question, data);
            question.updatedAt = new Date().toISOString();

            return await this.questionRepo.update(question);
        } catch (error) {
            logger.error('Error in question service update', error);
            return Result.fail(new AppError('خطا در به‌روزرسانی سوال', 'UPDATE_QUESTION_ERROR'));
        }
    }

    async delete(id, user) {
        try {
            const questionResult = await this.questionRepo.getById(id);
            if (!questionResult.isOk() || !questionResult.data) {
                return Result.fail(new AppError('سوال یافت نشد', 'QUESTION_NOT_FOUND'));
            }

            const question = questionResult.data;
            if (!user.canEditQuestion(question)) {
                return Result.fail(new AppError('شما اجازه حذف این سوال را ندارید', 'PERMISSION_DENIED'));
            }

            // Delete related answers and votes
            const answersResult = await this.answerRepo.getByQuestionId(id);
            if (answersResult.isOk()) {
                for (const answer of answersResult.data) {
                    await this.answerRepo.delete(answer.id);
                }
            }

            return await this.questionRepo.delete(id);
        } catch (error) {
            logger.error('Error in question service delete', error);
            return Result.fail(new AppError('خطا در حذف سوال', 'DELETE_QUESTION_ERROR'));
        }
    }

    async vote(questionId, userId, value) {
        try {
            const questionResult = await this.questionRepo.getById(questionId);
            if (!questionResult.isOk() || !questionResult.data) {
                return Result.fail(new AppError('سوال یافت نشد', 'QUESTION_NOT_FOUND'));
            }

            const existingVoteResult = await this.voteRepo.getByUserAndTarget(userId, 'question', questionId);
            let existingVote = existingVoteResult.isOk() ? existingVoteResult.data : null;

            const question = questionResult.data;
            let currentScore = question.votesScore || 0;

            if (existingVote) {
                if (existingVote.value === value) {
                    // Remove vote
                    await this.voteRepo.delete(existingVote.id);
                    currentScore -= value;
                } else {
                    // Change vote
                    existingVote.value = value;
                    await this.voteRepo.create(existingVote);
                    currentScore = currentScore - existingVote.value + value;
                }
            } else {
                // New vote
                const vote = {
                    userId,
                    targetType: 'question',
                    targetId: questionId,
                    value
                };
                await this.voteRepo.create(vote);
                currentScore += value;
            }

            question.updateVoteScore(currentScore);
            await this.questionRepo.update(question);

            return Result.ok({ score: currentScore });
        } catch (error) {
            logger.error('Error in question service vote', error);
            return Result.fail(new AppError('خطا در ثبت رای', 'VOTE_ERROR'));
        }
    }

    async acceptAnswer(questionId, answerId, user) {
        try {
            const questionResult = await this.questionRepo.getById(questionId);
            if (!questionResult.isOk() || !questionResult.data) {
                return Result.fail(new AppError('سوال یافت نشد', 'QUESTION_NOT_FOUND'));
            }

            const question = questionResult.data;
            if (!user.canAcceptAnswer(question)) {
                return Result.fail(new AppError('شما اجازه پذیرش پاسخ را ندارید', 'PERMISSION_DENIED'));
            }

            question.acceptAnswer(answerId);
            return await this.questionRepo.update(question);
        } catch (error) {
            logger.error('Error in question service acceptAnswer', error);
            return Result.fail(new AppError('خطا در پذیرش پاسخ', 'ACCEPT_ANSWER_ERROR'));
        }
    }
}

