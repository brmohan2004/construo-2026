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

            <!-- WhatsApp Tooltip -->
            <div class="whatsapp-tooltip" id="whatsappTooltip">
                Connect via WhatsApp Community
            </div>

            <!-- WhatsApp FAB -->
            <a href="#" target="_blank" class="whatsapp-fab" id="whatsappFab">
                <div class="whatsapp-icon-wrapper">
                    <svg viewBox="0 0 24 24" fill="#ffffff" stroke="none">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                </div>
            </a>

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
        if (config && config.footer) {
            if (config.footer.faqs) {
                this.renderFAQs(config.footer.faqs);
            } else {
                this.renderEmpty();
            }
            this.renderWhatsApp(config.footer.social);
        } else {
            this.renderEmpty();
        }
    }

    renderWhatsApp(social) {
        const fab = document.getElementById('whatsappFab');
        const tooltip = document.getElementById('whatsappTooltip');
        if (!fab) return;

        if (social && social.whatsappCommunity) {
            fab.href = social.whatsappCommunity;
            fab.style.display = 'flex';
            if (tooltip) tooltip.style.display = 'block';
        } else {
            fab.style.display = 'none';
            if (tooltip) tooltip.style.display = 'none';
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
