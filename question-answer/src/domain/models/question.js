/**
 * Question Model
 */
export class Question {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.body = data.body;
        this.tags = data.tags || [];
        this.department = data.department || null;
        this.priority = data.priority || 'Medium';
        this.authorId = data.authorId;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.votesScore = data.votesScore || 0;
        this.views = data.views || 0;
        this.acceptedAnswerId = data.acceptedAnswerId || null;
    }

    hasAcceptedAnswer() {
        return this.acceptedAnswerId !== null;
    }

    getPriorityClass() {
        return `priority-${this.priority.toLowerCase()}`;
    }
}
