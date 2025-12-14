export class Vote {
    constructor(data) {
        this.id = data.id;
        this.userId = data.userId;
        this.targetType = data.targetType; // 'question' or 'answer'
        this.targetId = data.targetId;
        this.value = data.value; // -1 or 1
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            targetType: this.targetType,
            targetId: this.targetId,
            value: this.value
        };
    }
}

