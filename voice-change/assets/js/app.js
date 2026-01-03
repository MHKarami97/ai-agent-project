// مدیریت حالت برنامه
const AppState = {
    audioFile: null,
    audioBuffer: null,
    audioContext: null,
    sourceNode: null,
    pitchValue: 0,
    speedValue: 1.0,
    volumeValue: 1.0,
    isPlaying: false,
    currentPreset: null
};

// مدیریت localStorage
const Storage = {
    savePreset: (name, settings) => {
        const presets = Storage.getPresets();
        presets[name] = {
            ...settings,
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('voiceChangePresets', JSON.stringify(presets));
    },
    
    getPresets: () => {
        const presets = localStorage.getItem('voiceChangePresets');
        return presets ? JSON.parse(presets) : {};
    },
    
    deletePreset: (name) => {
        const presets = Storage.getPresets();
        delete presets[name];
        localStorage.setItem('voiceChangePresets', JSON.stringify(presets));
    },
    
    addToHistory: (fileInfo) => {
        const history = Storage.getHistory();
        history.unshift({
            ...fileInfo,
            id: Date.now(),
            date: new Date().toISOString()
        });
        // حفظ فقط 20 مورد آخر
        if (history.length > 20) {
            history.splice(20);
        }
        localStorage.setItem('voiceChangeHistory', JSON.stringify(history));
    },
    
    getHistory: () => {
        const history = localStorage.getItem('voiceChangeHistory');
        return history ? JSON.parse(history) : [];
    },
    
    clearHistory: () => {
        localStorage.removeItem('voiceChangeHistory');
    }
};

// مدیریت عناصر DOM
const Elements = {
    uploadArea: document.getElementById('uploadArea'),
    audioFile: document.getElementById('audioFile'),
    selectFileBtn: document.getElementById('selectFileBtn'),
    originalSection: document.getElementById('originalSection'),
    originalAudio: document.getElementById('originalAudio'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),
    controlsSection: document.getElementById('controlsSection'),
    pitchControl: document.getElementById('pitchControl'),
    pitchValue: document.getElementById('pitchValue'),
    speedControl: document.getElementById('speedControl'),
    speedValue: document.getElementById('speedValue'),
    volumeControl: document.getElementById('volumeControl'),
    volumeValue: document.getElementById('volumeValue'),
    modifiedSection: document.getElementById('modifiedSection'),
    modifiedAudio: document.getElementById('modifiedAudio'),
    downloadBtn: document.getElementById('downloadBtn'),
    savePresetBtn: document.getElementById('savePresetBtn'),
    newFileBtn: document.getElementById('newFileBtn'),
    savedPresetsSection: document.getElementById('savedPresetsSection'),
    presetsList: document.getElementById('presetsList'),
    historySection: document.getElementById('historySection'),
    historyList: document.getElementById('historyList')
};

// نمایش Toast
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// فرمت کردن حجم فایل
function formatFileSize(bytes) {
    if (bytes === 0) return '0 بایت';
    const k = 1024;
    const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// فرمت کردن تاریخ
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// مدیریت انتخاب فایل
Elements.selectFileBtn.addEventListener('click', () => {
    Elements.audioFile.click();
});

Elements.audioFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFileUpload(file);
    }
});

// مدیریت Drag & Drop
Elements.uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    Elements.uploadArea.classList.add('dragover');
});

Elements.uploadArea.addEventListener('dragleave', () => {
    Elements.uploadArea.classList.remove('dragover');
});

Elements.uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    Elements.uploadArea.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
        handleFileUpload(file);
    } else {
        showToast('لطفاً فقط فایل صوتی انتخاب کنید', 'error');
    }
});

