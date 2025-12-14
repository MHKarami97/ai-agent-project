export class DOM {
    static $(selector, parent = document) {
        return parent.querySelector(selector);
    }

    static $$(selector, parent = document) {
        return Array.from(parent.querySelectorAll(selector));
    }

    static create(tag, attributes = {}, textContent = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else if (key.startsWith('aria-') || key.startsWith('role')) {
                element.setAttribute(key, value);
            } else {
                element[key] = value;
            }
        });

        if (textContent) {
            element.textContent = textContent;
        }

        return element;
    }

    static safeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static render(parent, content) {
        if (typeof content === 'string') {
            parent.innerHTML = content;
        } else if (content instanceof Node) {
            parent.innerHTML = '';
            parent.appendChild(content);
        } else if (Array.isArray(content)) {
            parent.innerHTML = '';
            content.forEach(node => {
                if (node instanceof Node) {
                    parent.appendChild(node);
                }
            });
        }
    }

    static remove(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    static addClass(element, className) {
        if (element) {
            element.classList.add(className);
        }
    }

    static removeClass(element, className) {
        if (element) {
            element.classList.remove(className);
        }
    }

    static toggleClass(element, className) {
        if (element) {
            element.classList.toggle(className);
        }
    }
}

