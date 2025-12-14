import { Answer } from '../models/answer.js';
import { AnswerRepository } from '../../data/repositories/answerRepository.js';
import { VoteRepository } from '../../data/repositories/voteRepository.js';
import { QuestionRepository } from '../../data/repositories/questionRepository.js';
import { Result, AppError } from '../../core/error.js';
import { logger } from '../../core/logger.js';

export class AnswerService {
    constructor(answerRepo, voteRepo, questionRepo) {
        this.answerRepo = answerRepo;
        this.voteRepo = voteRepo;
        this.questionRepo = questionRepo;
    }

    getVoteRepo() {
        return this.voteRepo;
    }

    async create(data) {
        try {
            // Verify question exists
            const questionResult = await this.questionRepo.getById(data.questionId);
            if (!questionResult.isOk() || !questionResult.data) {
                return Result.fail(new AppError('سوال یافت نشد', 'QUESTION_NOT_FOUND'));
            }

            const answer = new Answer(data);
            const result = await this.answerRepo.create(answer);
            return result;
        } catch (error) {
            logger.error('Error in answer service create', error);
            return Result.fail(new AppError('خطا در ایجاد پاسخ', 'CREATE_ANSWER_ERROR'));
        }
    }

    async getByQuestionId(questionId) {
        try {
            const result = await this.answerRepo.getByQuestionId(questionId);
            if (!result.isOk()) {
                return result;
            }

            // Sort: accepted first, then by votes
            const answers = result.data.sort((a, b) => {
                // This will be handled in UI based on question.acceptedAnswerId
                return b.votesScore - a.votesScore;
            });

            return Result.ok(answers);
        } catch (error) {
            logger.error('Error in answer service getByQuestionId', error);
            return Result.fail(new AppError('خطا در دریافت پاسخ‌ها', 'GET_ANSWERS_ERROR'));
        }
    }

    async update(id, data, user) {
        try {
            const answerResult = await this.answerRepo.getById(id);
            if (!answerResult.isOk() || !answerResult.data) {
                return Result.fail(new AppError('پاسخ یافت نشد', 'ANSWER_NOT_FOUND'));
            }

            const answer = answerResult.data;
            if (!user.canEditAnswer(answer)) {
                return Result.fail(new AppError('شما اجازه ویرایش این پاسخ را ندارید', 'PERMISSION_DENIED'));
            }

            Object.assign(answer, data);
            answer.updatedAt = new Date().toISOString();

            return await this.answerRepo.update(answer);
        } catch (error) {
            logger.error('Error in answer service update', error);
            return Result.fail(new AppError('خطا در به‌روزرسانی پاسخ', 'UPDATE_ANSWER_ERROR'));
        }
    }

    async delete(id, user) {
        try {
            const answerResult = await this.answerRepo.getById(id);
            if (!answerResult.isOk() || !answerResult.data) {
                return Result.fail(new AppError('پاسخ یافت نشد', 'ANSWER_NOT_FOUND'));
            }

            const answer = answerResult.data;
            if (!user.canEditAnswer(answer)) {
                return Result.fail(new AppError('شما اجازه حذف این پاسخ را ندارید', 'PERMISSION_DENIED'));
            }

            return await this.answerRepo.delete(id);
        } catch (error) {
            logger.error('Error in answer service delete', error);
            return Result.fail(new AppError('خطا در حذف پاسخ', 'DELETE_ANSWER_ERROR'));
        }
    }

    async vote(answerId, userId, value) {
        try {
            const answerResult = await this.answerRepo.getById(answerId);
            if (!answerResult.isOk() || !answerResult.data) {
                return Result.fail(new AppError('پاسخ یافت نشد', 'ANSWER_NOT_FOUND'));
            }

            const existingVoteResult = await this.voteRepo.getByUserAndTarget(userId, 'answer', answerId);
            let existingVote = existingVoteResult.isOk() ? existingVoteResult.data : null;

            const answer = answerResult.data;
            let currentScore = answer.votesScore || 0;

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
                    targetType: 'answer',
                    targetId: answerId,
                    value
                };
                await this.voteRepo.create(vote);
                currentScore += value;
            }

            answer.updateVoteScore(currentScore);
            await this.answerRepo.update(answer);

            return Result.ok({ score: currentScore });
        } catch (error) {
            logger.error('Error in answer service vote', error);
            return Result.fail(new AppError('خطا در ثبت رای', 'VOTE_ERROR'));
        }
    }
}

