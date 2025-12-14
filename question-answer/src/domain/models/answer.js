export class Answer {
    constructor(data) {
        this.id = data.id || this.generateId();
        this.questionId = data.questionId;
        this.body = data.body;
        this.authorId = data.authorId;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || this.createdAt;
        this.votesScore = data.votesScore || 0;
    }

    generateId() {
        return `answer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    updateVoteScore(score) {
        this.votesScore = score;
    }

    toJSON() {
        return {
            id: this.id,
            questionId: this.questionId,
            body: this.body,
            authorId: this.authorId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            votesScore: this.votesScore
        };
    }
}

