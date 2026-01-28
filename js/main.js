/**
 * DR. DHOLARIYA'S YUVA SKIN CLINIC - MAIN JAVASCRIPT
 * Mobile-first, performance optimized, and accessible
 */

// ===== CONFIGURATION & UTILITIES =====
const CONFIG = {
    // Performance settings
    debounceDelay: 100,
    throttleDelay: 200,
    
    // Animation settings
    animationDuration: 300,
    scrollOffset: 100,
    
    // Storage keys
    storagePrefix: 'yuvaSkinClinic_',
    
    // API endpoints (if needed in future)
    api: {
        baseUrl: 'https://api.example.com',
        endpoints: {
            appointments: '/appointments',
            contact: '/contact'
        }
    }
};

// Utility functions
const Utils = {
    // Debounce for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle for scroll events
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Generate unique ID
    generateId(prefix = '') {
        return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Check if element is in viewport
    isInViewport(element, offset = 0) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) - offset &&
            rect.bottom >= 0
        );
    },

    // Get scroll position
    getScrollPosition() {
        return window.pageYOffset || document.documentElement.scrollTop;
    },

    // Scroll to element smoothly
    scrollToElement(element, offset = 80) {
        if (!element) return;
        const elementPosition = element.offsetTop - offset;
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    },

    // Check if mobile device
    isMobile() {
        return window.innerWidth <= 768;
    },

    // Check if touch device
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    // Format phone number
    formatPhoneNumber(phone) {
        return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    },

    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Failed to copy:', err);
            return false;
        }
    },

    // Local storage helpers
    setStorage(key, value) {
        try {
            localStorage.setItem(CONFIG.storagePrefix + key, JSON.stringify(value));
            return true;
        } catch (err) {
            console.error('Local storage error:', err);
            return false;
        }
    },

    getStorage(key) {
        try {
            const item = localStorage.getItem(CONFIG.storagePrefix + key);
            return item ? JSON.parse(item) : null;
        } catch (err) {
            console.error('Local storage error:', err);
            return null;
        }
    },

    removeStorage(key) {
        try {
            localStorage.removeItem(CONFIG.storagePrefix + key);
            return true;
        } catch (err) {
            console.error('Local storage error:', err);
            return false;
        }
    },

    // Show notification
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? '#2a9d8f' : type === 'error' ? '#e76f51' : '#6c757d'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            opacity: 0;
            transform: translateY(-20px);
            transition: opacity 0.3s, transform 0.3s;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });
        
        // Remove after duration
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, duration);
    },

    // Preload images
    preloadImages(images) {
        images.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }
};

// ===== PAGE NAVIGATION SYSTEM =====
class PageNavigation {
    constructor() {
        this.currentPage = 'home';
        this.pages = {};
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.handleInitialPage();
    }

    cacheElements() {
        // Navigation elements
        this.navItems = document.querySelectorAll('.nav-item[data-page]');
        this.desktopNavLinks = document.querySelectorAll('.desktop-nav a[data-page]');
        this.menuBtn = document.getElementById('menuBtn');
        this.pages = {
            home: document.getElementById('home-page'),
            services: document.getElementById('services-page'),
            about: document.getElementById('about-page'),
            contact: document.getElementById('contact-page')
        };

        // Mobile menu
        this.mobileMenu = document.querySelector('.mobile-menu');
    }

