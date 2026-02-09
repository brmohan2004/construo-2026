/**
 * CONSTRUO 2026 - Scroll Animations
 * Framer Motion-like section reveal animations using GSAP
 * Parallax effects and smooth scroll interactions
 */

class ScrollAnimations {
    constructor() {
        this.sections = [];
        this.animatedElements = [];
        this.scrollY = 0;
        this.viewportHeight = window.innerHeight;
        this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn('GSAP or ScrollTrigger not loaded. Scroll animations disabled.');
            this.fallbackMode = true;
            return;
        }

        gsap.registerPlugin(ScrollTrigger);
        this.init();
    }

    init() {
        // Wait for DOM to be fully ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupAnimations());
        } else {
            this.setupAnimations();
        }

        // Handle resize
        window.addEventListener('resize', () => this.handleResize());
    }

    setupAnimations() {
        if (this.isReducedMotion) {
            // Show all elements immediately for users who prefer reduced motion
            this.showAllElements();
            return;
        }

        // Setup section reveal animations
        this.setupSectionReveals();

        // Setup staggered grid animations
        this.setupGridAnimations();

        // Setup parallax effects
        this.setupParallaxEffects();

        // Setup navbar scroll effects
        this.setupNavbarEffects();

        // Setup scroll progress indicator
        this.setupScrollProgress();

        // Refresh ScrollTrigger after all animations are set up
        ScrollTrigger.refresh();
    }

    setupSectionReveals() {
        // Select all major sections
        const sections = document.querySelectorAll('.section-about, .section-timeline, .section-speakers, .section-events, .section-venue, .section-organizers, .section-sponsors');

        sections.forEach((section) => {
            // Animate section header
            const header = section.querySelector('.section-header');
            if (header) {
                gsap.fromTo(header,
                    {
                        opacity: 0,
                        y: 60
                    },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.8,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: header,
                            start: 'top 85%',
                            end: 'top 50%',
                            toggleActions: 'play none none reverse'
                        }
                    }
                );
            }

            // Animate section container content
            const container = section.querySelector('.section-container');
            if (container) {
                const children = container.children;

                // Skip the header and animate other direct children
                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    if (child.classList.contains('section-header')) continue;

                    gsap.fromTo(child,
                        {
                            opacity: 0,
                            y: 50
                        },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.7,
                            ease: 'power2.out',
                            scrollTrigger: {
                                trigger: child,
                                start: 'top 80%',
                                toggleActions: 'play none none reverse'
                            }
                        }
                    );
                }
            }
        });
    }

    setupGridAnimations() {
        // Speakers grid stagger animation
        const speakersGrid = document.querySelector('.speakers-grid');
        if (speakersGrid) {
            this.observeGrid(speakersGrid, '.speaker-card');
        }

        // Events grid stagger animation
        const eventsGrids = document.querySelectorAll('.events-grid');
        eventsGrids.forEach(grid => {
            this.observeGrid(grid, '.event-card');
        });

        // Organizers carousel
        const organizerRows = document.querySelectorAll('.organizer-row');
        organizerRows.forEach(row => {
            gsap.fromTo(row,
                {
                    opacity: 0,
                    x: row.dataset.direction === 'right' ? -50 : 50
                },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.8,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: row,
                        start: 'top 85%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        });

        // Stats items
        const statsItems = document.querySelectorAll('.stat-item');
        if (statsItems.length > 0) {
            gsap.fromTo(statsItems,
                {
                    opacity: 0,
                    y: 30,
                    scale: 0.9
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.5,
                    stagger: 0.1,
                    ease: 'back.out(1.7)',
                    scrollTrigger: {
                        trigger: statsItems[0].parentElement,
                        start: 'top 80%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        }
    }

    observeGrid(grid, childSelector) {
        // Use Intersection Observer for performance
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const items = grid.querySelectorAll(childSelector);

                    gsap.fromTo(items,
                        {
                            opacity: 0,
                            y: 40,
                            scale: 0.95
                        },
                        {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            duration: 0.6,
                            stagger: {
                                each: 0.08,
                                from: 'start'
                            },
                            ease: 'power2.out'
                        }
                    );

                    // Unobserve after animation
                    observer.unobserve(grid);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -10% 0px'
        });

        observer.observe(grid);
    }

    setupParallaxEffects() {
        // Hero content parallax
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            gsap.to(heroContent, {
                y: 100,
                opacity: 0.3,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.section-hero',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 1
                }
            });
        }

        // Hero fee parallax
        const heroFee = document.querySelector('.hero-fee');
        if (heroFee) {
            gsap.to(heroFee, {
                y: 50,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.section-hero',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 0.5
                }
            });
        }

        // About poster parallax
        const aboutPoster = document.querySelector('.event-poster');
        if (aboutPoster) {
            gsap.to(aboutPoster, {
                y: -30,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.section-about',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 0.8
                }
            });
        }

        // Timeline crane animation
        const crane = document.querySelector('.timeline-crane');
        if (crane) {
            gsap.to(crane, {
                y: () => document.querySelector('.timeline-days')?.offsetHeight || 500,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.section-timeline',
                    start: 'top 60%',
                    end: 'bottom 40%',
                    scrub: 0.5
                }
            });
        }

        // Venue map parallax
        const venueMap = document.querySelector('.venue-map');
        if (venueMap) {
            gsap.to(venueMap, {
                y: 30,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.section-venue',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1
                }
            });
        }

        // Prize banner pulse on scroll
        const prizeBanner = document.querySelector('.prize-banner');
        if (prizeBanner) {
            gsap.fromTo(prizeBanner,
                {
                    scale: 0.9,
                    opacity: 0
                },
                {
                    scale: 1,
                    opacity: 1,
                    duration: 0.8,
                    ease: 'elastic.out(1, 0.5)',
                    scrollTrigger: {
                        trigger: prizeBanner,
                        start: 'top 85%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        }
    }

    setupNavbarEffects() {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;

        ScrollTrigger.create({
            trigger: 'body',
            start: 'top -100',
            onUpdate: (self) => {
                if (self.direction === -1) {
                    navbar.classList.remove('navbar-small');
                } else {
                    navbar.classList.add('navbar-small');
                }
            }
        });

        // Add scrolled class
        ScrollTrigger.create({
            trigger: 'body',
            start: 'top -50',
            onEnter: () => navbar.classList.add('scrolled'),
            onLeaveBack: () => navbar.classList.remove('scrolled')
        });
    }

    setupScrollProgress() {
        const progressBar = document.querySelector('.scroll-progress .progress-bar');
        const progressText = document.querySelector('.scroll-progress .progress-text');
        const progressContainer = document.querySelector('.scroll-progress');

        if (!progressBar || !progressContainer) return;

        ScrollTrigger.create({
            trigger: 'body',
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: (self) => {
                const progress = self.progress;
                const circumference = 283;
                const offset = circumference - (progress * circumference);

                progressBar.style.strokeDashoffset = offset;

                if (progressText) {
                    progressText.textContent = `${Math.round(progress * 100)}%`;
                }

                // Show/hide based on scroll position
                if (progress > 0.02 && progress < 0.98) {
                    progressContainer.classList.add('visible');
                } else {
                    progressContainer.classList.remove('visible');
                }
            }
        });
    }

    handleResize() {
        // Refresh ScrollTrigger on resize
        ScrollTrigger.refresh();
        this.viewportHeight = window.innerHeight;
    }

    showAllElements() {
        // Fallback for reduced motion - show all elements
        const hiddenElements = document.querySelectorAll('.section-reveal, .stagger-reveal > *');
        hiddenElements.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    }
}

// Timeline day reveal (for dynamically loaded content)
function setupTimelineDayAnimations() {
    if (typeof gsap === 'undefined') return;

    const timelineDays = document.querySelectorAll('.timeline-day');
    timelineDays.forEach((day, index) => {
        gsap.fromTo(day,
            {
                opacity: 0,
                x: index % 2 === 0 ? -50 : 50
            },
            {
                opacity: 1,
                x: 0,
                duration: 0.7,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: day,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                }
            }
        );
    });
}

// Speaker card animations (for dynamically loaded content)
function setupSpeakerAnimations() {
    const speakerCards = document.querySelectorAll('.speaker-card:not(.visible)');

    if (speakerCards.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    speakerCards.forEach(card => observer.observe(card));
}

// Initialize on DOM ready
let scrollAnimations;

document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure all content is loaded
    setTimeout(() => {
        scrollAnimations = new ScrollAnimations();
    }, 200);
});

// Re-run animations for dynamically loaded content
window.refreshScrollAnimations = function () {
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
    }
    setupTimelineDayAnimations();
    setupSpeakerAnimations();
};

// Export for external access
window.ScrollAnimations = ScrollAnimations;
