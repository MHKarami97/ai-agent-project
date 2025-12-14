/**
 * Question Card Component
 */
import { createElement } from '../../core/dom.js';
import { formatDate } from '../../core/utils.js';

export function createQuestionCard(question, author, currentUser, userVote, onVote, onEdit, onDelete) {
    const upvoteClass = userVote && userVote.value === 1 ? 'active' : '';
    const downvoteClass = userVote && userVote.value === -1 ? 'active' : '';

    const card = createElement('div', { className: 'card' },
        createElement('div', { className: 'card-header' },
            createElement('div', {},
                createElement('h3', { className: 'card-title' },
                    createElement('a', {
                        href: `#/questions/${question.id}`,
                        onclick: (e) => {
                            e.preventDefault();
                            window.location.hash = `#/questions/${question.id}`;
                        }
                    }, question.title)
                ),
                createElement('div', { className: 'card-meta' },
                    createElement('span', {}, `نویسنده: ${author ? author.displayName : 'نامشخص'}`),
                    createElement('span', {}, formatDate(question.createdAt)),
                    question.department && createElement('span', {}, `دپارتمان: ${question.department}`),
                    createElement('span', { className: `priority-badge ${question.getPriorityClass()}` }, question.priority)
                )
            ),
            createElement('div', { className: 'vote-section' },
                createElement('button', {
                    className: `vote-btn ${upvoteClass}`,
                    'aria-label': 'رای مثبت',
                    onclick: () => onVote && onVote(question.id, 1)
                }, '▲'),
                createElement('div', { className: 'vote-score' }, question.votesScore || 0),
                createElement('button', {
                    className: `vote-btn ${downvoteClass}`,
                    'aria-label': 'رای منفی',
                    onclick: () => onVote && onVote(question.id, -1)
                }, '▼')
            )
        ),
        createElement('div', { className: 'card-body' }, question.body.substring(0, 200) + (question.body.length > 200 ? '...' : '')),
        createElement('div', { className: 'card-footer' },
            createElement('div', { className: 'tags' },
                ...question.tags.map(tag => createElement('span', { className: 'tag' }, tag))
            ),
            createElement('div', {},
                createElement('span', { style: { marginLeft: '1rem', color: 'var(--text-secondary)' } }, 
                    `${question.views || 0} بازدید`
                ),
                question.hasAcceptedAnswer() && createElement('span', { 
                    className: 'accepted-badge',
                    style: { marginRight: '0.5rem' }
                }, '✓ پاسخ پذیرفته شده'),
                currentUser && currentUser.canEditQuestion(question) && createElement('div', { style: { display: 'inline-flex', gap: '0.5rem', marginTop: '0.5rem' } },
                    createElement('button', {
                        className: 'btn btn-sm btn-outline',
                        onclick: () => onEdit && onEdit(question)
                    }, 'ویرایش'),
                    createElement('button', {
                        className: 'btn btn-sm btn-danger',
                        onclick: () => {
                            if (confirm('آیا از حذف این سوال اطمینان دارید؟')) {
                                onDelete && onDelete(question.id);
                            }
                        }
                    }, 'حذف')
                )
            )
        )
    );

    return card;
}