// پردازش فایل آپلود شده
async function handleFileUpload(file) {
    try {
        AppState.audioFile = file;
        
        // نمایش اطلاعات فایل
        Elements.fileName.textContent = file.name;
        Elements.fileSize.textContent = formatFileSize(file.size);
        
        // ایجاد URL برای پخش
        const url = URL.createObjectURL(file);
        Elements.originalAudio.src = url;
        
        // خواندن فایل به عنوان ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        
        // ایجاد AudioContext
        if (!AppState.audioContext) {
            AppState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // دیکود فایل صوتی
        AppState.audioBuffer = await AppState.audioContext.decodeAudioData(arrayBuffer);
        
        // نمایش بخش‌های مربوطه
        Elements.originalSection.style.display = 'block';
        Elements.controlsSection.style.display = 'block';
        Elements.modifiedSection.style.display = 'block';
        
        // اعمال تغییرات
        applyEffects();
        
        showToast('فایل با موفقیت بارگذاری شد');
        
    } catch (error) {
        console.error('خطا در پردازش فایل:', error);
        showToast('خطا در پردازش فایل صوتی', 'error');
    }
}

// اعمال افکت‌ها
function applyEffects() {
    if (!AppState.audioBuffer) return;
    
    try {
        const offlineContext = new OfflineAudioContext(
            AppState.audioBuffer.numberOfChannels,
            AppState.audioBuffer.length,
            AppState.audioBuffer.sampleRate
        );
        
        const source = offlineContext.createBufferSource();
        source.buffer = AppState.audioBuffer;
        
        // تنظیم pitch (با تغییر playbackRate)
        const pitchRatio = Math.pow(2, AppState.pitchValue / 12);
        source.playbackRate.value = pitchRatio * AppState.speedValue;
        
        // تنظیم volume
        const gainNode = offlineContext.createGain();
        gainNode.gain.value = AppState.volumeValue;
        
        source.connect(gainNode);
        gainNode.connect(offlineContext.destination);
        
        source.start(0);
        
        offlineContext.startRendering().then(renderedBuffer => {
            // تبدیل به WAV
            const wav = audioBufferToWav(renderedBuffer);
            const blob = new Blob([wav], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            
            Elements.modifiedAudio.src = url;
            AppState.modifiedBlob = blob;
        });
        
    } catch (error) {
        console.error('خطا در اعمال افکت‌ها:', error);
        showToast('خطا در اعمال تغییرات', 'error');
    }
}

// تبدیل AudioBuffer به WAV
function audioBufferToWav(buffer) {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    
    const data = [];
    for (let i = 0; i < buffer.numberOfChannels; i++) {
        data.push(buffer.getChannelData(i));
    }
    
    const interleaved = interleave(data);
    const dataLength = interleaved.length * bytesPerSample;
    const buffer_out = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer_out);
    
    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Write samples
    floatTo16BitPCM(view, 44, interleaved);
    
    return buffer_out;
}

function interleave(channelData) {
    const length = channelData[0].length;
    const numberOfChannels = channelData.length;
    const result = new Float32Array(length * numberOfChannels);
    
    let offset = 0;
    for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            result[offset++] = channelData[channel][i];
        }
    }
    
    return result;
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function floatTo16BitPCM(view, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}

// مدیریت کنترل‌ها
Elements.pitchControl.addEventListener('input', (e) => {
    AppState.pitchValue = parseFloat(e.target.value);
    Elements.pitchValue.textContent = AppState.pitchValue > 0 ? `+${AppState.pitchValue}` : AppState.pitchValue;
    applyEffects();
});

Elements.speedControl.addEventListener('input', (e) => {
    AppState.speedValue = parseFloat(e.target.value);
    Elements.speedValue.textContent = `${AppState.speedValue.toFixed(1)}x`;
    applyEffects();
});

Elements.volumeControl.addEventListener('input', (e) => {
    AppState.volumeValue = parseFloat(e.target.value) / 100;
    Elements.volumeValue.textContent = `${e.target.value}%`;
    applyEffects();
});

// دکمه‌های پیش‌فرض
document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const pitch = parseFloat(e.target.dataset.pitch);
        const speed = parseFloat(e.target.dataset.speed);
        
        AppState.pitchValue = pitch;
        AppState.speedValue = speed;
        
        Elements.pitchControl.value = pitch;
        Elements.pitchValue.textContent = pitch > 0 ? `+${pitch}` : pitch;
        
        Elements.speedControl.value = speed;
        Elements.speedValue.textContent = `${speed.toFixed(1)}x`;
        
        applyEffects();
        
        // هایلایت کردن دکمه فعال
        document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
    });
});

