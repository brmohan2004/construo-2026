/**
 * FAQ Chat Widget
 * Handles the floating action button and chat window for FAQs.
 */

class FAQWidget {
    constructor() {
        this.config = null;
        this.isOpen = false;

        this.init();
    }

    async init() {
        // Render Widget Skeleton
        this.renderWidget();

        // Bind Events immediately so FAB is clickable even if data is loading
        this.bindEvents();

        // Load Data with retry
        await this.loadFAQs();
    }

    renderWidget() {
        const div = document.createElement('div');
        div.id = 'faq-widget';
        div.innerHTML = `
            <!-- Chat Box -->
            <div class="faq-chat-box" id="faqChatBox">
                <div class="faq-header">
                    <div class="faq-title">
                        <h3>FAQ Support</h3>
                        <p>Ask us anything!</p>
                    </div>
                </div>
                <div class="faq-content" id="faqContent">
                    <div class="faq-loading" style="text-align: center; padding: 20px; color: #aaa;">
                        <span style="display: inline-block; animation: spin 1s linear infinite;">⏳</span> Loading questions...
                    </div>
                </div>
            </div>

            <!-- Tooltip -->
            <div class="faq-tooltip" id="faqTooltip">
                Ask your question
            </div>

            <!-- FAB -->
            <div class="faq-fab" id="faqFab" title="FAQ & Support">
                <div class="faq-icon-wrapper">
                    <!-- Question Mark Icon -->
                    <svg class="icon-open" viewBox="0 0 24 24" style="display: block;">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <!-- Close (X) Icon -->
                    <svg class="icon-close" viewBox="0 0 24 24" style="display: none;">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </div>
            </div>
        `;
        document.body.appendChild(div);
    }

    async loadFAQs() {
        let attempts = 0;
        const maxAttempts = 10;

        while (!window.ConstruoSupabaseData && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }

        if (window.ConstruoSupabaseData) {
            try {
                const config = await window.ConstruoSupabaseData.getSiteConfig();
                this.updateContent(config);
            } catch (error) {
                console.error('Failed to fetching config:', error);
                this.renderError();
            }
        } else {
            console.warn('ConstruoSupabaseData not found after retries');
            this.renderError();
        }

        // Listen for updates
        window.addEventListener('construo-data-refreshed', (e) => {
            if (e.detail && e.detail.siteConfig) {
                this.updateContent(e.detail.siteConfig);
            }
        });
    }

    updateContent(config) {
        if (config && config.footer && config.footer.faqs) {
            this.renderFAQs(config.footer.faqs);
        } else {
            this.renderEmpty();
        }
    }

    renderFAQs(faqs) {
        const container = document.getElementById('faqContent');

        if (!faqs || faqs.length === 0) {
            this.renderEmpty();
            return;
        }

        container.innerHTML = faqs.map((faq, index) => `
            <div class="faq-item" id="faq-item-${index}">
                <div class="faq-question">
                    <span>${this.escapeHtml(faq.question)}</span>
                </div>
                <div class="faq-answer">
                    <div class="faq-answer-inner" style="padding: 10px 0;">
                        ${this.escapeHtml(faq.answer)}
                    </div>
                </div>
            </div>
        `).join('');

        // Re-bind item events
        const items = container.querySelectorAll('.faq-item');
        items.forEach(item => {
            const question = item.querySelector('.faq-question');
            question.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = item.classList.contains('open');

                // Close all others
                items.forEach(i => i.classList.remove('open'));

                // Toggle current
                if (!isOpen) {
                    item.classList.add('open');
                }
            });
        });
    }

    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    renderEmpty() {
        const container = document.getElementById('faqContent');
        if (container) {
            container.innerHTML = `
                <div class="faq-empty">
                    <p>No questions added yet.</p>
                </div>
            `;
        }
    }

    renderError() {
        const container = document.getElementById('faqContent');
        if (container) {
            container.innerHTML = `
                <div class="faq-empty">
                    <p>Could not load FAQs. Please try again later.</p>
                </div>
            `;
        }
    }

    bindEvents() {
        const fab = document.getElementById('faqFab');
        const box = document.getElementById('faqChatBox');
        const iconOpen = fab ? fab.querySelector('.icon-open') : null;
        const iconClose = fab ? fab.querySelector('.icon-close') : null;

        if (!fab || !box) return;

        fab.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent document click from closing immediately
            this.toggle(box, fab, iconOpen, iconClose);
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && !box.contains(e.target) && !fab.contains(e.target)) {
                this.close(box, fab, iconOpen, iconClose);
            }
        });
    }

    toggle(box, fab, iconOpen, iconClose) {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            box.classList.add('active');
            fab.classList.add('active');
            if (iconOpen) iconOpen.style.display = 'none';
            if (iconClose) iconClose.style.display = 'block';
        } else {
            this.close(box, fab, iconOpen, iconClose);
        }
    }

    close(box, fab, iconOpen, iconClose) {
        this.isOpen = false;
        box.classList.remove('active');
        fab.classList.remove('active');
        if (iconOpen) iconOpen.style.display = 'block';
        if (iconClose) iconClose.style.display = 'none';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.faqWidget = new FAQWidget();
});
