/**
 * ماژول مدیریت ذخیره‌سازی در IndexedDB
 */

class StorageManager {
    constructor() {
        this.dbName = 'CryptoAppDB';
        this.dbVersion = 1;
        this.storeName = 'history';
        this.db = null;
    }

    /**
     * باز کردن یا ایجاد دیتابیس
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('خطا در باز کردن دیتابیس:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // ایجاد object store اگر وجود ندارد
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, {
                        keyPath: 'id',
                        autoIncrement: true
                    });

                    // ایجاد ایندکس برای تاریخ
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    /**
     * اطمینان از آماده بودن دیتابیس
     */
    async ensureDb() {
        if (!this.db) {
            await this.init();
        }
        return this.db;
    }

    /**
     * ذخیره یک مورد در تاریخچه
     */
    async saveHistory(data) {
        try {
            await this.ensureDb();

            const historyItem = {
                plainText: data.plainText,
                cipherText: data.cipherText,
                displayText: data.displayText,
                charsets: data.charsets,
                timestamp: new Date().toISOString()
            };

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const objectStore = transaction.objectStore(this.storeName);
                const request = objectStore.add(historyItem);

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    console.error('خطا در ذخیره:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('خطا در ذخیره‌سازی:', error);
            throw error;
        }
    }

    /**
     * دریافت تمام موارد تاریخچه
     */
    async getAllHistory() {
        try {
            await this.ensureDb();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const objectStore = transaction.objectStore(this.storeName);
                const request = objectStore.getAll();

                request.onsuccess = () => {
                    // مرتب‌سازی بر اساس تاریخ (جدیدترین اول)
                    const results = request.result.sort((a, b) => {
                        return new Date(b.timestamp) - new Date(a.timestamp);
                    });
                    resolve(results);
                };

                request.onerror = () => {
                    console.error('خطا در دریافت تاریخچه:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('خطا در دریافت تاریخچه:', error);
            return [];
        }
    }

    /**
     * حذف یک مورد از تاریخچه
     */
    async deleteHistory(id) {
        try {
            await this.ensureDb();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const objectStore = transaction.objectStore(this.storeName);
                const request = objectStore.delete(id);

                request.onsuccess = () => {
                    resolve();
                };

                request.onerror = () => {
                    console.error('خطا در حذف:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('خطا در حذف:', error);
            throw error;
        }
    }

    /**
     * پاک کردن تمام تاریخچه
     */
    async clearAllHistory() {
        try {
            await this.ensureDb();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const objectStore = transaction.objectStore(this.storeName);
                const request = objectStore.clear();

                request.onsuccess = () => {
                    resolve();
                };

                request.onerror = () => {
                    console.error('خطا در پاک کردن تاریخچه:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('خطا در پاک کردن تاریخچه:', error);
            throw error;
        }
    }

    /**
     * دریافت تعداد موارد تاریخچه
     */
    async getHistoryCount() {
        try {
            await this.ensureDb();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const objectStore = transaction.objectStore(this.storeName);
                const request = objectStore.count();

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    console.error('خطا در شمارش:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('خطا در شمارش:', error);
            return 0;
        }
    }
}

// ایجاد نمونه سراسری
const storageManager = new StorageManager();

