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


const STORAGE_KEY = "rtl-md-editor-content";
const editorEl = document.getElementById("editor");
const previewEl = document.getElementById("preview");
const statusMessageEl = document.getElementById("statusMessage");
const wordCountEl = document.getElementById("wordCount");
const themeToggleBtn = document.getElementById("themeToggle");
const newDocBtn = document.getElementById("newDocBtn");
const sampleBtn = document.getElementById("sampleBtn");
const saveNowBtn = document.getElementById("saveNowBtn");
const exportPdfBtn = document.getElementById("exportPdfBtn");
const exportDocBtn = document.getElementById("exportDocBtn");

const sampleMarkdown = `# ویرایشگر مارک‌داون راست‌به‌چپ

> این ابزار ۱۰۰٪ سمت مرورگر اجرا می‌شود.

## امکانات
- پیش‌نمایش زنده هم‌زمان
- ذخیره خودکار در LocalStorage
- خروجی PDF و Word
- پشتیبانی کامل از فونت Vazirmatn

## کد نمونه
\`\`\`js
function greet(name) {
  return \`سلام \${name}!\`;
}
\`\`\`
`;

let autoSaveTimeout;

function initMarkdown() {
  marked.setOptions({
    breaks: true,
    gfm: true,
  });
}

function renderPreview(markdownText) {
  const raw = marked.parse(markdownText || "");
  previewEl.innerHTML = DOMPurify.sanitize(raw);
  updateWordCount(markdownText);
}

function updateWordCount(text) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  wordCountEl.textContent = `${words.length.toLocaleString("fa-IR") || "۰"} واژه`;
}

function loadFromStorage() {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (!cached) return;
  editorEl.value = cached;
  renderPreview(cached);
}

function saveToStorage(label = "ذخیره شد") {
  const value = editorEl.value;
  localStorage.setItem(STORAGE_KEY, value);
  statusMessageEl.textContent = label;
  clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(() => {
    statusMessageEl.textContent = "همه‌چیز ذخیره شده است.";
  }, 2000);
}

function triggerAutoSave() {
  statusMessageEl.textContent = "در حال ذخیره…";
  clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(() => saveToStorage(), 750);
}

function bindEditorEvents() {
  editorEl.addEventListener("input", () => {
    renderPreview(editorEl.value);
    triggerAutoSave();
  });

  editorEl.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "s") {
      event.preventDefault();
      saveToStorage("با میانبر ذخیره شد");
    }
  });
}

function setSampleContent() {
  editorEl.value = sampleMarkdown;
  renderPreview(sampleMarkdown);
  saveToStorage("نمونه بارگذاری شد");
}

function resetDocument() {
  if (!confirm("مطمئن هستید؟ تمام تغییرات حذف می‌شود.")) return;
  editorEl.value = "";
  renderPreview("");
  saveToStorage("سند تازه آماده است");
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  const nextTheme = current === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme;
  themeToggleBtn.textContent = nextTheme === "dark" ? "حالت روشن" : "حالت تیره";
  themeToggleBtn.setAttribute("aria-pressed", nextTheme === "dark");
  localStorage.setItem("rtl-md-theme", nextTheme);
}

function loadTheme() {
  const cached = localStorage.getItem("rtl-md-theme") || "light";
  document.documentElement.dataset.theme = cached;
  themeToggleBtn.textContent = cached === "dark" ? "حالت روشن" : "حالت تیره";
  themeToggleBtn.setAttribute("aria-pressed", cached === "dark");
}

function exportAsPdf() {
  const opt = {
    margin: 10,
    filename: "rtl-markdown.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };
  html2pdf().set(opt).from(previewEl).save();
}

function exportAsDoc() {
  const content = `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><style>body{font-family: 'Vazirmatn', sans-serif; direction:rtl;}</style></head><body>${previewEl.innerHTML}</body></html>`;
  const converted = window.htmlDocx.asBlob(content, { orientation: "portrait" });
  downloadBlob(converted, "rtl-markdown.docx");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function bindButtons() {
  themeToggleBtn.addEventListener("click", toggleTheme);
  newDocBtn.addEventListener("click", resetDocument);
  sampleBtn.addEventListener("click", setSampleContent);
  saveNowBtn.addEventListener("click", () => saveToStorage("ذخیرهٔ دستی انجام شد"));
  exportPdfBtn.addEventListener("click", exportAsPdf);
  exportDocBtn.addEventListener("click", exportAsDoc);
}

function initApp() {
  initMarkdown();
  loadTheme();
  bindEditorEvents();
  bindButtons();
  loadFromStorage();
  if (!editorEl.value) {
    renderPreview("");
  }
}

document.addEventListener("DOMContentLoaded", initApp);
