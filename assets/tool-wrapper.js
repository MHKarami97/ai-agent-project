/**
 * Tool Wrapper Script
 * Automatically injects a mobile app-like header with back button and contact form
 * Usage: Add this script to any tool page
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        homeUrl: '/index.html',
        emailServiceUrl: 'https://formspree.io/f/mpzbwnop', // Replace with your Formspree endpoint
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
    }

    function injectToolWrapper() {
        // Create wrapper element
        const wrapper = document.createElement('div');
        wrapper.className = 'tool-wrapper';
        wrapper.innerHTML = `
            <div class="tool-header">
                <button class="tool-back-btn" id="toolBackBtn" title="بازگشت به صفحه اصلی" aria-label="Back to home"></button>
                <h1 class="tool-header-title">${CONFIG.toolName}</h1>
                <button class="tool-contact-btn" id="toolContactBtn" title="تماس با ما / گزارش مشکل" aria-label="Contact us">
                    ✉️
                </button>
            </div>
        `;

        // Insert at the beginning of body
        document.body.insertBefore(wrapper, document.body.firstChild);
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
        // Back button
        const backBtn = document.getElementById('toolBackBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = CONFIG.homeUrl;
            });
        }

        // Contact button
        const contactBtn = document.getElementById('toolContactBtn');
        const modal = document.getElementById('contactModal');
        if (contactBtn && modal) {
            contactBtn.addEventListener('click', () => {
                modal.classList.add('active');
            });
        }

        // Close modal button
        const closeBtn = document.getElementById('contactModalClose');
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        // Close modal on backdrop click
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        }

        // Handle form submission
        const form = document.getElementById('contactForm');
        if (form) {
            form.addEventListener('submit', handleFormSubmit);
        }

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
                modal.classList.remove('active');
            }
        });
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = document.getElementById('contactFormSubmit');
        const messageDiv = document.getElementById('contactFormMessage');
        
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.textContent = 'در حال ارسال...';
        messageDiv.style.display = 'none';

        try {
            // Get form data
            const formData = new FormData(form);
            
            // Send to Formspree (or your preferred email service)
            const response = await fetch(CONFIG.emailServiceUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // Success
                messageDiv.textContent = 'پیام شما با موفقیت ارسال شد. به زودی با شما تماس می‌گیریم.';
                messageDiv.className = 'contact-form-message success';
                messageDiv.style.display = 'block';
                form.reset();
                
                // Close modal after 2 seconds
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
            // Error
            messageDiv.textContent = 'خطا در ارسال پیام. لطفاً دوباره تلاش کنید.';
            messageDiv.className = 'contact-form-message error';
            messageDiv.style.display = 'block';
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = 'ارسال پیام';
        }
    }

    function adjustBodyPadding() {
        // Add class to body to adjust padding
        document.body.classList.add('has-tool-wrapper');
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
        }
    };
})();

