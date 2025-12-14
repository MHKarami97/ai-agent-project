/**
 * Vote Model
 */
export class Vote {
    constructor(data) {
        this.id = data.id;
        this.userId = data.userId;
        this.targetType = data.targetType; // 'question' or 'answer'
        this.targetId = data.targetId;
        this.value = data.value; // -1 or 1
    }

    isUpvote() {
        return this.value === 1;
    }

    isDownvote() {
        return this.value === -1;
    }
}
