/**
 * TREATMENT.JS - Interactive functionality for treatment pages
 * Features:
 * - Tab-based navigation (no scrolling)
 * - Image comparison slider
 * - FAQ accordion
 * - Gallery lightbox
 * - Booking form handling
 * - Mobile-optimized interactions
 */

class TreatmentPage {
    constructor() {
        this.currentTab = 'overview';
        this.isMobile = window.innerWidth <= 768;
        this.init();
    }

    init() {
        console.log('Treatment Page Initializing...');
        
        // Initialize components
        this.initTabNavigation();
        this.initImageComparison();
        this.initFAQAccordion();
        this.initGallery();
        this.initBookingForm();
        this.initSeveritySelector();
        this.initBackToTop();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Performance optimization
        this.setupPerformance();
        
        console.log('Treatment Page Ready!');
    }

    // ===== TAB NAVIGATION =====
    initTabNavigation() {
        this.tabItems = document.querySelectorAll('.tab-item');
        this.tabSections = document.querySelectorAll('.treatment-section');
        
        if (!this.tabItems.length) return;
        
        // Set up tab click handlers
        this.tabItems.forEach(tab => {
            tab.addEventListener('click', (e) => this.handleTabClick(e, tab));
            tab.addEventListener('keydown', (e) => this.handleTabKeydown(e, tab));
        });
        
        // Set initial active tab
        this.activateTab(this.tabItems[0]?.dataset.tab || 'overview');
        
        // Update tab navigation for mobile
        if (this.isMobile) {
            this.setupMobileTabNavigation();
        }
    }

    handleTabClick(e, tab) {
        e.preventDefault();
        const targetTab = tab.dataset.tab;
        
        if (targetTab && targetTab !== this.currentTab) {
            this.activateTab(targetTab);
            
            // Update URL hash
            window.history.pushState(null, '', `#${targetTab}`);
        }
    }

    handleTabKeydown(e, tab) {
        const tabs = Array.from(this.tabItems);
        const currentIndex = tabs.indexOf(tab);
        
        switch(e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                tab.click();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.focusTab(currentIndex - 1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.focusTab(currentIndex + 1);
                break;
            case 'Home':
                e.preventDefault();
                this.focusTab(0);
                break;
            case 'End':
                e.preventDefault();
                this.focusTab(tabs.length - 1);
                break;
        }
    }

    focusTab(index) {
        const tabs = Array.from(this.tabItems);
        if (index < 0) index = tabs.length - 1;
        if (index >= tabs.length) index = 0;
        
        const tab = tabs[index];
        tab.focus();
        this.activateTab(tab.dataset.tab);
    }

    activateTab(tabId) {
        // Update active tab
        this.tabItems.forEach(tab => {
            const isActive = tab.dataset.tab === tabId;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive.toString());
            tab.setAttribute('tabindex', isActive ? '0' : '-1');
        });
        
        // Show/hide sections
        this.tabSections.forEach(section => {
            const isActive = section.id === `${tabId}-section`;
            section.classList.toggle('active', isActive);
            section.setAttribute('aria-hidden', (!isActive).toString());
            
            // Lazy load content if needed
            if (isActive && section.dataset.lazyLoad) {
                this.lazyLoadSectionContent(section);
            }
        });
        
        this.currentTab = tabId;
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('treatmentTabChanged', {
            detail: { tab: tabId }
        }));
        
