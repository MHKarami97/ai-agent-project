const elements = {
  textInput: document.querySelector('[data-text-input]'),
  textOutput: document.querySelector('[data-text-output]'),
  encodeBtn: document.querySelector('[data-encode]'),
  decodeBtn: document.querySelector('[data-decode]'),
  copyTextBtn: document.querySelector('[data-copy-output]'),
  fileInput: document.getElementById('image-file'),
  imageOutput: document.querySelector('[data-image-output]'),
  previewImage: document.querySelector('[data-preview]'),
  copyImageBtn: document.querySelector('[data-copy-image]'),
  clearImageBtn: document.querySelector('[data-clear-image]'),
  statusText: document.querySelector('[data-status-text]'),
  statusImage: document.querySelector('[data-status-image]'),
};

const appState = {
  lastImageBase64: '',
};

const updateStatus = (element, message, isError = false) => {
  element.textContent = message;
  element.style.color = isError ? '#f87171' : '#5eead4';
};

const encodeText = () => {
  const value = elements.textInput.value.trim();
  if (!value) {
    updateStatus(elements.statusText, 'متنی برای تبدیل وجود ندارد.', true);
    elements.textOutput.value = '';
    return;
  }
  const encoded = btoa(unescape(encodeURIComponent(value)));
  elements.textOutput.value = encoded;
  updateStatus(elements.statusText, 'متن با موفقیت رمزنگاری شد.');
};

const decodeText = () => {
  const value = elements.textInput.value.trim();
  if (!value) {
    updateStatus(elements.statusText, 'رشته‌ای برای رمزگشایی وارد نشده.', true);
    elements.textOutput.value = '';
    return;
  }
  try {
    const decoded = decodeURIComponent(escape(atob(value)));
    elements.textOutput.value = decoded;
    updateStatus(elements.statusText, 'متن با موفقیت بازگشایی شد.');
  } catch (error) {
    updateStatus(elements.statusText, 'رشته معتبر Base64 وارد کنید.', true);
    elements.textOutput.value = '';
  }
};

const copyToClipboard = (value, element, successMsg) => {
  if (!value) {
    updateStatus(element, 'خروجی برای کپی کردن موجود نیست.', true);
    return;
  }
  navigator.clipboard.writeText(value)
    .then(() => updateStatus(element, successMsg))
    .catch(() => updateStatus(element, 'کپی انجام نشد.'));
};

const handleFile = (file) => {
  if (!file) {
    updateStatus(elements.statusImage, 'فایلی انتخاب نشده.', true);
    elements.imageOutput.value = '';
    elements.previewImage.hidden = true;
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const base64 = reader.result.split(',')[1];
    elements.imageOutput.value = base64;
    elements.previewImage.src = reader.result;
    elements.previewImage.hidden = false;
    appState.lastImageBase64 = base64;
    updateStatus(elements.statusImage, 'تصویر به Base64 تبدیل شد.');
  };
  reader.onerror = () => updateStatus(elements.statusImage, 'در بارگذاری تصویر خطا رخ داد.', true);
  reader.readAsDataURL(file);
};

const clearImage = () => {
  elements.fileInput.value = '';
  elements.imageOutput.value = '';
  elements.previewImage.hidden = true;
  elements.previewImage.src = '';
  appState.lastImageBase64 = '';
  updateStatus(elements.statusImage, 'ورودی تصویر پاک شد.');
};

const buildImagePreviewFromBase64 = (base64) => {
  if (!base64) {
    updateStatus(elements.statusImage, 'رشته Base64 برای پیش‌نمایش وجود ندارد.', true);
    return;
  }
  elements.previewImage.src = `data:image/*;base64,${base64}`;
  elements.previewImage.hidden = false;
};

elements.encodeBtn.addEventListener('click', encodeText);
elements.decodeBtn.addEventListener('click', decodeText);
elements.copyTextBtn.addEventListener('click', () =>
  copyToClipboard(elements.textOutput.value.trim(), elements.statusText, 'متن کپی شد.')
);
elements.copyImageBtn.addEventListener('click', () =>
  copyToClipboard(elements.imageOutput.value.trim(), elements.statusImage, 'رشته تصویر کپی شد.')
);
elements.clearImageBtn.addEventListener('click', clearImage);
elements.fileInput.addEventListener('change', (event) => handleFile(event.target.files[0]));

// Restore preview when page reloads with a Base64 string present
elements.imageOutput.addEventListener('input', (event) => buildImagePreviewFromBase64(event.target.value.trim()));

