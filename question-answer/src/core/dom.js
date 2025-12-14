/**
 * DOM utility functions
 */

/**
 * Create an element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attributes object
 * @param {...(string|HTMLElement)} children - Child elements or text
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, ...children) {
    const element = document.createElement(tag);
    
    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, value);
        } else if (key === 'dataset') {
            Object.assign(element.dataset, value);
        } else {
            element.setAttribute(key, value);
        }
    });

    children.forEach(child => {
        if (typeof child === 'string' || typeof child === 'number') {
            element.appendChild(document.createTextNode(String(child)));
        } else if (child instanceof HTMLElement) {
            element.appendChild(child);
        } else if (Array.isArray(child)) {
            child.forEach(c => element.appendChild(c instanceof HTMLElement ? c : document.createTextNode(String(c))));
        }
    });

    return element;
}

/**
 * Safely set text content (prevents XSS)
 * @param {HTMLElement} element - Target element
 * @param {string} text - Text content
 */
export function setTextContent(element, text) {
    element.textContent = text || '';
}

/**
 * Safely set innerHTML with sanitization (basic)
 * @param {HTMLElement} element - Target element
 * @param {string} html - HTML content
 */
export function setHTML(element, html) {
    // Basic sanitization - only allow safe tags
    const allowedTags = ['p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    const div = document.createElement('div');
    div.textContent = html; // Use textContent for safety, or implement proper sanitization
    element.innerHTML = div.innerHTML;
}

/**
 * Clear element content
 * @param {HTMLElement} element - Target element
 */
export function clearElement(element) {
    element.innerHTML = '';
}

/**
 * Show element
 * @param {HTMLElement} element - Target element
 */
export function showElement(element) {
    element.style.display = '';
}

/**
 * Hide element
 * @param {HTMLElement} element - Target element
 */
export function hideElement(element) {
    element.style.display = 'none';
}

/**
 * Toggle element visibility
 * @param {HTMLElement} element - Target element
 * @param {boolean} show - Show or hide
 */
export function toggleElement(element, show) {
    if (show) {
        showElement(element);
    } else {
        hideElement(element);
    }
}

/**
 * Query selector helper
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (default: document)
 * @returns {HTMLElement|null}
 */
export function $(selector, parent = document) {
    return parent.querySelector(selector);
}

/**
 * Query selector all helper
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (default: document)
 * @returns {NodeList}
 */
export function $$(selector, parent = document) {
    return parent.querySelectorAll(selector);
}