        // Scroll to top on mobile
        if (this.isMobile && tabId !== 'overview') {
            setTimeout(() => {
                window.scrollTo({
                    top: document.querySelector('.treatment-nav-tabs').offsetTop - 80,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }

    setupMobileTabNavigation() {
        // Make tab list scrollable on mobile
        const tabList = document.querySelector('.tab-list');
        if (tabList) {
            let isDown = false;
            let startX;
            let scrollLeft;
            
            tabList.addEventListener('mousedown', (e) => {
                isDown = true;
                startX = e.pageX - tabList.offsetLeft;
                scrollLeft = tabList.scrollLeft;
            });
            
            tabList.addEventListener('mouseleave', () => {
                isDown = false;
            });
            
            tabList.addEventListener('mouseup', () => {
                isDown = false;
            });
            
            tabList.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - tabList.offsetLeft;
                const walk = (x - startX) * 2;
                tabList.scrollLeft = scrollLeft - walk;
            });
            
            // Touch support
            tabList.addEventListener('touchstart', (e) => {
                startX = e.touches[0].pageX - tabList.offsetLeft;
                scrollLeft = tabList.scrollLeft;
            });
            
            tabList.addEventListener('touchmove', (e) => {
                if (!startX) return;
                const x = e.touches[0].pageX - tabList.offsetLeft;
                const walk = (x - startX) * 2;
                tabList.scrollLeft = scrollLeft - walk;
            });
        }
    }

    lazyLoadSectionContent(section) {
        // Lazy load images in section
        const images = section.querySelectorAll('img[data-src]');
        images.forEach(img => {
            if (img.getBoundingClientRect().top < window.innerHeight + 200) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
        });
    }
// ===== IMAGE COMPARISON SLIDER =====
initImageComparison() {
    const comparison = document.querySelector('.image-comparison');
    if (!comparison) return;

    const slider = comparison.querySelector('.comparison-slider');
    const afterImage = comparison.querySelector('.comparison-after');
    if (!slider || !afterImage) return;

    let isDragging = false;

    const updateSlider = (clientX) => {
        const rect = comparison.getBoundingClientRect();
        let x = clientX - rect.left;

        x = Math.max(0, Math.min(x, rect.width));
        const percent = (x / rect.width) * 100;

        slider.style.left = `${percent}%`;
        afterImage.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;

        slider.setAttribute('aria-valuenow', Math.round(percent));
    };

    slider.addEventListener('mousedown', () => isDragging = true);
    window.addEventListener('mousemove', e => isDragging && updateSlider(e.clientX));
    window.addEventListener('mouseup', () => isDragging = false);

    slider.addEventListener('touchstart', () => isDragging = true);
    window.addEventListener('touchmove', e => isDragging && updateSlider(e.touches[0].clientX));
    window.addEventListener('touchend', () => isDragging = false);

    slider.style.left = '50%';
    afterImage.style.clipPath = 'inset(0 50% 0 0)';
}


    // ===== FAQ ACCORDION =====
    initFAQAccordion() {
        const faqItems = document.querySelectorAll('.faq-item');
        if (!faqItems.length) return;
        
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            
            if (!question || !answer) return;
            
            // Generate unique IDs if not present
            const answerId = answer.id || `faq-answer-${Math.random().toString(36).substr(2, 9)}`;
            answer.id = answerId;
            question.setAttribute('aria-controls', answerId);
            question.setAttribute('aria-expanded', 'false');
            
            question.addEventListener('click', () => this.toggleFAQ(item));
            question.addEventListener('keydown', (e) => this.handleFAQKeydown(e, item));
        });
        
        // Open first FAQ by default on mobile
        if (this.isMobile && faqItems.length > 0) {
            this.toggleFAQ(faqItems[0]);
        }
    }

    toggleFAQ(item) {
        const isOpening = !item.classList.contains('active');
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        // Close all other items (accordion behavior)
        if (isOpening) {
            document.querySelectorAll('.faq-item.active').forEach(activeItem => {
                if (activeItem !== item) {
                    this.closeFAQ(activeItem);
                }
            });
        }
        
        // Toggle current item
        if (isOpening) {
            this.openFAQ(item);
        } else {
            this.closeFAQ(item);
        }
        
        // Scroll to question on mobile
        if (this.isMobile && isOpening) {
            setTimeout(() => {
                item.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }, 100);
        }
    }

    openFAQ(item) {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        item.classList.add('active');
        answer.classList.add('active');
        question.setAttribute('aria-expanded', 'true');
        
        // Set max-height for animation
        answer.style.maxHeight = answer.scrollHeight + 'px';
    }

    closeFAQ(item) {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        item.classList.remove('active');
        answer.classList.remove('active');
        question.setAttribute('aria-expanded', 'false');
        answer.style.maxHeight = '0';
    }

