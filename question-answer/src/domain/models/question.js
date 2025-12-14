export class Question {
    constructor(data) {
        this.id = data.id || this.generateId();
        this.title = data.title;
        this.body = data.body;
        this.tags = data.tags || [];
        this.department = data.department || '';
        this.priority = data.priority || 'Medium';
        this.authorId = data.authorId;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || this.createdAt;
        this.votesScore = data.votesScore || 0;
        this.views = data.views || 0;
        this.acceptedAnswerId = data.acceptedAnswerId || null;
    }

    generateId() {
        return `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    incrementViews() {
        this.views = (this.views || 0) + 1;
    }

    updateVoteScore(score) {
        this.votesScore = score;
    }

    acceptAnswer(answerId) {
        this.acceptedAnswerId = answerId;
        this.updatedAt = new Date().toISOString();
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            body: this.body,
            tags: this.tags,
            department: this.department,
            priority: this.priority,
            authorId: this.authorId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            votesScore: this.votesScore,
            views: this.views,
            acceptedAnswerId: this.acceptedAnswerId
        };
    }
}

