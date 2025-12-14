import { DOM } from '../../core/dom.js';

export class QuestionCard {
    static render(question, author = null) {
        const card = DOM.create('div', { className: 'question-item' });

        const header = DOM.create('div', { className: 'question-header' });
        const titleLink = DOM.create('a', {
            className: 'question-title',
            href: `#/questions/${question.id}`
        }, question.title);
        header.appendChild(titleLink);

        const meta = DOM.create('div', { className: 'question-meta' });
        meta.innerHTML = `
            <span>${author ? author.displayName : 'ناشناس'}</span>
            <span>${new Date(question.createdAt).toLocaleDateString('fa-IR')}</span>
            <span>${question.views || 0} بازدید</span>
            <span>${question.votesScore || 0} رای</span>
        `;

        if (question.tags && question.tags.length > 0) {
            const tagsDiv = DOM.create('div', { className: 'question-tags' });
            question.tags.forEach(tag => {
                const tagEl = DOM.create('span', { className: 'tag' }, tag);
                tagsDiv.appendChild(tagEl);
            });
            card.appendChild(tagsDiv);
        }

        if (question.priority) {
            const priorityBadge = DOM.create('span', {
                className: `priority-badge priority-${question.priority.toLowerCase()}`
            }, question.priority);
            header.appendChild(priorityBadge);
        }

        card.appendChild(header);
        card.appendChild(meta);

        return card;
    }
}

