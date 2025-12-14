/**
 * Utility functions
 */

/**
 * Format date to Persian/Farsi format
 * @param {string} dateString - ISO date string
 * @returns {string}
 */
export function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
        return 'همین الان';
    } else if (diffMins < 60) {
        return `${diffMins} دقیقه پیش`;
    } else if (diffHours < 24) {
        return `${diffHours} ساعت پیش`;
    } else if (diffDays < 7) {
        return `${diffDays} روز پیش`;
    } else {
        return date.toLocaleDateString('fa-IR');
    }
}

/**
 * Parse tags from comma-separated string
 * @param {string} tagsString - Tags string
 * @returns {Array<string>}
 */
export function parseTags(tagsString) {
    if (!tagsString) return [];
    return tagsString
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
}

/**
 * Format tags array to string
 * @param {Array<string>} tags - Tags array
 * @returns {string}
 */
export function formatTags(tags) {
    if (!Array.isArray(tags)) return '';
    return tags.join(', ');
}