    handleFAQKeydown(e, item) {
        const items = Array.from(document.querySelectorAll('.faq-item'));
        const currentIndex = items.indexOf(item);
        
        switch(e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.toggleFAQ(item);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.focusFAQ(currentIndex + 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.focusFAQ(currentIndex - 1);
                break;
            case 'Home':
                e.preventDefault();
                this.focusFAQ(0);
                break;
            case 'End':
                e.preventDefault();
                this.focusFAQ(items.length - 1);
                break;
        }
    }

    focusFAQ(index) {
        const items = document.querySelectorAll('.faq-item');
        if (index < 0) index = items.length - 1;
        if (index >= items.length) index = 0;
        
        const item = items[index];
        const question = item.querySelector('.faq-question');
        question.focus();
        this.toggleFAQ(item);
    }

    // ===== IMAGE GALLERY =====
    initGallery() {
        const galleryItems = document.querySelectorAll('.gallery-item');
        if (!galleryItems.length) return;
        
        this.galleryImages = Array.from(galleryItems).map(item => ({
            src: item.querySelector('img')?.src,
            alt: item.querySelector('img')?.alt || 'Gallery image',
            label: item.querySelector('.gallery-label')?.textContent || ''
        }));
        
        this.currentGalleryIndex = 0;
        this.lightbox = document.getElementById('gallery-lightbox');
        
        if (!this.lightbox) {
            this.createLightbox();
        }
        
        // Set up gallery item click handlers
        galleryItems.forEach((item, index) => {
            item.addEventListener('click', () => this.openLightbox(index));
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.openLightbox(index);
                }
            });
            
            // Make items focusable
            item.setAttribute('tabindex', '0');
            item.setAttribute('role', 'button');
            item.setAttribute('aria-label', `View image ${index + 1}`);
        });
        
        // Set up lightbox controls
        this.setupLightboxControls();
    }

    createLightbox() {
        this.lightbox = document.createElement('div');
        this.lightbox.id = 'gallery-lightbox';
        this.lightbox.className = 'lightbox';
        this.lightbox.innerHTML = `
            <button class="lightbox-close" aria-label="Close lightbox">
                <i class="fas fa-times"></i>
            </button>
            <button class="lightbox-prev" aria-label="Previous image">
                <i class="fas fa-chevron-left"></i>
            </button>
            <button class="lightbox-next" aria-label="Next image">
                <i class="fas fa-chevron-right"></i>
            </button>
            <div class="lightbox-content">
                <img src="" alt="" />
                <div class="lightbox-caption"></div>
            </div>
        `;
        
        document.body.appendChild(this.lightbox);
        this.setupLightboxStyles();
    }

    setupLightboxStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .lightbox {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.95);
                z-index: 9999;
                display: none;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s;
            }
            
            .lightbox.active {
                display: flex;
                opacity: 1;
                animation: fadeIn 0.3s ease;
            }
            
            .lightbox-close {
                position: absolute;
                top: 20px;
                right: 20px;
                background: none;
                border: none;
                color: white;
                font-size: 2rem;
                cursor: pointer;
                padding: 10px;
                z-index: 10000;
            }
            
            .lightbox-prev,
            .lightbox-next {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(255,255,255,0.1);
                border: none;
                color: white;
                font-size: 1.5rem;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.3s;
            }
            
            .lightbox-prev:hover,
            .lightbox-next:hover {
                background: rgba(255,255,255,0.2);
            }
            
            .lightbox-prev {
                left: 20px;
            }
            
            .lightbox-next {
                right: 20px;
            }
            
            .lightbox-content {
                max-width: 90%;
                max-height: 90%;
                text-align: center;
            }
            
            .lightbox-content img {
                max-width: 100%;
                max-height: 70vh;
                object-fit: contain;
                border-radius: 8px;
            }
            
            .lightbox-caption {
                color: white;
                margin-top: 15px;
                font-size: 1.1rem;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @media (max-width: 768px) {
                .lightbox-prev,
                .lightbox-next {
                    width: 40px;
                    height: 40px;
                    font-size: 1.2rem;
                }
                
                .lightbox-prev {
                    left: 10px;
                }
                
                .lightbox-next {
                    right: 10px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupLightboxControls() {
        if (!this.lightbox) return;
        
        // Close button
        this.lightbox.querySelector('.lightbox-close').addEventListener('click', () => this.closeLightbox());
        
        // Navigation buttons
        this.lightbox.querySelector('.lightbox-prev').addEventListener('click', () => this.navigateGallery(-1));
        this.lightbox.querySelector('.lightbox-next').addEventListener('click', () => this.navigateGallery(1));
        
        // Keyboard navigation
        this.lightbox.addEventListener('keydown', (e) => this.handleLightboxKeydown(e));
        
        // Close on backdrop click
        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) {
                this.closeLightbox();
            }
        });
        
        // Touch gestures for mobile
        if (this.isMobile) {
            let touchStartX = 0;
            
            this.lightbox.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
            });
            
            this.lightbox.addEventListener('touchend', (e) => {
                const touchEndX = e.changedTouches[0].clientX;
                const diff = touchStartX - touchEndX;
                
                if (Math.abs(diff) > 50) {
                    if (diff > 0) {
                        this.navigateGallery(1); // Swipe left
                    } else {
                        this.navigateGallery(-1); // Swipe right
                    }
                }
            });
        }
    }

    openLightbox(index) {
        this.currentGalleryIndex = index;
        this.updateLightbox();
        this.showLightbox();
        
        // Lock body scroll
        document.body.style.overflow = 'hidden';
    }

    closeLightbox() {
        this.lightbox.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        // Return focus to the gallery item that was opened
        const galleryItems = document.querySelectorAll('.gallery-item');
        if (galleryItems[this.currentGalleryIndex]) {
            galleryItems[this.currentGalleryIndex].focus();
        }
    }

    showLightbox() {
        this.lightbox.classList.add('active');
        this.lightbox.querySelector('.lightbox-close').focus();
    }

    navigateGallery(direction) {
        this.currentGalleryIndex += direction;
        
        // Loop around
        if (this.currentGalleryIndex < 0) {
            this.currentGalleryIndex = this.galleryImages.length - 1;
        } else if (this.currentGalleryIndex >= this.galleryImages.length) {
            this.currentGalleryIndex = 0;
        }
        
        this.updateLightbox();
    }

    updateLightbox() {
        if (!this.galleryImages[this.currentGalleryIndex]) return;
        
        const image = this.galleryImages[this.currentGalleryIndex];
        const imgElement = this.lightbox.querySelector('img');
        const captionElement = this.lightbox.querySelector('.lightbox-caption');
        
        if (imgElement) {
            imgElement.src = image.src;
            imgElement.alt = image.alt;
        }
        
        if (captionElement) {
            captionElement.textContent = image.label || `Image ${this.currentGalleryIndex + 1} of ${this.galleryImages.length}`;
        }
        
        // Update navigation button visibility
        const prevBtn = this.lightbox.querySelector('.lightbox-prev');
        const nextBtn = this.lightbox.querySelector('.lightbox-next');
        
        if (prevBtn && nextBtn) {
            prevBtn.style.display = this.galleryImages.length > 1 ? 'flex' : 'none';
            nextBtn.style.display = this.galleryImages.length > 1 ? 'flex' : 'none';
        }
    }

    handleLightboxKeydown(e) {
        switch(e.key) {
            case 'Escape':
                this.closeLightbox();
                break;
            case 'ArrowLeft':
                this.navigateGallery(-1);
                break;
            case 'ArrowRight':
                this.navigateGallery(1);
                break;
        }
    }

    // ===== BOOKING FORM =====
    initBookingForm() {
        const form = document.querySelector('.appointment-form');
        if (!form) return;
        
        form.addEventListener('submit', (e) => this.handleBookingSubmit(e));
        
        // Add input validation
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
        
        // Set up date picker constraints
        const dateInput = form.querySelector('input[type="date"]');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            const maxDate = nextYear.toISOString().split('T')[0];
            
            dateInput.min = today;
            dateInput.max = maxDate;
        }
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }
        
        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }
        
        // Phone validation
        if (field.type === 'tel' && value) {
            const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
            if (!phoneRegex.test(value.replace(/\D/g, ''))) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number (10 digits minimum)';
            }
        }
        
        // Update field state
        this.setFieldState(field, isValid, errorMessage);
        return isValid;
    }

    setFieldState(field, isValid, message) {
        field.classList.toggle('invalid', !isValid);
        field.classList.toggle('valid', isValid);
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message if invalid
        if (!isValid && message) {
            const errorElement = document.createElement('span');
            errorElement.className = 'error-message';
            errorElement.textContent = message;
            errorElement.style.cssText = `
                display: block;
                color: var(--accent);
                font-size: 0.85rem;
                margin-top: 4px;
            `;
            field.parentNode.appendChild(errorElement);
            
            // Set ARIA attributes
            field.setAttribute('aria-invalid', 'true');
            field.setAttribute('aria-describedby', errorElement.id || `error-${Date.now()}`);
            
            if (!errorElement.id) {
                errorElement.id = `error-${Date.now()}`;
            }
        } else if (isValid) {
            field.setAttribute('aria-invalid', 'false');
            field.removeAttribute('aria-describedby');
        }
    }

    clearFieldError(field) {
        field.classList.remove('invalid', 'valid');
        const errorElement = field.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
        field.setAttribute('aria-invalid', 'false');
    }

    validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    async handleBookingSubmit(e) {
        e.preventDefault();
        const form = e.target;
        
        if (!this.validateForm(form)) {
            this.showNotification('Please fix the errors in the form', 'error');
            return;
        }
        
        // Disable submit button
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            
            try {
                // Simulate API call
                await this.submitBookingForm(form);
                
                // Show success message
                this.showSuccessModal();
                
                // Reset form
                form.reset();
                
                // Track conversion (if analytics available)
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'conversion', {
                        'send_to': 'AW-123456789/AbC-D_efGhIjKlMnOpQr',
                        'value': 1.0,
                        'currency': 'INR'
                    });
                }
                
            } catch (error) {
                console.error('Booking submission error:', error);
                this.showNotification('Failed to submit appointment request. Please try again.', 'error');
            } finally {
                // Re-enable submit button
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            }
        }
    }

    async submitBookingForm(form) {
        // In a real implementation, this would be an API call
        // For now, simulate API call with delay
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate 90% success rate
                Math.random() > 0.1 ? resolve() : reject(new Error('API Error'));
            }, 1500);
        });
    }

    showSuccessModal() {
        const modal = document.getElementById('success-modal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Auto-close after 5 seconds
            setTimeout(() => {
                if (modal.classList.contains('active')) {
                    this.closeSuccessModal();
                }
            }, 5000);
        } else {
            this.showNotification('Appointment request sent successfully! We will contact you soon.', 'success');
        }
    }

    closeSuccessModal() {
        const modal = document.getElementById('success-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    showNotification(message, type = 'info') {
        // Use main.js notification system if available
        if (window.YuvaSkinClinic?.showNotification) {
            window.YuvaSkinClinic.showNotification(message, type);
        } else {
            // Fallback notification
            alert(message);
        }
    }

    // ===== SEVERITY SELECTOR =====
    initSeveritySelector() {
        const severityCards = document.querySelectorAll('.severity-card');
        if (!severityCards.length) return;
        
        severityCards.forEach(card => {
            card.addEventListener('click', () => {
                severityCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                const severity = card.dataset.severity;
                this.updateTreatmentRecommendation(severity);
            });
        });
        
        // Select first card by default
        if (severityCards.length > 0) {
            severityCards[0].click();
        }
    }

    updateTreatmentRecommendation(severity) {
        const recommendations = {
            mild: {
                treatment: 'Medical Facials + Topical Creams',
                sessions: '3-4 sessions',
                timeline: '2-3 weeks for visible results'
            },
            moderate: {
                treatment: 'Chemical Peels + Prescription Medications',
                sessions: '4-6 sessions',
                timeline: '3-4 weeks for significant improvement'
            },
            severe: {
                treatment: 'Laser Therapy + Oral Medications',
                sessions: '6-8 sessions',
                timeline: '4-6 weeks for clearance'
            },
            cystic: {
                treatment: 'Combination Therapy + Regular Monitoring',
                sessions: '8-12 sessions',
                timeline: '6-8 weeks for control'
            }
        };
        
        const rec = recommendations[severity];
        if (rec) {
            console.log(`Treatment for ${severity}:`, rec);
            
            // Update UI with recommendation
            const recommendationElement = document.getElementById('treatment-recommendation');
            if (recommendationElement) {
                recommendationElement.innerHTML = `
                    <h4>Recommended Treatment:</h4>
                    <p><strong>${rec.treatment}</strong></p>
                    <p>Sessions: ${rec.sessions}</p>
                    <p>Timeline: ${rec.timeline}</p>
                `;
            }
        }
    }

    // ===== BACK TO TOP =====
    initBackToTop() {
        const backToTopButton = document.querySelector('.back-to-top');
        if (!backToTopButton) return;
        
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        });
        
        backToTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        // Adjust position for mobile bottom nav
        if (this.isMobile) {
            const bottomNav = document.querySelector('.bottom-nav');
            if (bottomNav) {
                const navHeight = bottomNav.offsetHeight;
                backToTopButton.style.bottom = `${navHeight + 20}px`;
            }
        }
    }

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Handle hash changes for deep linking
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1);
            if (hash && this.tabItems) {
                const tab = Array.from(this.tabItems).find(t => t.dataset.tab === hash);
                if (tab) {
                    this.activateTab(hash);
                }
            }
        });
        
        // Handle initial hash
        const initialHash = window.location.hash.substring(1);
        if (initialHash && this.tabItems) {
            const tab = Array.from(this.tabItems).find(t => t.dataset.tab === initialHash);
            if (tab) {
                setTimeout(() => this.activateTab(initialHash), 100);
            }
        }
        
        // Handle viewport changes
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 768;
        });
        
        // Handle tab clicks from other elements
        document.addEventListener('click', (e) => {
            const tabTrigger = e.target.closest('[data-tab]');
            if (tabTrigger && tabTrigger.dataset.tab) {
                e.preventDefault();
                this.activateTab(tabTrigger.dataset.tab);
            }
        });
    }

    // ===== PERFORMANCE OPTIMIZATION =====
    setupPerformance() {
        // Lazy load images
        this.lazyLoadImages();
        
        // Debounce scroll events
        this.setupScrollDebouncing();
        
        // Preload next tab content
        this.preloadNextTab();
    }

    lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        if (!images.length) return;
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }

    setupScrollDebouncing() {
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    // Update parallax effects or other scroll-based animations
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    preloadNextTab() {
        // Preload content of next tab for faster switching
        const preloadTab = (currentIndex) => {
            const tabs = Array.from(this.tabItems || []);
            const nextIndex = (currentIndex + 1) % tabs.length;
            const nextTabId = tabs[nextIndex]?.dataset.tab;
            
            if (nextTabId) {
                const nextSection = document.getElementById(`${nextTabId}-section`);
                if (nextSection) {
                    // Preload images in next section
                    const images = nextSection.querySelectorAll('img[data-src]');
                    images.forEach(img => {
                        const tempImg = new Image();
                        tempImg.src = img.dataset.src;
                    });
                }
            }
        };
        
        // Preload next tab when current tab changes
        document.addEventListener('treatmentTabChanged', (e) => {
            const tabs = Array.from(this.tabItems || []);
            const currentIndex = tabs.findIndex(t => t.dataset.tab === e.detail.tab);
            if (currentIndex !== -1) {
                setTimeout(() => preloadTab(currentIndex), 1000);
            }
        });
    }
}

// ===== INITIALIZE TREATMENT PAGE =====
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on a treatment page
    if (document.querySelector('.treatment-hero')) {
        window.treatmentPage = new TreatmentPage();
        
        // Make treatment page methods available globally
        window.showSuccessModal = () => window.treatmentPage?.showSuccessModal();
        window.closeSuccessModal = () => window.treatmentPage?.closeSuccessModal();
    }
});

// ===== EXPORT FOR MODULE SUPPORT =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TreatmentPage;
}a