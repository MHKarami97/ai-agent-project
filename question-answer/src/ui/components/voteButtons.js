import { DOM } from '../../core/dom.js';

export class VoteButtons {
    static render(currentVote, score, onVote) {
        const container = DOM.create('div', { className: 'vote-section' });

        const upBtn = DOM.create('button', {
            className: `vote-btn ${currentVote === 1 ? 'active' : ''}`,
            'aria-label': 'رای مثبت'
        }, '▲');
        upBtn.addEventListener('click', () => onVote(1));

        const scoreEl = DOM.create('span', { className: 'vote-score' }, score || 0);

        const downBtn = DOM.create('button', {
            className: `vote-btn ${currentVote === -1 ? 'active' : ''}`,
            'aria-label': 'رای منفی'
        }, '▼');
        downBtn.addEventListener('click', () => onVote(-1));

        container.appendChild(upBtn);
        container.appendChild(scoreEl);
        container.appendChild(downBtn);

        return container;
    }
}

