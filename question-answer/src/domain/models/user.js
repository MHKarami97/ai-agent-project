export class User {
    constructor(data) {
        this.id = data.id || this.generateId();
        this.username = data.username;
        this.displayName = data.displayName || data.username;
        this.role = data.role || 'Employee';
        this.department = data.department || '';
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    generateId() {
        return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    isAdmin() {
        return this.role === 'Admin';
    }

    isModerator() {
        return this.role === 'Moderator' || this.role === 'Admin';
    }

    canEditQuestion(question) {
        return question.authorId === this.id || this.isModerator();
    }

    canEditAnswer(answer) {
        return answer.authorId === this.id || this.isModerator();
    }

    canAcceptAnswer(question) {
        return question.authorId === this.id || this.isModerator();
    }

    toJSON() {
        return {
            id: this.id,
            username: this.username,
            displayName: this.displayName,
            role: this.role,
            department: this.department,
            createdAt: this.createdAt
        };
    }
}

