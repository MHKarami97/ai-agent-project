(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        homeUrl: '/',
        emailServiceUrl: 'https://formspree.io/f/mpzbwnop',
        toolName: document.title || 'ابزار'
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        injectToolWrapper();
        injectContactModal();
        setupEventListeners();
        adjustBodyPadding();
        applyDarkMode();
        initializeThemeAndLanguage();
    }

    function injectToolWrapper() {
        const wrapper = document.createElement('div');
        wrapper.className = 'tool-wrapper';
        
        const isRTL = document.documentElement.dir === 'rtl' || document.documentElement.lang === 'fa';
        const arrowIcon = isRTL ? '→' : '←';
        
        wrapper.innerHTML = `
            <div class="tool-header">
                <button class="tool-back-btn" id="toolBackBtn" title="بازگشت به صفحه اصلی" aria-label="Back to home">${arrowIcon}</button>
                <h1 class="tool-header-title">${CONFIG.toolName}</h1>
                <div class="tool-header-actions">
                    <button class="tool-theme-btn" id="toolThemeBtn" title="تغییر تم" aria-label="Toggle theme">
                        <span id="toolThemeIcon">🌙</span>
                    </button>
                    <button class="tool-lang-btn" id="toolLangBtn" title="تغییر زبان" aria-label="Toggle language">
                        <span id="toolLangText">EN</span>
                    </button>
                    <button class="tool-contact-btn" id="toolContactBtn" title="تماس با ما / گزارش مشکل" aria-label="Contact us">
                        ✉️
                    </button>
                </div>
            </div>
        `;

        document.body.insertBefore(wrapper, document.body.firstChild);
    }

    function applyDarkMode() {
        const isDarkMode = localStorage.getItem('theme') === 'dark';
        const wrapper = document.querySelector('.tool-wrapper');
        const modal = document.querySelector('.contact-modal');
        
        if (wrapper && isDarkMode) {
            wrapper.classList.add('dark-mode');
        }
        
        if (modal && isDarkMode) {
            modal.classList.add('dark-mode');
        }
        
        window.addEventListener('storage', (e) => {
            if (e.key === 'theme') {
                if (e.newValue === 'dark') {
                    if (wrapper) wrapper.classList.add('dark-mode');
                    if (modal) modal.classList.add('dark-mode');
                } else {
                    if (wrapper) wrapper.classList.remove('dark-mode');
                    if (modal) modal.classList.remove('dark-mode');
                }
            }
        });
    }

    function injectContactModal() {
        const modal = document.createElement('div');
        modal.className = 'contact-modal';
        modal.id = 'contactModal';
        modal.innerHTML = `
            <div class="contact-modal-content">
                <div class="contact-modal-header">
                    <h2 class="contact-modal-title">تماس با ما / گزارش مشکل</h2>
                    <button class="contact-modal-close" id="contactModalClose" aria-label="Close">✕</button>
                </div>
                <form id="contactForm" class="contact-form">
                    <div class="contact-form-group">
                        <label class="contact-form-label" for="contactName">نام *</label>
                        <input type="text" id="contactName" name="name" class="contact-form-input" required>
                    </div>
                    <div class="contact-form-group">
                        <label class="contact-form-label" for="contactEmail">ایمیل *</label>
                        <input type="email" id="contactEmail" name="email" class="contact-form-input" required>
                    </div>
                    <div class="contact-form-group">
                        <label class="contact-form-label" for="contactSubject">موضوع *</label>
                        <input type="text" id="contactSubject" name="subject" class="contact-form-input" required>
                    </div>
                    <div class="contact-form-group">
                        <label class="contact-form-label" for="contactMessage">پیام / گزارش مشکل *</label>
                        <textarea id="contactMessage" name="message" class="contact-form-textarea" required></textarea>
                    </div>
                    <input type="hidden" name="_subject" value="پیام جدید از ${CONFIG.toolName}">
                    <input type="hidden" name="_tool" value="${CONFIG.toolName}">
                    <input type="hidden" name="_page" value="${window.location.href}">
                    <button type="submit" class="contact-form-submit" id="contactFormSubmit">ارسال پیام</button>
                    <div id="contactFormMessage" class="contact-form-message" style="display: none;"></div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    }

    function setupEventListeners() {
        const backBtn = document.getElementById('toolBackBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = CONFIG.homeUrl;
            });
        }

        const contactBtn = document.getElementById('toolContactBtn');
        const modal = document.getElementById('contactModal');
        if (contactBtn && modal) {
            contactBtn.addEventListener('click', () => {
                modal.classList.add('active');
            });
        }

        const closeBtn = document.getElementById('contactModalClose');
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        }

        const form = document.getElementById('contactForm');
        if (form) {
            form.addEventListener('submit', handleFormSubmit);
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
                modal.classList.remove('active');
            }
        });

        // Theme toggle button
        const themeBtn = document.getElementById('toolThemeBtn');
        if (themeBtn) {
            themeBtn.addEventListener('click', toggleTheme);
        }

        // Language toggle button
        const langBtn = document.getElementById('toolLangBtn');
        if (langBtn) {
            langBtn.addEventListener('click', toggleLanguage);
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = document.getElementById('contactFormSubmit');
        const messageDiv = document.getElementById('contactFormMessage');
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'در حال ارسال...';
        messageDiv.style.display = 'none';

        try {
            const formData = new FormData(form);
            
            const response = await fetch(CONFIG.emailServiceUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                messageDiv.textContent = 'پیام شما با موفقیت ارسال شد. به زودی با شما تماس می‌گیریم.';
                messageDiv.className = 'contact-form-message success';
                messageDiv.style.display = 'block';
                form.reset();
                
                setTimeout(() => {
                    const modal = document.getElementById('contactModal');
                    if (modal) {
                        modal.classList.remove('active');
                        messageDiv.style.display = 'none';
                    }
                }, 2000);
            } else {
                throw new Error('خطا در ارسال پیام');
            }
        } catch (error) {
            messageDiv.textContent = 'خطا در ارسال پیام. لطفاً دوباره تلاش کنید.';
            messageDiv.className = 'contact-form-message error';
            messageDiv.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'ارسال پیام';
        }
    }

    function adjustBodyPadding() {
        document.body.classList.add('has-tool-wrapper');
    }

    function initializeThemeAndLanguage() {
        const currentTheme = localStorage.getItem('theme') || 'light';
        applyTheme(currentTheme);
        updateThemeButton(currentTheme);

        const currentLang = localStorage.getItem('lang') || 'fa';
        applyLanguage(currentLang);
        updateLanguageButton(currentLang);
    }

    function toggleTheme() {
        const currentTheme = localStorage.getItem('theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
        updateThemeButton(newTheme);
        
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: newTheme }));
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const wrapper = document.querySelector('.tool-wrapper');
        const modal = document.querySelector('.contact-modal');
        
        if (theme === 'dark') {
            if (wrapper) wrapper.classList.add('dark-mode');
            if (modal) modal.classList.add('dark-mode');
        } else {
            if (wrapper) wrapper.classList.remove('dark-mode');
            if (modal) modal.classList.remove('dark-mode');
        }
    }

    function updateThemeButton(theme) {
        const themeIcon = document.getElementById('toolThemeIcon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
        }
    }

    function toggleLanguage() {
        const currentLang = localStorage.getItem('lang') || 'fa';
        const newLang = currentLang === 'fa' ? 'en' : 'fa';
        localStorage.setItem('lang', newLang);
        applyLanguage(newLang);
        updateLanguageButton(newLang);
        
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: newLang }));
    }

    function applyLanguage(lang) {
        const html = document.documentElement;
        html.setAttribute('lang', lang);
        html.setAttribute('dir', lang === 'fa' ? 'rtl' : 'ltr');
        document.body.style.direction = lang === 'fa' ? 'rtl' : 'ltr';
    }

    function updateLanguageButton(lang) {
        const langText = document.getElementById('toolLangText');
        if (langText) {
            langText.textContent = lang === 'fa' ? 'EN' : 'FA';
        }
    }

    // Export for potential external use
    window.ToolWrapper = {
        openContactModal: function() {
            const modal = document.getElementById('contactModal');
            if (modal) {
                modal.classList.add('active');
            }
        },
        closeContactModal: function() {
            const modal = document.getElementById('contactModal');
            if (modal) {
                modal.classList.remove('active');
            }
        },
        toggleTheme: toggleTheme,
        toggleLanguage: toggleLanguage,
        getCurrentTheme: function() {
            return localStorage.getItem('theme') || 'light';
        },
        getCurrentLanguage: function() {
            return localStorage.getItem('lang') || 'fa';
        }
    };
})();