// دانلود فایل
Elements.downloadBtn.addEventListener('click', () => {
    if (!AppState.modifiedBlob) {
        showToast('لطفاً ابتدا تنظیمات را اعمال کنید', 'error');
        return;
    }
    
    const url = URL.createObjectURL(AppState.modifiedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modified_${AppState.audioFile.name.replace(/\.[^/.]+$/, '')}.wav`;
    a.click();
    
    // افزودن به تاریخچه
    Storage.addToHistory({
        originalName: AppState.audioFile.name,
        modifiedName: a.download,
        pitch: AppState.pitchValue,
        speed: AppState.speedValue,
        volume: AppState.volumeValue
    });
    
    showToast('فایل با موفقیت دانلود شد');
    renderHistory();
});

// ذخیره تنظیمات
Elements.savePresetBtn.addEventListener('click', () => {
    const name = prompt('نام تنظیمات را وارد کنید:');
    if (name) {
        Storage.savePreset(name, {
            pitch: AppState.pitchValue,
            speed: AppState.speedValue,
            volume: AppState.volumeValue
        });
        showToast('تنظیمات با موفقیت ذخیره شد');
        renderPresets();
    }
});

// فایل جدید
Elements.newFileBtn.addEventListener('click', () => {
    location.reload();
});

// رندر کردن تنظیمات ذخیره شده
function renderPresets() {
    const presets = Storage.getPresets();
    const presetNames = Object.keys(presets);
    
    if (presetNames.length === 0) {
        Elements.savedPresetsSection.style.display = 'none';
        return;
    }
    
    Elements.savedPresetsSection.style.display = 'block';
    Elements.presetsList.innerHTML = '';
    
    presetNames.forEach(name => {
        const preset = presets[name];
        const div = document.createElement('div');
        div.className = 'preset-item';
        div.innerHTML = `
            <div class="preset-info">
                <div class="preset-name">${name}</div>
                <div class="preset-details">
                    Pitch: ${preset.pitch > 0 ? '+' : ''}${preset.pitch} | 
                    سرعت: ${preset.speed.toFixed(1)}x | 
                    حجم: ${Math.round(preset.volume * 100)}%
                </div>
            </div>
            <div class="preset-actions">
                <button class="btn btn-primary btn-load-preset" data-name="${name}">اعمال</button>
                <button class="btn btn-secondary btn-delete-preset" data-name="${name}">حذف</button>
            </div>
        `;
        Elements.presetsList.appendChild(div);
    });
    
    // رویدادها برای دکمه‌ها
    document.querySelectorAll('.btn-load-preset').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const name = e.target.dataset.name;
            const preset = presets[name];
            
            AppState.pitchValue = preset.pitch;
            AppState.speedValue = preset.speed;
            AppState.volumeValue = preset.volume;
            
            Elements.pitchControl.value = preset.pitch;
            Elements.pitchValue.textContent = preset.pitch > 0 ? `+${preset.pitch}` : preset.pitch;
            
            Elements.speedControl.value = preset.speed;
            Elements.speedValue.textContent = `${preset.speed.toFixed(1)}x`;
            
            Elements.volumeControl.value = Math.round(preset.volume * 100);
            Elements.volumeValue.textContent = `${Math.round(preset.volume * 100)}%`;
            
            applyEffects();
            showToast(`تنظیمات "${name}" اعمال شد`);
        });
    });
    
    document.querySelectorAll('.btn-delete-preset').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const name = e.target.dataset.name;
            if (confirm(`آیا از حذف تنظیمات "${name}" اطمینان دارید؟`)) {
                Storage.deletePreset(name);
                showToast('تنظیمات حذف شد');
                renderPresets();
            }
        });
    });
}

// رندر کردن تاریخچه
function renderHistory() {
    const history = Storage.getHistory();
    
    if (history.length === 0) {
        Elements.historySection.style.display = 'none';
        return;
    }
    
    Elements.historySection.style.display = 'block';
    Elements.historyList.innerHTML = '';
    
    history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="history-info">
                <div class="history-name">${item.originalName} → ${item.modifiedName}</div>
                <div class="history-details">
                    Pitch: ${item.pitch > 0 ? '+' : ''}${item.pitch} | 
                    سرعت: ${item.speed.toFixed(1)}x | 
                    حجم: ${Math.round(item.volume * 100)}%
                </div>
                <div class="history-date">${formatDate(item.date)}</div>
            </div>
        `;
        Elements.historyList.appendChild(div);
    });
}

// بارگذاری اولیه
document.addEventListener('DOMContentLoaded', () => {
    renderPresets();
    renderHistory();
});