    bindEvents() {
        // Bottom nav clicks
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e, item));
        });

        // Desktop nav clicks
        this.desktopNavLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e, link));
        });

        // Menu button for mobile
        if (this.menuBtn) {
            this.menuBtn.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Handle browser back/forward
        window.addEventListener('popstate', () => this.handlePopState());

        // Handle escape key for mobile menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.mobileMenu?.classList.contains('active')) {
                this.closeMobileMenu();
            }
        });
    }

    handleNavigation(e, element) {
        e.preventDefault();
        
        const targetPage = element.getAttribute('data-page');
        if (!targetPage || targetPage === this.currentPage) return;

        this.switchPage(targetPage);
        this.updateActiveNav(element);
        this.updateURL(targetPage);
        
        // Close mobile menu if open
        this.closeMobileMenu();
    }

    switchPage(pageId) {
        // Hide all pages
        Object.values(this.pages).forEach(page => {
            if (page) {
                page.classList.remove('active');
                page.setAttribute('aria-hidden', 'true');
            }
        });

        // Show target page
        const targetPage = this.pages[pageId];
        if (targetPage) {
            targetPage.classList.add('active');
            targetPage.setAttribute('aria-hidden', 'false');
            this.currentPage = pageId;
            
            // Scroll to top smoothly
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            // Dispatch custom event
            document.dispatchEvent(new CustomEvent('pageChanged', {
                detail: { page: pageId }
            }));
        }
    }

    updateActiveNav(activeElement) {
        // Remove active class from all nav items
        this.navItems.forEach(item => item.classList.remove('active'));
        this.desktopNavLinks.forEach(link => link.classList.remove('active'));

        // Add active class to clicked element
        activeElement.classList.add('active');

        // Also update corresponding nav item
        const page = activeElement.getAttribute('data-page');
        if (activeElement.classList.contains('nav-item')) {
            const desktopLink = document.querySelector(`.desktop-nav a[data-page="${page}"]`);
            if (desktopLink) desktopLink.classList.add('active');
        } else {
            const mobileItem = document.querySelector(`.nav-item[data-page="${page}"]`);
            if (mobileItem) mobileItem.classList.add('active');
        }
    }

    updateURL(page) {
        const url = new URL(window.location);
        url.hash = page;
        window.history.pushState(null, '', url);
    }

    handlePopState() {
        const page = window.location.hash.substring(1) || 'home';
        this.switchPage(page);
        
        // Update active nav
        const navElement = document.querySelector(`[data-page="${page}"]`);
        if (navElement) this.updateActiveNav(navElement);
    }

    handleInitialPage() {
        const initialPage = window.location.hash.substring(1) || 'home';
        this.switchPage(initialPage);
        
        // Update active nav
        const navElement = document.querySelector(`[data-page="${initialPage}"]`);
        if (navElement) this.updateActiveNav(navElement);
    }

    toggleMobileMenu() {
        if (this.mobileMenu) {
            this.mobileMenu.classList.toggle('active');
            this.menuBtn.innerHTML = this.mobileMenu.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
            
            // Toggle body scroll
            document.body.style.overflow = this.mobileMenu.classList.contains('active') 
                ? 'hidden' 
                : 'auto';
            
            // Toggle aria-expanded
            this.menuBtn.setAttribute('aria-expanded', 
                this.mobileMenu.classList.contains('active').toString()
            );
        } else {
            // Fallback for desktop - show alert
            if (Utils.isMobile()) {
                alert('Mobile menu would open here. Navigation is in the bottom bar.');
            }
        }
    }

    closeMobileMenu() {
        if (this.mobileMenu?.classList.contains('active')) {
            this.mobileMenu.classList.remove('active');
            this.menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            document.body.style.overflow = 'auto';
            this.menuBtn.setAttribute('aria-expanded', 'false');
        }
    }
}

// ===== TREATMENT PAGE TABS =====
class TreatmentTabs {
    constructor() {
        this.currentTab = 'overview';
        this.tabs = {};
        this.init();
    }

    init() {
        this.cacheElements();
        if (this.tabList) {
            this.bindEvents();
            this.activateInitialTab();
        }
    }

    cacheElements() {
        this.tabList = document.querySelector('.tab-list');
        this.tabItems = document.querySelectorAll('.tab-item');
        this.tabSections = document.querySelectorAll('.treatment-section');
    }

    bindEvents() {
        this.tabItems.forEach(tab => {
            tab.addEventListener('click', (e) => this.handleTabClick(e, tab));
            tab.addEventListener('keydown', (e) => this.handleTabKeydown(e, tab));
        });

        // Keyboard navigation for tabs
        if (this.tabList) {
            this.tabList.addEventListener('keydown', (e) => this.handleTabListKeydown(e));
        }
    }

    handleTabClick(e, tab) {
        e.preventDefault();
        const targetTab = tab.getAttribute('data-tab');
        if (targetTab && targetTab !== this.currentTab) {
            this.switchTab(targetTab);
        }
    }

