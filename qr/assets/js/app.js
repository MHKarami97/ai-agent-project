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


const generatorForm = document.getElementById("qr-generator");
const qrText = document.getElementById("qr-text");
const qrColor = document.getElementById("qr-color");
const qrBg = document.getElementById("qr-bg");
const qrSize = document.getElementById("qr-size");
const qrCanvas = document.getElementById("qr-canvas");
const generatorStatus = document.getElementById("generator-status");
const downloadBtn = document.getElementById("download-btn");
const copyBtn = document.getElementById("copy-btn");

const fileInput = document.getElementById("qr-file");
const readerStatus = document.getElementById("reader-status");
const readerOutput = document.getElementById("reader-output");
const readerResult = document.getElementById("reader-result");
const openLinkBtn = document.getElementById("open-link");
const copyResultBtn = document.getElementById("copy-result");
const startCameraBtn = document.getElementById("start-camera");
const stopCameraBtn = document.getElementById("stop-camera");
const video = document.getElementById("qr-video");
const readerCanvas = document.getElementById("qr-reader-canvas");
const readerCtx = readerCanvas.getContext("2d");

let stream = null;
let scanInterval = null;

const STORAGE_KEY = "qr-app-settings";
const LINK_REGEX = /^https?:\/\//i;

const defaultSettings = {
  text: "https://example.com",
  color: "#111827",
  bg: "#ffffff",
  size: "240",
};

const isLink = (value) => LINK_REGEX.test(value.trim());

const hydrateSettings = () => {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!data) return defaultSettings;
    return { ...defaultSettings, ...data };
  } catch (error) {
    console.warn("Cannot parse saved settings", error);
    return defaultSettings;
  }
};

const settings = hydrateSettings();
qrText.value = settings.text;
qrColor.value = settings.color;
qrBg.value = settings.bg;
qrSize.value = settings.size;

const persistSettings = () => {
  const payload = {
    text: qrText.value.trim() || defaultSettings.text,
    color: qrColor.value,
    bg: qrBg.value,
    size: qrSize.value,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

const renderQR = async () => {
  const qrLib = window.QRCode;
  if (!qrLib) {
    generatorStatus.textContent = "کتابخانه QR بارگیری نشد؛ صفحه را رفرش کنید.";
    return;
  }
  const value = qrText.value.trim();
  if (!value) {
    generatorStatus.textContent = "لطفا متن را وارد کنید";
    return;
  }

  generatorStatus.textContent = "در حال ساخت...";

  try {
    qrCanvas.width = qrCanvas.height = parseInt(qrSize.value, 10);
    await qrLib.toCanvas(qrCanvas, value, {
      margin: 1,
      color: { dark: qrColor.value, light: qrBg.value },
      width: qrCanvas.width,
    });
    generatorStatus.textContent = "آماده شد";
  } catch (error) {
    console.error(error);
    generatorStatus.textContent = "ساخت QR با خطا مواجه شد";
  }
};

const downloadQR = () => {
  const link = document.createElement("a");
  link.href = qrCanvas.toDataURL("image/png");
  link.download = "qr-code.png";
  link.click();
};

const copyText = async () => {
  const text = qrText.value.trim();
  if (!text) {
    generatorStatus.textContent = "متنی برای کپی وجود ندارد";
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    generatorStatus.textContent = "متن کپی شد";
  } catch (error) {
    generatorStatus.textContent = "امکان کپی نیست";
  }
};

const handleFile = (file) => {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => processImage(event.target.result);
  reader.readAsDataURL(file);
};

const processImage = (src) => {
  const jsQrLib = window.jsQR;
  if (!jsQrLib) {
    readerStatus.textContent = "امکان خواندن QR وجود ندارد";
    return;
  }
  const image = new Image();
  image.onload = () => {
    readerCanvas.width = image.width;
    readerCanvas.height = image.height;
    readerCtx.drawImage(image, 0, 0, image.width, image.height);
    const imageData = readerCtx.getImageData(0, 0, image.width, image.height);
    const code = jsQrLib(imageData.data, imageData.width, imageData.height);
    if (code) {
      showResult(code.data);
    } else {
      readerStatus.textContent = "کدی پیدا نشد";
      readerOutput.textContent = "—";
    }
  };
  image.onerror = () => {
    readerStatus.textContent = "خواندن فایل ممکن نشد";
  };
  image.src = src;
};

const showResult = (text) => {
  readerOutput.textContent = text;
  readerStatus.textContent = "کد شناسایی شد";
  openLinkBtn.disabled = !/^https?:\/\//i.test(text);
  copyResultBtn.disabled = !text;
};

const startCamera = async () => {
  try {
    readerStatus.textContent = "در حال آماده‌سازی دوربین";
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = stream;
    startCameraBtn.disabled = true;
    stopCameraBtn.disabled = false;
    scanInterval = setInterval(scanFrame, 500);
  } catch (error) {
    readerStatus.textContent = "اجازه دسترسی به دوربین داده نشد";
  }
};

const stopCamera = () => {
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
  }
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  video.srcObject = null;
  startCameraBtn.disabled = false;
  stopCameraBtn.disabled = true;
  readerStatus.textContent = "دوربین متوقف شد";
};

const scanFrame = () => {
  const jsQrLib = window.jsQR;
  if (!jsQrLib) {
    readerStatus.textContent = "کتابخانه خواندن QR بارگیری نشد";
    stopCamera();
    return;
  }
  if (video.readyState !== video.HAVE_ENOUGH_DATA) return;
  readerCanvas.width = video.videoWidth;
  readerCanvas.height = video.videoHeight;
  readerCtx.drawImage(video, 0, 0, readerCanvas.width, readerCanvas.height);
  const imageData = readerCtx.getImageData(0, 0, readerCanvas.width, readerCanvas.height);
  const code = jsQrLib(imageData.data, imageData.width, imageData.height);
  if (code) {
    showResult(code.data);
    stopCamera();
  }
};

const openLink = () => {
  const text = readerOutput.textContent;
  if (/^https?:\/\//i.test(text)) {
    window.open(text, "_blank");
  }
};

const copyResult = async () => {
  const text = readerOutput.textContent;
  if (!text || text === "—") {
    readerStatus.textContent = "متنی برای کپی وجود ندارد";
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    readerStatus.textContent = "نتیجه کپی شد";
  } catch (error) {
    readerStatus.textContent = "امکان کپی نیست";
  }
};

generatorForm.addEventListener("submit", (event) => {
  event.preventDefault();
  persistSettings();
  renderQR();
});

qrColor.addEventListener("change", renderQR);
qrBg.addEventListener("change", renderQR);
qrSize.addEventListener("change", renderQR);
qrText.addEventListener("input", () => {
  persistSettings();
  renderQR();
});

downloadBtn.addEventListener("click", downloadQR);
copyBtn.addEventListener("click", copyText);
fileInput.addEventListener("change", (event) => handleFile(event.target.files[0]));
openLinkBtn.addEventListener("click", openLink);
copyResultBtn.addEventListener("click", copyResult);
startCameraBtn.addEventListener("click", startCamera);
stopCameraBtn.addEventListener("click", stopCamera);

renderQR();

window.addEventListener("beforeunload", () => {
  if (stream) stopCamera();
});
