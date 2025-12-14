/**
 * Answer Model
 */
export class Answer {
    constructor(data) {
        this.id = data.id;
        this.questionId = data.questionId;
        this.body = data.body;
        this.authorId = data.authorId;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.votesScore = data.votesScore || 0;
    }

    isAccepted(question) {
        return question && question.acceptedAnswerId === this.id;
    }
}
