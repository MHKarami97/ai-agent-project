/**
 * ماژول رمزنگاری با استفاده از Web Crypto API
 * استفاده از AES-GCM برای رمزنگاری قوی و PBKDF2 برای تولید کلید از رمز عبور
 */

class CryptoManager {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
        this.iterations = 100000; // تعداد تکرار برای PBKDF2
        
        // تعریف مجموعه کاراکترها
        this.charsets = {
            persian: 'آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهیئ ءأإؤ،؛',
            english: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
            numbers: '0123456789',
            symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?/~`'
        };
    }

    /**
     * تبدیل رشته به آرایه بایت
     */
    stringToArrayBuffer(str) {
        const encoder = new TextEncoder();
        return encoder.encode(str);
    }

    /**
     * تبدیل آرایه بایت به رشته
     */
    arrayBufferToString(buffer) {
        const decoder = new TextDecoder();
        return decoder.decode(buffer);
    }

    /**
     * تبدیل آرایه بایت به Base64
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * تبدیل Base64 به آرایه بایت
     */
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * تولید کلید رمزنگاری از رمز عبور با استفاده از PBKDF2
     */
    async deriveKey(password, salt) {
        const passwordBuffer = this.stringToArrayBuffer(password);
        
        // وارد کردن رمز عبور به عنوان کلید
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        // تولید کلید AES از رمز عبور
        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: this.iterations,
                hash: 'SHA-256'
            },
            keyMaterial,
            {
                name: this.algorithm,
                length: this.keyLength
            },
            false,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * رمزنگاری متن
     */
    async encrypt(plainText, password) {
        try {
            // تولید salt و IV تصادفی
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const iv = crypto.getRandomValues(new Uint8Array(12));

            // تولید کلید از رمز عبور
            const key = await this.deriveKey(password, salt);

            // تبدیل متن به بایت
            const plainBuffer = this.stringToArrayBuffer(plainText);

            // رمزنگاری
            const cipherBuffer = await crypto.subtle.encrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                key,
                plainBuffer
            );

            // ترکیب salt + iv + cipher text
            const resultBuffer = new Uint8Array(
                salt.byteLength + iv.byteLength + cipherBuffer.byteLength
            );
            resultBuffer.set(salt, 0);
            resultBuffer.set(iv, salt.byteLength);
            resultBuffer.set(new Uint8Array(cipherBuffer), salt.byteLength + iv.byteLength);

            // تبدیل به Base64
            return this.arrayBufferToBase64(resultBuffer.buffer);
        } catch (error) {
            console.error('خطا در رمزنگاری:', error);
            throw new Error('رمزنگاری انجام نشد');
        }
    }

    /**
     * رمزگشایی متن
     */
    async decrypt(cipherText, password) {
        try {
            // تبدیل Base64 به بایت
            const resultBuffer = this.base64ToArrayBuffer(cipherText);
            const resultArray = new Uint8Array(resultBuffer);

            // استخراج salt, iv و cipher text
            const salt = resultArray.slice(0, 16);
            const iv = resultArray.slice(16, 28);
            const cipherBuffer = resultArray.slice(28);

            // تولید کلید از رمز عبور
            const key = await this.deriveKey(password, salt);

            // رمزگشایی
            const plainBuffer = await crypto.subtle.decrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                key,
                cipherBuffer
            );

            // تبدیل به رشته
            return this.arrayBufferToString(plainBuffer);
        } catch (error) {
            console.error('خطا در رمزگشایی:', error);
            throw new Error('رمزگشایی انجام نشد. لطفاً کلید صحیح را وارد کنید.');
        }
    }

    /**
     * تبدیل متن رمزنگاری شده به کاراکترهای خاص
     */
    encodeToCharset(cipherText, selectedCharsets) {
        if (selectedCharsets.length === 0) {
            return cipherText; // اگر هیچ مجموعه‌ای انتخاب نشده، همان Base64 را برگردان
        }

        // ساخت مجموعه کاراکترهای انتخاب شده
        let charset = '';
        selectedCharsets.forEach(type => {
            if (this.charsets[type]) {
                charset += this.charsets[type];
            }
        });

        if (charset.length === 0) {
            return cipherText;
        }

        // تبدیل Base64 به اعداد
        const bytes = new Uint8Array(this.base64ToArrayBuffer(cipherText));
        
        // ذخیره طول اصلی و Base64 اصلی به صورت رمزگذاری شده در انتها
        const encoded = Array.from(bytes).map(byte => {
            return charset[byte % charset.length];
        }).join('');

        // اضافه کردن علامت جداکننده و Base64 اصلی
        return encoded + '|' + cipherText;
    }

    /**
     * تبدیل متن رمزنگاری شده با کاراکترهای خاص به Base64
     */
    decodeFromCharset(encodedText) {
        // جدا کردن قسمت نمایشی از Base64 اصلی
        const parts = encodedText.split('|');
        if (parts.length === 2) {
            // اگر Base64 اصلی موجود است، از آن استفاده کن
            return parts[1];
        }
        
        // اگر فقط Base64 باشد
        return encodedText;
    }

    /**
     * اعتبارسنجی کلید
     */
    validatePassword(password) {
        if (!password || password.trim().length === 0) {
            throw new Error('کلید خصوصی نمی‌تواند خالی باشد');
        }
        if (password.length < 8) {
            throw new Error('کلید خصوصی باید حداقل 8 کاراکتر باشد');
        }
        return true;
    }

    /**
     * اعتبارسنجی متن
     */
    validateText(text) {
        if (!text || text.trim().length === 0) {
            throw new Error('متن نمی‌تواند خالی باشد');
        }
        return true;
    }
}

// ایجاد نمونه سراسری
const cryptoManager = new CryptoManager();

