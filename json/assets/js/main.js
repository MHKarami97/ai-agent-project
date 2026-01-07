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


const input = document.getElementById("json-input");
const tree = document.getElementById("json-tree");
const status = document.getElementById("status");
const formatButton = document.getElementById("format-btn");
const validateButton = document.getElementById("validate-btn");
const clearButton = document.getElementById("clear-btn");
const toggleTree = document.getElementById("toggle-tree");
const samples = document.querySelectorAll(".sample");

const STORAGE_KEY = "json-formatter-input";

const renderTree = (data, parent) => {
  if (typeof data === "object" && data !== null) {
    Object.entries(data).forEach(([key, value]) => {
      const branch = document.createElement("div");
      branch.className = "tree__branch";

      const header = document.createElement("div");
      header.className = "tree__header";

      const keyLabel = document.createElement("span");
      keyLabel.textContent = key;
      header.appendChild(keyLabel);

      const valueLabel = document.createElement("span");
      valueLabel.className = "tree__value";
      valueLabel.textContent = Array.isArray(value) ? "[آرایه]" : typeof value === "object" ? "{آبجکت}" : value;
      header.appendChild(valueLabel);

      branch.appendChild(header);

      if (typeof value === "object" && value !== null) {
        const childWrapper = document.createElement("div");
        childWrapper.className = "tree__children";
        renderTree(value, childWrapper);
        branch.appendChild(childWrapper);
      }

      parent.appendChild(branch);
    });
  } else {
    const primitive = document.createElement("div");
    primitive.className = "tree__value";
    primitive.textContent = data;
    parent.appendChild(primitive);
  }
};

const formatJson = () => {
  try {
    const parsed = JSON.parse(input.value);
    input.value = JSON.stringify(parsed, null, 2);
    status.textContent = "JSON با موفقیت فرمت شد.";
    status.className = "status success";
    saveInput(input.value);
    displayTree(parsed);
  } catch (error) {
    status.textContent = "JSON نامعتبر است. مطمئن شوید که ساختار صحیح است.";
    status.className = "status error";
  }
};

const validateJson = () => {
  try {
    JSON.parse(input.value);
    status.textContent = "JSON معتبر است.";
    status.className = "status success";
  } catch (error) {
    status.textContent = "JSON نامعتبر است. لطفاً خطا را بررسی کنید.";
    status.className = "status error";
  }
};

const clearInput = () => {
  input.value = "";
  status.textContent = "";
  tree.innerHTML = "";
  localStorage.removeItem(STORAGE_KEY);
};

const loadInput = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    input.value = saved;
    try {
      const parsed = JSON.parse(saved);
      displayTree(parsed);
    } catch (error) {}
  }
};

const saveInput = (value) => {
  localStorage.setItem(STORAGE_KEY, value);
};

const displayTree = (data) => {
  tree.innerHTML = "";
  renderTree(data, tree);
};

const resetStatus = () => {
  status.textContent = "";
  status.className = "status";
};

formatButton.addEventListener("click", formatJson);
validateButton.addEventListener("click", validateJson);
clearButton.addEventListener("click", clearInput);
toggleTree.addEventListener("click", () => {
  tree.classList.toggle("tree--hidden");
});

samples.forEach((chip) => {
  chip.addEventListener("click", () => {
    resetStatus();
    input.value = chip.dataset.sample;
    saveInput(input.value);
    displayTree(JSON.parse(chip.dataset.sample));
  });
});

loadInput();
