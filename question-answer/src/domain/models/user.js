/**
 * User Model
 */
export class User {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.displayName = data.displayName || data.username;
        this.role = data.role || 'Employee';
        this.department = data.department || null;
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    isAdmin() {
        return this.role === 'Admin';
    }

    isModerator() {
        return this.role === 'Moderator' || this.role === 'Admin';
    }

    isEmployee() {
        return this.role === 'Employee';
    }

    canEditQuestion(question) {
        return this.id === question.authorId || this.isModerator();
    }

    canEditAnswer(answer) {
        return this.id === answer.authorId || this.isModerator();
    }

    canAcceptAnswer(question) {
        return this.id === question.authorId || this.isModerator();
    }
}
