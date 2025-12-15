const fileInput = document.getElementById('fileInput');
const formatSelect = document.getElementById('formatSelect');
const qualityRange = document.getElementById('qualityRange');
const qualityValue = document.getElementById('qualityValue');
const convertForm = document.getElementById('convertForm');
const outputContainer = document.getElementById('output');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistory');

const HISTORY_KEY = 'converter-history';
const MAX_HISTORY = 8;

qualityRange.addEventListener('input', () => {
    qualityValue.textContent = qualityRange.value;
});

function readHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch (err) {
        console.error('Reading history failed', err);
        return [];
    }
}

function saveHistory(entries) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
}

function renderHistory() {
    const entries = readHistory();
    historyList.innerHTML = '';

    if (!entries.length) {
        historyList.innerHTML = '<li class="hint">تاریخچه‌ای وجود ندارد.</li>';
        return;
    }

    entries.forEach(({ name, from, to, size, url, time }) => {
        const item = document.createElement('li');
        item.className = 'history-item';
        item.innerHTML = `
            <div>
                <strong>${name}</strong>
                <p class="hint">${from.toUpperCase()} → ${to.toUpperCase()} · ${size}</p>
                <p class="hint">${new Date(time).toLocaleString('fa-IR')}</p>
            </div>
            <button class="ghost" data-url="${url}" download="${name.replace(/\.[^.]+$/, '.' + to)}">دانلود</button>
        `;
        historyList.appendChild(item);
    });
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function convertImage(file, format, quality) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    return new Promise((resolve, reject) => {
        const mime = format === 'jpeg' ? 'image/jpeg' : `image/${format}`;
        canvas.toBlob(
            blob => {
                if (!blob) {
                    reject(new Error('Blobbing failed'));
                    return;
                }
                resolve(blob);
                URL.revokeObjectURL(url);
            },
            mime,
            format === 'png' || format === 'gif' ? undefined : Number(quality)
        );
    });
}

function showOutput(blob, name, format) {
    const convertedUrl = URL.createObjectURL(blob);
    const filename = name.replace(/\.[^.]+$/, '.' + format);

    outputContainer.innerHTML = `
        <div>
            <img src="${convertedUrl}" alt="${filename}" />
            <p>${filename} · ${formatBytes(blob.size)}</p>
            <a class="primary" href="${convertedUrl}" download="${filename}">دانلود فایل</a>
        </div>
    `;

    const history = readHistory();
    history.unshift({
        name,
        from: name.split('.').pop() || '',
        to: format,
        size: formatBytes(blob.size),
        url: convertedUrl,
        time: Date.now(),
    });
    saveHistory(history);
    renderHistory();
}

convertForm.addEventListener('submit', async event => {
    event.preventDefault();
    const file = fileInput.files[0];
    if (!file) {
        alert('لطفاً یک فایل انتخاب کنید.');
        return;
    }

    const format = formatSelect.value;
    const quality = qualityRange.value;

    convertForm.querySelector('button[type="submit"]').disabled = true;
    convertForm.querySelector('button[type="submit"]').textContent = 'در حال تبدیل...';

    try {
        const blob = await convertImage(file, format, quality);
        showOutput(blob, file.name, format);
    } catch (err) {
        console.error(err);
        alert('تبدیل فایل با خطا مواجه شد.');
    } finally {
        convertForm.querySelector('button[type="submit"]').disabled = false;
        convertForm.querySelector('button[type="submit"]').textContent = 'تبدیل کن';
    }
});

clearHistoryBtn.addEventListener('click', () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
});

historyList.addEventListener('click', event => {
    if (event.target.matches('button[data-url]')) {
        const url = event.target.getAttribute('data-url');
        const link = document.createElement('a');
        link.href = url;
        link.download = '';
        link.click();
    }
});

renderHistory();