    handleTabKeydown(e, tab) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            tab.click();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            this.navigateTabs(e.key, tab);
        }
    }

    handleTabListKeydown(e) {
        if (e.key === 'Home' || e.key === 'End') {
            e.preventDefault();
            const tabs = Array.from(this.tabItems);
            const targetTab = e.key === 'Home' ? tabs[0] : tabs[tabs.length - 1];
            targetTab.focus();
            this.switchTab(targetTab.getAttribute('data-tab'));
        }
    }

    navigateTabs(direction, currentTab) {
        const tabs = Array.from(this.tabItems);
        const currentIndex = tabs.indexOf(currentTab);
        let nextIndex;

        if (direction === 'ArrowLeft') {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        } else if (direction === 'ArrowRight') {
            nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        }

        const nextTab = tabs[nextIndex];
        nextTab.focus();
        this.switchTab(nextTab.getAttribute('data-tab'));
    }

    switchTab(tabId) {
        // Hide all sections
        this.tabSections.forEach(section => {
            section.classList.remove('active');
            section.setAttribute('aria-hidden', 'true');
        });

        // Show target section
        const targetSection = document.getElementById(`${tabId}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.setAttribute('aria-hidden', 'false');
            this.currentTab = tabId;

            // Update active tab
            this.tabItems.forEach(tab => {
                tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
                tab.setAttribute('aria-selected', (tab.getAttribute('data-tab') === tabId).toString());
            });

            // Dispatch event
            document.dispatchEvent(new CustomEvent('tabChanged', {
                detail: { tab: tabId }
            }));

            // Scroll tab into view on mobile
            if (Utils.isMobile()) {
                const activeTab = document.querySelector(`.tab-item[data-tab="${tabId}"]`);
                if (activeTab) {
                    activeTab.scrollIntoView({
                        behavior: 'smooth',
                        inline: 'center',
                        block: 'nearest'
                    });
                }
            }
        }
    }

    activateInitialTab() {
        const initialTab = this.tabItems[0]?.getAttribute('data-tab') || 'overview';
        this.switchTab(initialTab);
    }
}

// ===== IMAGE COMPARISON SLIDER =====
class ImageComparison {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.isDragging = false;
        this.sliderPosition = 50; // Start in middle
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.updateSlider();
    }

    cacheElements() {
        this.slider = this.container.querySelector('.comparison-slider');
        this.beforeImage = this.container.querySelector('.comparison-before');
        this.containerWidth = this.container.offsetWidth;
    }

    bindEvents() {
        // Mouse events
        this.slider.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.stopDrag());

        // Touch events
        this.slider.addEventListener('touchstart', (e) => this.startDrag(e));
        document.addEventListener('touchmove', (e) => this.drag(e));
        document.addEventListener('touchend', () => this.stopDrag());

        // Keyboard support
        this.slider.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Make slider focusable
        this.slider.setAttribute('tabindex', '0');
        this.slider.setAttribute('role', 'slider');
        this.slider.setAttribute('aria-valuemin', '0');
        this.slider.setAttribute('aria-valuemax', '100');
        this.slider.setAttribute('aria-valuenow', this.sliderPosition.toString());
        this.slider.setAttribute('aria-label', 'Before and after image comparison slider');
    }

    startDrag(e) {
        this.isDragging = true;
        this.container.classList.add('dragging');
        e.preventDefault();
        
        // Focus the slider for keyboard users
        this.slider.focus();
    }

    drag(e) {
        if (!this.isDragging) return;

        e.preventDefault();
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const rect = this.container.getBoundingClientRect();
        const x = ((clientX - rect.left) / this.containerWidth) * 100;
        
        this.setSliderPosition(x);
    }

    stopDrag() {
        this.isDragging = false;
        this.container.classList.remove('dragging');
    }

    handleKeydown(e) {
        let newPosition = this.sliderPosition;
        
        switch(e.key) {
            case 'ArrowLeft':
            case 'ArrowDown':
                newPosition = Math.max(0, this.sliderPosition - 5);
                break;
            case 'ArrowRight':
            case 'ArrowUp':
                newPosition = Math.min(100, this.sliderPosition + 5);
                break;
            case 'Home':
                newPosition = 0;
                break;
            case 'End':
                newPosition = 100;
                break;
            default:
                return;
        }
        
        e.preventDefault();
        this.setSliderPosition(newPosition);
    }

    setSliderPosition(position) {
        // Constrain between 0 and 100
        this.sliderPosition = Math.max(0, Math.min(100, position));
        this.updateSlider();
    }

    updateSlider() {
        // Update slider position
        this.slider.style.left = `${this.sliderPosition}%`;
        
        // Update image clipping
        if (this.beforeImage) {
            this.beforeImage.style.clipPath = `polygon(0 0, ${this.sliderPosition}% 0, ${this.sliderPosition}% 100%, 0 100%)`;
        }
        
        // Update ARIA attributes
        this.slider.setAttribute('aria-valuenow', this.sliderPosition.toString());
        
        // Update labels
        const beforeLabel = this.container.querySelector('.label-before');
        const afterLabel = this.container.querySelector('.label-after');
        
        if (beforeLabel && afterLabel) {
            beforeLabel.textContent = `Before: ${Math.round(this.sliderPosition)}%`;
            afterLabel.textContent = `After: ${Math.round(100 - this.sliderPosition)}%`;
        }
    }
}

// ===== FAQ ACCORDION =====
class FAQAccordion {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.activeItem = null;
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
    }

    cacheElements() {
        this.faqItems = this.container.querySelectorAll('.faq-item');
    }

    bindEvents() {
        this.faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            
            question.addEventListener('click', () => this.toggleItem(item));
            question.addEventListener('keydown', (e) => this.handleKeydown(e, item));
            
            // Set ARIA attributes
            const answer = item.querySelector('.faq-answer');
            question.setAttribute('aria-expanded', 'false');
            question.setAttribute('aria-controls', answer?.id || `faq-answer-${Utils.generateId()}`);
            
            if (!answer.id) {
                answer.id = `faq-answer-${Utils.generateId()}`;
            }
        });
    }

    toggleItem(item) {
        const isOpening = !item.classList.contains('active');
        
        // Close all items first (accordion behavior)
        if (isOpening) {
            this.closeAllItems();
        }
        
        // Toggle current item
        item.classList.toggle('active');
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        const isActive = item.classList.contains('active');
        question.setAttribute('aria-expanded', isActive.toString());
        
        if (isActive) {
            answer.classList.add('active');
            this.activeItem = item;
            
            // Smooth scroll to question on mobile
            if (Utils.isMobile()) {
                setTimeout(() => {
                    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            }
        } else {
            answer.classList.remove('active');
            this.activeItem = null;
        }
    }

    closeAllItems() {
        this.faqItems.forEach(item => {
            item.classList.remove('active');
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            
            question.setAttribute('aria-expanded', 'false');
            answer.classList.remove('active');
        });
        
        this.activeItem = null;
    }

    handleKeydown(e, item) {
        switch(e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.toggleItem(item);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.navigateItems(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.navigateItems(-1);
                break;
            case 'Home':
                e.preventDefault();
                this.focusFirstItem();
                break;
            case 'End':
                e.preventDefault();
                this.focusLastItem();
                break;
        }
    }

    navigateItems(direction) {
        const items = Array.from(this.faqItems);
        const currentIndex = this.activeItem ? items.indexOf(this.activeItem) : -1;
        let nextIndex = currentIndex + direction;
        
        if (nextIndex < 0) nextIndex = items.length - 1;
        if (nextIndex >= items.length) nextIndex = 0;
        
        const nextItem = items[nextIndex];
        const nextQuestion = nextItem.querySelector('.faq-question');
        nextQuestion.focus();
        
        // Auto-open the focused item
        this.toggleItem(nextItem);
    }

    focusFirstItem() {
        const firstQuestion = this.faqItems[0]?.querySelector('.faq-question');
        if (firstQuestion) {
            firstQuestion.focus();
            this.toggleItem(this.faqItems[0]);
        }
    }

    focusLastItem() {
        const lastQuestion = this.faqItems[this.faqItems.length - 1]?.querySelector('.faq-question');
        if (lastQuestion) {
            lastQuestion.focus();
            this.toggleItem(this.faqItems[this.faqItems.length - 1]);
        }
    }
}

// ===== BACK TO TOP BUTTON =====
class BackToTop {
    constructor() {
        this.button = null;
        this.init();
    }

    init() {
        this.createButton();
        this.bindEvents();
        this.checkVisibility();
    }

    createButton() {
        this.button = document.createElement('button');
        this.button.className = 'back-to-top';
        this.button.setAttribute('aria-label', 'Back to top');
        this.button.setAttribute('title', 'Back to top');
        this.button.innerHTML = '<i class="fas fa-chevron-up"></i>';
        
        // Add styles
        this.button.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            width: 44px;
            height: 44px;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            cursor: pointer;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s, visibility 0.3s, transform 0.3s;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(this.button);
    }

    bindEvents() {
        this.button.addEventListener('click', () => this.scrollToTop());
        
        // Show/hide based on scroll
        window.addEventListener('scroll', 
            Utils.throttle(() => this.checkVisibility(), CONFIG.throttleDelay)
        );
        
        // Handle mobile bottom nav overlap
        window.addEventListener('resize', 
            Utils.debounce(() => this.adjustPosition(), CONFIG.debounceDelay)
        );
    }

    checkVisibility() {
        const scrollPosition = Utils.getScrollPosition();
        const windowHeight = window.innerHeight;
        
        if (scrollPosition > windowHeight / 2) {
            this.showButton();
        } else {
            this.hideButton();
        }
    }

    showButton() {
        this.button.style.opacity = '1';
        this.button.style.visibility = 'visible';
        this.button.style.transform = 'translateY(0)';
    }

    hideButton() {
        this.button.style.opacity = '0';
        this.button.style.visibility = 'hidden';
        this.button.style.transform = 'translateY(20px)';
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        // Focus management for accessibility
        const mainContent = document.querySelector('main') || document.querySelector('.page.active');
        if (mainContent) {
            mainContent.setAttribute('tabindex', '-1');
            mainContent.focus();
            setTimeout(() => mainContent.removeAttribute('tabindex'), 1000);
        }
    }

    adjustPosition() {
        // Adjust for mobile bottom navigation
        if (Utils.isMobile()) {
            const bottomNav = document.querySelector('.bottom-nav');
            if (bottomNav) {
                const navHeight = bottomNav.offsetHeight;
                this.button.style.bottom = `${navHeight + 20}px`;
            }
        } else {
            this.button.style.bottom = '40px';
            this.button.style.right = '40px';
        }
    }
}

// ===== APPOINTMENT FORM HANDLER =====
class AppointmentForm {
    constructor(formId) {
        this.form = document.getElementById(formId);
        if (!this.form) return;

        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.setupValidation();
    }

    cacheElements() {
        this.inputs = this.form.querySelectorAll('input, select, textarea');
        this.submitButton = this.form.querySelector('button[type="submit"]');
    }

    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Real-time validation
        this.inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearError(input));
        });
    }

    setupValidation() {
        // Add required attributes
        this.inputs.forEach(input => {
            if (input.hasAttribute('required')) {
                input.setAttribute('aria-required', 'true');
            }
        });
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
            if (!phoneRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
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
            field.setAttribute('aria-describedby', errorElement.id || `error-${Utils.generateId()}`);
            
            if (!errorElement.id) {
                errorElement.id = `error-${Utils.generateId()}`;
            }
        } else if (isValid) {
            field.setAttribute('aria-invalid', 'false');
            field.removeAttribute('aria-describedby');
        }
    }

    clearError(field) {
        field.classList.remove('invalid', 'valid');
        const errorElement = field.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
        field.setAttribute('aria-invalid', 'false');
    }

    validateForm() {
        let isValid = true;
        
        this.inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            Utils.showNotification('Please fix the errors in the form', 'error');
            return;
        }

        // Disable submit button
        if (this.submitButton) {
            this.submitButton.disabled = true;
            this.submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        }

        try {
            // In a real implementation, this would be an API call
            // For now, simulate API call
            await this.simulateApiCall();
            
            Utils.showNotification('Appointment request sent successfully! We will contact you soon.', 'success');
            this.form.reset();
            
            // Save to local storage for user convenience
            const formData = new FormData(this.form);
            const data = Object.fromEntries(formData);
            Utils.setStorage('lastAppointmentData', data);
            
        } catch (error) {
            console.error('Form submission error:', error);
            Utils.showNotification('Failed to send appointment request. Please try again.', 'error');
        } finally {
            // Re-enable submit button
            if (this.submitButton) {
                this.submitButton.disabled = false;
                this.submitButton.innerHTML = 'Book Appointment';
            }
        }
    }

    simulateApiCall() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate 90% success rate
                Math.random() > 0.1 ? resolve() : reject(new Error('API Error'));
            }, 1500);
        });
    }
}

// ===== GALLERY / IMAGE VIEWER =====
class ImageGallery {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.currentIndex = 0;
        this.images = [];
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.setupLightbox();
    }

    cacheElements() {
        this.galleryItems = this.container.querySelectorAll('.gallery-item');
        this.images = Array.from(this.galleryItems).map(item => ({
            src: item.querySelector('img')?.src,
            alt: item.querySelector('img')?.alt || 'Gallery image',
            label: item.querySelector('.gallery-label')?.textContent || ''
        }));
    }

    bindEvents() {
        this.galleryItems.forEach((item, index) => {
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
            item.setAttribute('aria-label', `View image ${index + 1}: ${this.images[index].label}`);
        });
    }

    setupLightbox() {
        // Create lightbox elements
        this.lightbox = document.createElement('div');
        this.lightbox.className = 'lightbox';
        this.lightbox.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 9999;
            display: none;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        
        // Lightbox content
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
        this.bindLightboxEvents();
    }

    bindLightboxEvents() {
        // Close button
        this.lightbox.querySelector('.lightbox-close').addEventListener('click', () => this.closeLightbox());
        
        // Navigation buttons
        this.lightbox.querySelector('.lightbox-prev').addEventListener('click', () => this.navigate(-1));
        this.lightbox.querySelector('.lightbox-next').addEventListener('click', () => this.navigate(1));
        
        // Keyboard navigation
        this.lightbox.addEventListener('keydown', (e) => this.handleLightboxKeydown(e));
        
        // Close on backdrop click
        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) {
                this.closeLightbox();
            }
        });
    }

    openLightbox(index) {
        this.currentIndex = index;
        this.updateLightbox();
        this.showLightbox();
        
        // Lock body scroll
        document.body.style.overflow = 'hidden';
    }

    closeLightbox() {
        this.lightbox.style.opacity = '0';
        setTimeout(() => {
            this.lightbox.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Return focus to the gallery item that was opened
            const galleryItem = this.galleryItems[this.currentIndex];
            if (galleryItem) {
                galleryItem.focus();
            }
        }, 300);
    }

    showLightbox() {
        this.lightbox.style.display = 'flex';
        requestAnimationFrame(() => {
            this.lightbox.style.opacity = '1';
            // Focus the close button for keyboard users
            this.lightbox.querySelector('.lightbox-close').focus();
        });
    }

    navigate(direction) {
        this.currentIndex += direction;
        
        // Loop around
        if (this.currentIndex < 0) {
            this.currentIndex = this.images.length - 1;
        } else if (this.currentIndex >= this.images.length) {
            this.currentIndex = 0;
        }
        
        this.updateLightbox();
    }

    updateLightbox() {
        const image = this.images[this.currentIndex];
        const imgElement = this.lightbox.querySelector('img');
        const captionElement = this.lightbox.querySelector('.lightbox-caption');
        
        if (imgElement) {
            imgElement.src = image.src;
            imgElement.alt = image.alt;
        }
        
        if (captionElement) {
            captionElement.textContent = image.label || `${this.currentIndex + 1} / ${this.images.length}`;
        }
        
        // Update navigation button visibility
        const prevBtn = this.lightbox.querySelector('.lightbox-prev');
        const nextBtn = this.lightbox.querySelector('.lightbox-next');
        
        if (prevBtn && nextBtn) {
            prevBtn.style.display = this.images.length > 1 ? 'flex' : 'none';
            nextBtn.style.display = this.images.length > 1 ? 'flex' : 'none';
        }
    }

    handleLightboxKeydown(e) {
        switch(e.key) {
            case 'Escape':
                this.closeLightbox();
                break;
            case 'ArrowLeft':
                this.navigate(-1);
                break;
            case 'ArrowRight':
                this.navigate(1);
                break;
        }
    }
}

// ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Handle anchor link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link && link.getAttribute('href') !== '#') {
                e.preventDefault();
                this.handleAnchorClick(link);
            }
        });
    }

    handleAnchorClick(link) {
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            // If it's a page link, use page navigation
            if (targetId.includes('-page')) {
                const pageNav = window.pageNavigation;
                if (pageNav) {
                    const page = targetId.replace('-page', '');
                    pageNav.switchPage(page);
                }
            } else {
                // Regular anchor link
                Utils.scrollToElement(targetElement, CONFIG.scrollOffset);
            }
        }
    }
}

// ===== PERFORMANCE OBSERVER =====
class PerformanceMonitor {
    constructor() {
        this.init();
    }

    init() {
        this.monitorCLS();
        this.monitorLCP();
        this.setupResourceTiming();
    }

    monitorCLS() {
        // Monitor Cumulative Layout Shift
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    console.log('Layout shift:', entry);
                }
            });
            observer.observe({ entryTypes: ['layout-shift'] });
        }
    }

    monitorLCP() {
        // Monitor Largest Contentful Paint
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                console.log('LCP:', lastEntry.startTime);
            });
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
        }
    }

    setupResourceTiming() {
        // Log slow resources
        if ('performance' in window) {
            window.addEventListener('load', () => {
                const resources = performance.getEntriesByType('resource');
                resources.forEach(resource => {
                    if (resource.duration > 1000) {
                        console.warn('Slow resource:', resource.name, resource.duration);
                    }
                });
            });
        }
    }
}

// ===== SERVICE WORKER REGISTRATION =====
class ServiceWorkerManager {
    constructor() {
        this.init();
    }

    async init() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('ServiceWorker registered:', registration);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('ServiceWorker update found:', newWorker);
                });
                
            } catch (error) {
                console.error('ServiceWorker registration failed:', error);
            }
        }
    }
}

// ===== MAIN INITIALIZATION =====
class YuvaSkinClinicApp {
    constructor() {
        this.components = {};
        this.init();
    }

    init() {
        // Initialize only when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        console.log('Yuva Skin Clinic App Initializing...');
        
        // Initialize utility functions first
        this.setupUtilities();
        
        // Initialize core components
        this.initializeComponents();
        
        // Set up event listeners
        this.setupGlobalEvents();
        
        // Performance monitoring
        if (process.env.NODE_ENV === 'development') {
            this.components.performance = new PerformanceMonitor();
        }
        
        // Service worker (for PWA features)
        if (process.env.NODE_ENV === 'production') {
            // this.components.serviceWorker = new ServiceWorkerManager();
        }
        
        // App loaded event
        document.dispatchEvent(new CustomEvent('appLoaded'));
        console.log('Yuva Skin Clinic App Ready!');
    }

    setupUtilities() {
        // Preload critical images
        const criticalImages = [
            'https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ];
        Utils.preloadImages(criticalImages);
    }

    initializeComponents() {
        // Core navigation
        this.components.pageNavigation = new PageNavigation();
        window.pageNavigation = this.components.pageNavigation;
        
        // Treatment tabs (if on treatment page)
        if (document.querySelector('.tab-list')) {
            this.components.treatmentTabs = new TreatmentTabs();
        }
        
        // Image comparison sliders
        const comparisonSliders = document.querySelectorAll('.image-comparison');
        if (comparisonSliders.length > 0) {
            this.components.imageComparisons = [];
            comparisonSliders.forEach((slider, index) => {
                this.components.imageComparisons.push(
                    new ImageComparison(slider.id || `comparison-${index}`)
                );
            });
        }
        
        // FAQ accordions
        const faqContainers = document.querySelectorAll('.faq-accordion');
        if (faqContainers.length > 0) {
            this.components.faqAccordions = [];
            faqContainers.forEach((container, index) => {
                this.components.faqAccordions.push(
                    new FAQAccordion(container.id || `faq-${index}`)
                );
            });
        }
        
        // Back to top button
        this.components.backToTop = new BackToTop();
        
        // Appointment forms
        const appointmentForms = document.querySelectorAll('form.appointment-form');
        if (appointmentForms.length > 0) {
            this.components.appointmentForms = [];
            appointmentForms.forEach((form, index) => {
                this.components.appointmentForms.push(
                    new AppointmentForm(form.id || `appointment-form-${index}`)
                );
            });
        }
        
        // Image galleries
        const galleries = document.querySelectorAll('.gallery-grid');
        if (galleries.length > 0) {
            this.components.galleries = [];
            galleries.forEach((gallery, index) => {
                this.components.galleries.push(
                    new ImageGallery(gallery.id || `gallery-${index}`)
                );
            });
        }
        
        // Smooth scroll
        this.components.smoothScroll = new SmoothScroll();
    }

    setupGlobalEvents() {
        // Handle page changes
        document.addEventListener('pageChanged', (e) => {
            const { page } = e.detail;
            console.log(`Page changed to: ${page}`);
            
            // Update analytics (if implemented)
            if (typeof gtag !== 'undefined') {
                gtag('event', 'page_view', {
                    page_title: page,
                    page_location: window.location.href
                });
            }
        });
        
        // Handle tab changes
        document.addEventListener('tabChanged', (e) => {
            const { tab } = e.detail;
            console.log(`Tab changed to: ${tab}`);
        });
        
        // Handle online/offline status
        window.addEventListener('online', () => {
            Utils.showNotification('You are back online', 'success');
        });
        
        window.addEventListener('offline', () => {
            Utils.showNotification('You are offline. Some features may not work.', 'warning', 5000);
        });
        
        // Handle viewport changes
        window.addEventListener('resize', 
            Utils.debounce(() => this.handleViewportChange(), CONFIG.debounceDelay)
        );
        
        // Handle visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('App is in background');
            } else {
                console.log('App is in foreground');
            }
        });
    }

    handleViewportChange() {
        const isMobile = Utils.isMobile();
        document.body.classList.toggle('is-mobile', isMobile);
        document.body.classList.toggle('is-desktop', !isMobile);
        
        // Dispatch viewport change event
        document.dispatchEvent(new CustomEvent('viewportChanged', {
            detail: { isMobile }
        }));
    }

    // Public API methods
    showNotification(message, type = 'info') {
        Utils.showNotification(message, type);
    }

    scrollToElement(selector, offset = CONFIG.scrollOffset) {
        const element = document.querySelector(selector);
        if (element) {
            Utils.scrollToElement(element, offset);
        }
    }

    switchPage(pageId) {
        if (this.components.pageNavigation) {
            this.components.pageNavigation.switchPage(pageId);
        }
    }

    openAppointmentModal() {
        const modal = document.getElementById('appointmentModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeAppointmentModal() {
        const modal = document.getElementById('appointmentModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
}

// ===== EXPOSE TO WINDOW =====
// Create global app instance
window.YuvaSkinClinic = new YuvaSkinClinicApp();

// Expose utility functions
window.YuvaSkinClinicUtils = Utils;

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    
    // Send to analytics (if implemented)
    if (typeof gtag !== 'undefined') {
        gtag('event', 'exception', {
            description: e.error.message,
            fatal: false
        });
    }
    
    // Show user-friendly error message for critical errors
    if (e.error.message.includes('critical')) {
        Utils.showNotification('Something went wrong. Please refresh the page.', 'error');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    
    // Prevent default browser error handling
    e.preventDefault();
});

// ===== OFFLINE SUPPORT =====
// Check if app is installable (PWA)
if ('getInstalledRelatedApps' in navigator) {
    navigator.getInstalledRelatedApps().then(apps => {
        if (apps.length > 0) {
            console.log('App is installed');
            document.body.classList.add('app-installed');
        }
    });
}

// ===== ANALYTICS (Optional) =====
// Uncomment and configure if you have analytics
/*
if (typeof gtag !== 'undefined') {
    // Track page views
    document.addEventListener('pageChanged', (e) => {
        gtag('event', 'page_view', {
            page_title: e.detail.page,
            page_location: window.location.href
        });
    });
    
    // Track button clicks
    document.addEventListener('click', (e) => {
        const button = e.target.closest('button, a');
        if (button) {
            const action = button.textContent || button.getAttribute('aria-label') || 'click';
            gtag('event', 'click', {
                event_category: 'engagement',
                event_label: action
            });
        }
    });
}
*/

// ===== EXPORT FOR MODULE SUPPORT =====
// If using ES modules, export the classes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        YuvaSkinClinicApp,
        PageNavigation,
        TreatmentTabs,
        ImageComparison,
        FAQAccordion,
        BackToTop,
        AppointmentForm,
        ImageGallery,
        SmoothScroll,
        Utils
    };
}




// ================================
// SYSTEM DARK MODE SUPPORT (HOME PAGE)
// ================================

function applySystemTheme() {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark-theme');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.classList.remove('dark-theme');
  }
}

// Run on page load
applySystemTheme();

// Listen for system theme change
window.matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', applySystemTheme);
