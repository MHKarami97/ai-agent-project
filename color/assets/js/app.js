// Theme Manager
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.applyTheme();
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.currentTheme);
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        this.applyTheme();
    }

    getTheme() {
        return this.currentTheme;
    }
}

const themeManager = new ThemeManager();

// I18n System
class I18n {
    constructor() {
        this.translations = {};
        this.currentLang = localStorage.getItem('lang') || 'fa';
        this.loadTranslations();
    }

    async loadTranslations() {
        try {
            const response = await fetch('assets/translations.json');
            this.translations = await response.json();
            this.applyTranslations();
        } catch (error) {
            console.error('Failed to load translations:', error);
        }
    }

    t(key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];
        
        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                return key;
            }
        }
        
        return value;
    }

    applyTranslations() {
        const html = document.documentElement;
        html.setAttribute('lang', this.currentLang);
        html.setAttribute('dir', this.currentLang === 'fa' ? 'rtl' : 'ltr');
        
        // Update all elements with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' && element.type !== 'checkbox') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Update document title
        const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
        if (titleKey) {
            document.title = this.t(titleKey);
        }
    }

    switchLanguage() {
        this.currentLang = this.currentLang === 'fa' ? 'en' : 'fa';
        localStorage.setItem('lang', this.currentLang);
        this.applyTranslations();
    }
}

const i18n = new I18n();



// Listen to tool-wrapper theme changes
window.addEventListener('themeChanged', (e) => {
    themeManager.currentTheme = e.detail;
    themeManager.applyTheme();
});

// Listen to tool-wrapper language changes
window.addEventListener('languageChanged', (e) => {
    const newLang = e.detail;
    localStorage.setItem('lang', newLang);
    // Reload page to apply language changes
    location.reload();
});


const paletteDisplay = document.getElementById('paletteDisplay');
const randomizeBtn = document.getElementById('randomizeBtn');
const copyCssBtn = document.getElementById('copyCssBtn');
const colorPicker = document.getElementById('colorPicker');
const countRange = document.getElementById('countRange');
const countIndicator = document.getElementById('countIndicator');
const paletteNameInput = document.getElementById('paletteName');
const savePaletteBtn = document.getElementById('savePaletteBtn');
const savedPalettesGrid = document.getElementById('savedPalettes');
const toast = document.getElementById('toast');

let currentPalette = [];

function randomBaseColor() {
    const color = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
    colorPicker.value = `#${color}`;
}

function generatePalette(baseHex, count) {
    const baseHue = parseInt(baseHex.slice(1, 3), 16);
    const baseSat = parseInt(baseHex.slice(3, 5), 16);
    const baseLum = parseInt(baseHex.slice(5, 7), 16);

    const palette = [];
    for (let i = 0; i < count; i += 1) {
        const hueShift = Math.round((i - (count - 1) / 2) * 12);
        const satShift = (i - (count - 1) / 2) * 6;
        const lumShift = (i - (count - 1) / 2) * 4;
        const hue = Math.max(0, Math.min(255, baseHue + hueShift));
        const sat = Math.max(0, Math.min(255, baseSat + satShift));
        const lum = Math.max(0, Math.min(255, baseLum + lumShift));
        const hex = `#${hue.toString(16).padStart(2, '0')}${sat.toString(16).padStart(2, '0')}${lum.toString(16).padStart(2, '0')}`;
        palette.push(hex);
    }
    return palette;
}

function renderPalette(palette) {
    paletteDisplay.innerHTML = '';
    palette.forEach((color) => {
        const tile = document.createElement('div');
        tile.className = 'palette-tile';
        tile.style.background = color;
        const code = document.createElement('span');
        code.className = 'palette-code';
        code.textContent = color;
        tile.appendChild(code);
        paletteDisplay.appendChild(tile);
    });
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 1800);
}

function persistPalette(palette, name) {
    const saved = JSON.parse(localStorage.getItem('palettes') || '[]');
    const next = [{ name: name || `پالت ${saved.length + 1}`, colors: palette }, ...saved];
    localStorage.setItem('palettes', JSON.stringify(next.slice(0, 12)));
    loadSavedPalettes();
    showToast('پالت ذخیره شد');
}

function loadSavedPalettes() {
    const saved = JSON.parse(localStorage.getItem('palettes') || '[]');
    savedPalettesGrid.innerHTML = '';
    saved.forEach((item, index) => {
        const card = document.createElement('article');
        card.className = 'saved-card';

        const header = document.createElement('header');
        const title = document.createElement('strong');
        title.textContent = item.name;
        const loadBtn = document.createElement('button');
        loadBtn.textContent = 'بارگذاری';
        loadBtn.addEventListener('click', () => {
            currentPalette = item.colors;
            renderPalette(currentPalette);
            showToast('پالت بارگذاری شد');
        });
        header.append(title, loadBtn);

        const swatches = document.createElement('div');
        swatches.className = 'swatches';
        item.colors.forEach((swatch) => {
            const dot = document.createElement('div');
            dot.className = 'swatch';
            dot.style.background = swatch;
            swatches.appendChild(dot);
        });

        card.append(header, swatches);
        savedPalettesGrid.appendChild(card);
    });
}

function copyCss(palette) {
    const css = `:root { ${palette.map((color, index) => `--accent-color-${index + 1}: ${color};`).join(' ')} }`;
    navigator.clipboard.writeText(css).then(() => {
        showToast('کد CSS کپی شد');
    }).catch(() => {
        showToast('کپی نشد');
    });
}

function refreshPalette() {
    const base = colorPicker.value;
    const count = parseInt(countRange.value, 10);
    countIndicator.textContent = count;
    currentPalette = generatePalette(base, count);
    renderPalette(currentPalette);
}

randomizeBtn.addEventListener('click', () => {
    randomBaseColor();
    refreshPalette();
});

countRange.addEventListener('input', () => {
    countIndicator.textContent = countRange.value;
    refreshPalette();
});

colorPicker.addEventListener('input', () => {
    document.getElementById('colorCode').textContent = colorPicker.value;
    refreshPalette();
});

savePaletteBtn.addEventListener('click', () => {
    if (currentPalette.length === 0) {
        showToast('ابتدا پالت ایجاد کنید');
        return;
    }
    persistPalette(currentPalette, paletteNameInput.value.trim());
    paletteNameInput.value = '';
});

copyCssBtn.addEventListener('click', () => {
    if (currentPalette.length === 0) {
        showToast('ابتدا پالت ایجاد کنید');
        return;
    }
    copyCss(currentPalette);
});

window.addEventListener('DOMContentLoaded', () => {
    loadSavedPalettes();
    randomBaseColor();
    refreshPalette();
});

