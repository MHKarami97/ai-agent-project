// Contact Form functionality
(function() {
    'use strict';

    // Load the contact form HTML
    fetch('/assets/contact-form.html')
        .then(response => response.text())
        .then(html => {
            document.body.insertAdjacentHTML('beforeend', html);
            initContactForm();
        })
        .catch(error => console.error('Error loading contact form:', error));

    function initContactForm() {
        const modal = document.getElementById('contactModal');
        const openBtn = document.getElementById('openContactBtn');
        const closeBtn = document.getElementById('closeContactModal');
        const cancelBtn = document.getElementById('cancelContactForm');
        const form = document.getElementById('contactForm');
        const overlay = modal?.querySelector('.contact-modal-overlay');

        if (!modal || !openBtn) return;

        // Open modal
        openBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });

        // Close modal function
        function closeModal() {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
            form.reset();
            hideMessage();
        }

        // Close button
        closeBtn?.addEventListener('click', closeModal);

        // Cancel button
        cancelBtn?.addEventListener('click', closeModal);

        // Click overlay to close
        overlay?.addEventListener('click', closeModal);

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeModal();
            }
        });

        // Form submission
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('.btn-submit');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Disable submit button
            submitBtn.disabled = true;

            try {
                // Simulate form submission (replace with actual API call)
                await simulateSubmit(data);
                
                showMessage('پیام شما با موفقیت ارسال شد! به زودی با شما تماس می‌گیریم.', 'success');
                
                // Reset form after 2 seconds
                setTimeout(() => {
                    form.reset();
                    hideMessage();
                    closeModal();
                }, 2000);
                
            } catch (error) {
                showMessage('خطا در ارسال پیام. لطفاً دوباره تلاش کنید.', 'error');
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    function showMessage(text, type) {
        const messageDiv = document.getElementById('formMessage');
        if (!messageDiv) return;
        
        messageDiv.textContent = text;
        messageDiv.className = `form-message ${type}`;
        messageDiv.classList.remove('hidden');
    }

    function hideMessage() {
        const messageDiv = document.getElementById('formMessage');
        if (messageDiv) {
            messageDiv.classList.add('hidden');
        }
    }

    // Submit form to Formspree
    async function simulateSubmit(data) {
        const formspreeUrl = 'https://formspree.io/f/mpzbwnop';
        
        // Create FormData object
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('email', data.email);
        formData.append('type', data.type);
        formData.append('message', data.message);
        formData.append('_subject', `پیام جدید از صفحه اصلی - ${data.type}`);
        formData.append('_page', window.location.href);
        
        // Send to Formspree
        const response = await fetch(formspreeUrl, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('خطا در ارسال پیام');
        }

        return response.json();
    }
})();

