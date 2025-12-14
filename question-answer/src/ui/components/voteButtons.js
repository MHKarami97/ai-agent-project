/**
 * Vote Buttons Component
 */
import { createElement } from '../../core/dom.js';

export function createVoteButtons(targetId, targetType, votesScore, userVote, onVote) {
    const upvoteClass = userVote && userVote.value === 1 ? 'active' : '';
    const downvoteClass = userVote && userVote.value === -1 ? 'active' : '';

    return createElement('div', { className: 'vote-section' },
        createElement('button', {
            className: `vote-btn ${upvoteClass}`,
            'aria-label': 'رای مثبت',
            onclick: () => onVote && onVote(targetId, 1)
        }, '▲'),
        createElement('div', { className: 'vote-score' }, votesScore || 0),
        createElement('button', {
            className: `vote-btn ${downvoteClass}`,
            'aria-label': 'رای منفی',
            onclick: () => onVote && onVote(targetId, -1)
        }, '▼')
    );
}
