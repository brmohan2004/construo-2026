/**
 * CONSTRUO 2026 - GSAP Animations
 * Scroll-triggered animations and interactions
 */

class ConstruoAnimations {
    constructor() {
        this.init();
    }

    init() {
        // Safe GSAP registration
        if (typeof gsap !== 'undefined') {
            try {
                gsap.registerPlugin(ScrollTrigger);
            } catch (e) {
                console.warn('ScrollTrigger registration failed:', e);
            }
        } else {
            console.error('GSAP not loaded! Animations will be disabled.');
        }

        // Initialize all animations with safety checks
        this.initPreloader();

        if (typeof gsap !== 'undefined') {
            this.initHeroAnimations();
            this.initSectionAnimations();
            this.initCounterAnimations();
            this.initTimelineAnimations();
            this.initSpeakerAnimations();
            this.initEventAnimations();
            this.initOrganizersAnimations();
            this.initFormAnimations();
            this.initParallaxEffects();
        }
    }

    initPreloader() {
        this.dataReady = false;
        // Try LocalStorage first for instant logo
        let s = (window.construoApp && window.construoApp.siteConfig && window.construoApp.siteConfig.settings) || {};
        if (Object.keys(s).length === 0) {
            try {
                const cachedConfig = localStorage.getItem('construo_site_config');
                if (cachedConfig) {
                    const parsed = JSON.parse(cachedConfig);
                    s = parsed.settings || {};
                }
            } catch (e) { }
        }

        this.runCleanPreloader(s);
    }

    markDataLoaded() {
        console.log('Preloader: Data loaded signal received');
        this.dataReady = true;
    }

    updatePreloader(s) {
        if (!s) return;
        const logoUrl = s.loaderLogoUrl || s.logoUrl;
        const logoContainer = document.querySelector('.loader-logo');
        if (logoContainer && logoUrl) {
            const img = logoContainer.querySelector('img');
            if (!img || img.src !== logoUrl) {
                logoContainer.innerHTML = `<img src="${logoUrl}" alt="Logo">`;
            }
        }
    }

    runCleanPreloader(s) {
        const preloader = document.getElementById('preloader');
        if (!preloader) return;

        // 1. Set Logo
        const logoContainer = preloader.querySelector('.loader-logo');
        const logoUrl = s.loaderLogoUrl || s.logoUrl;

        if (logoContainer && logoUrl) {
            // Only update if we have a dynamic logo to replace the default one with
            logoContainer.innerHTML = `<img src="${logoUrl}" alt="Logo">`;
        }

        // 2. Animate Bar to exactly 3 seconds
        const barFill = preloader.querySelector('.loader-bar-fill');
        const loadingDuration = 500; // 0.5 seconds
        const startTime = Date.now();

        // Safety Timeout
        setTimeout(() => {
            if (!this.dataReady) {
                console.warn('Preloader safety timeout reached. Forcing entrance.');
                this.markDataLoaded();
            }
        }, 30000);

        // Clear any existing interval
        if (this.loaderInterval) clearInterval(this.loaderInterval);

        this.loaderInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            let progress = (elapsed / loadingDuration) * 100;

            if (progress >= 100) {
                progress = 100;
                if (this.dataReady) {
                    clearInterval(this.loaderInterval);
                    setTimeout(() => this.hidePreloader(), 400);
                } else {
                    progress = 99; // Hang at 99% until data is ready
                }
            }

            if (barFill) {
                barFill.style.width = `${progress}%`;
            }
        }, 50);
    }

    hidePreloader() {
        const preloader = document.getElementById('preloader');
        if (!preloader) return;

        console.log('Preloader: Hiding...');

        if (typeof gsap !== 'undefined') {
            gsap.to(preloader, {
                opacity: 0,
                duration: 0.6,
                ease: "power2.inOut",
                onComplete: () => {
                    preloader.classList.add('loaded');
                    preloader.style.display = 'none';
                    this.playHeroEntrance();
                }
            });
        } else {
            // Fallback without GSAP
            preloader.style.transition = 'opacity 0.6s ease';
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.classList.add('loaded');
                preloader.style.display = 'none';
            }, 600);
        }
    }


    playHeroEntrance() {
        const tl = gsap.timeline();
        const s = (window.construoApp && window.construoApp.siteConfig && window.construoApp.siteConfig.settings) || {};

        const duration = s.animDuration || 0.8;
        const stagger = s.animStagger || 0.2;
        const ease = s.animEase || 'power3.out';

        tl.from('.hero-badge', {
            y: 30,
            opacity: 0,
            duration: duration,
            ease: ease
        })
            .from('.title-line', {
                y: 100,
                opacity: 0,
                duration: duration + 0.2,
                stagger: stagger,
                ease: ease
            }, '-=0.4')
            .from('.hero-tagline', {
                y: 20,
                opacity: 0,
                duration: duration - 0.2,
                ease: ease
            }, '-=0.4')
            .from('.hero-date > span', {
                y: 20,
                opacity: 0,
                duration: duration - 0.2,
                stagger: stagger / 2,
                ease: ease
            }, '-=0.3')
            .from('.hero-fee', {
                y: 20,
                opacity: 0,
                duration: duration - 0.3,
                ease: ease
            }, '-=0.2')
            .from('.hero-cta .btn', {
                y: 20,
                opacity: 0,
                duration: duration - 0.2,
                stagger: stagger * 0.75,
                ease: ease
            }, '-=0.3')
            .from('.mobile-register-btn', {
                y: 20,
                opacity: 0,
                duration: duration,
                ease: ease
            }, '-=0.2')
            .from('.scroll-indicator', {
                y: 20,
                opacity: 0,
                duration: duration - 0.2,
                ease: ease
            }, '-=0.2');
    }

    playHeroCtaEntrance() {
        gsap.from('.hero-cta .btn', {
            y: 20,
            opacity: 0,
            duration: 0.6,
            stagger: 0.15,
            ease: 'power3.out',
            clearProps: 'all' // Ensure visibility persists after animation
        });
    }

    initHeroAnimations() {
        // Parallax title on scroll
        gsap.to(['.hero-content', '.mobile-register-btn'], {
            scrollTrigger: {
                trigger: '.section-hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1
            },
            y: 200,
            opacity: 0
        });

        // Hide scroll indicator
        gsap.to('.scroll-indicator', {
            scrollTrigger: {
                trigger: '.section-hero',
                start: 'top top',
                end: '+=300',
                scrub: 1
            },
            opacity: 0,
            y: -30
        });
    }

    initSectionAnimations() {
        // Animate section headers
        gsap.utils.toArray('.section-header').forEach(header => {
            gsap.from(header, {
                scrollTrigger: {
                    trigger: header,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                },
                y: 50,
                opacity: 0,
                duration: 0.8,
                ease: 'power3.out'
            });

            // Blueprint line animation
            const line = header.querySelector('.blueprint-line');
            if (line) {
                gsap.from(line, {
                    scrollTrigger: {
                        trigger: header,
                        start: 'top 80%',
                        toggleActions: 'play none none reverse'
                    },
                    width: 0,
                    duration: 1,
                    ease: 'power3.out',
                    delay: 0.3
                });
            }
        });

        // About section
        gsap.from('.about-lead', {
            scrollTrigger: {
                trigger: '.about-content',
                start: 'top 75%',
                toggleActions: 'play none none reverse'
            },
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out'
        });

        gsap.from('.about-text', {
            scrollTrigger: {
                trigger: '.about-content',
                start: 'top 70%',
                toggleActions: 'play none none reverse'
            },
            y: 30,
            opacity: 0,
            duration: 0.8,
            delay: 0.2,
            ease: 'power3.out'
        });

        // Blueprint frame
        gsap.from('.blueprint-frame', {
            scrollTrigger: {
                trigger: '.about-visual',
                start: 'top 75%',
                toggleActions: 'play none none reverse'
            },
            scale: 0.9,
            opacity: 0,
            duration: 1,
            ease: 'power3.out'
        });
    }

    initCounterAnimations() {
        gsap.utils.toArray('.stat-number').forEach(counter => {
            const target = parseInt(counter.getAttribute('data-count'));

            ScrollTrigger.create({
                trigger: counter,
                start: 'top 85%',
                onEnter: () => {
                    gsap.to(counter, {
                        innerText: target,
                        duration: 2,
                        snap: { innerText: 1 },
                        ease: 'power2.out',
                        onUpdate: function () {
                            counter.innerText = Math.round(counter.innerText);
                            if (target >= 1000) {
                                counter.innerText = counter.innerText.toLocaleString();
                            }
                        }
                    });
                },
                once: true
            });
        });

        // Stat items stagger animation
        gsap.from('.stat-item', {
            scrollTrigger: {
                trigger: '.about-stats',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            y: 30,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power3.out'
        });
    }

    initTimelineAnimations() {
        // Animate timeline days
        gsap.utils.toArray('.timeline-day').forEach((day, index) => {
            ScrollTrigger.create({
                trigger: day,
                start: 'top 75%',
                onEnter: () => day.classList.add('visible'),
                onLeaveBack: () => day.classList.remove('visible')
            });
        });

        // Crane animation along scroll
        const crane = document.getElementById('timeline-crane');
        if (crane) {
            gsap.to(crane, {
                scrollTrigger: {
                    trigger: '.section-timeline',
                    start: 'top center',
                    end: 'bottom center',
                    scrub: 1
                },
                y: () => document.querySelector('.timeline-days').offsetHeight - 100,
                ease: 'none'
            });
        }

        // Event blocks hover animation setup
        gsap.utils.toArray('.event-block').forEach(block => {
            block.addEventListener('mouseenter', () => {
                gsap.to(block, {
                    x: 10,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            block.addEventListener('mouseleave', () => {
                gsap.to(block, {
                    x: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });
        });
    }

    initSpeakerAnimations() {
        // Kill existing speaker ScrollTriggers to avoid duplicates
        ScrollTrigger.getAll().forEach(trigger => {
            if (trigger.vars && trigger.vars.trigger && trigger.vars.trigger.classList &&
                trigger.vars.trigger.classList.contains('speaker-card')) {
                trigger.kill();
            }
        });

        gsap.utils.toArray('.speaker-card').forEach((card, index) => {
            ScrollTrigger.create({
                trigger: card,
                start: 'top 80%',
                onEnter: () => {
                    gsap.to(card, {
                        opacity: 1,
                        y: 0,
                        duration: 0.8,
                        delay: index * 0.1,
                        ease: 'power3.out'
                    });
                }
            });

            // Set initial state
            gsap.set(card, { opacity: 0, y: 50 });
        });

        // 3D tilt effect on hover
        gsap.utils.toArray('.speaker-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (y - centerY) / 10;
                const rotateY = (centerX - x) / 10;

                gsap.to(card.querySelector('.speaker-image'), {
                    rotateX: rotateX,
                    rotateY: rotateY,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card.querySelector('.speaker-image'), {
                    rotateX: 0,
                    rotateY: 0,
                    duration: 0.5,
                    ease: 'power2.out'
                });
            });
        });
    }

    initEventAnimations() {
        // Kill existing event ScrollTriggers to avoid duplicates
        ScrollTrigger.getAll().forEach(trigger => {
            if (trigger.vars && trigger.vars.trigger) {
                const tr = trigger.vars.trigger;
                if ((tr.classList && tr.classList.contains('event-card')) || tr === '.prize-banner' || tr === '.prize-amount') {
                    trigger.kill();
                }
            }
        });

        // Event cards staggered animation
        gsap.utils.toArray('.event-card').forEach((card, index) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                y: 60,
                opacity: 0,
                duration: 0.8,
                delay: (index % 3) * 0.15, // Stagger based on column position
                ease: 'power3.out'
            });
        });

        // Event card hover 3D tilt effect
        gsap.utils.toArray('.event-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;

                gsap.to(card, {
                    rotateX: -rotateX,
                    rotateY: rotateY,
                    duration: 0.4,
                    ease: 'power2.out',
                    transformPerspective: 1000
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    rotateX: 0,
                    rotateY: 0,
                    duration: 0.6,
                    ease: 'power2.out'
                });
            });
        });

        // Prize banner animation
        gsap.from('.prize-banner', {
            scrollTrigger: {
                trigger: '.prize-banner',
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            y: 50,
            opacity: 0,
            scale: 0.95,
            duration: 1,
            ease: 'power3.out'
        });

        // Prize amount counter animation
        const prizeAmount = document.querySelector('.prize-amount');
        if (prizeAmount) {
            ScrollTrigger.create({
                trigger: '.prize-banner',
                start: 'top 80%',
                onEnter: () => {
                    gsap.from('.prize-amount', {
                        scale: 0.5,
                        opacity: 0,
                        duration: 0.8,
                        ease: 'back.out(1.7)'
                    });
                },
                once: true
            });
        }
    }

    initOrganizersAnimations() {
        // Kill existing organizer ScrollTriggers to avoid duplicates
        ScrollTrigger.getAll().forEach(trigger => {
            if (trigger.vars && trigger.vars.trigger) {
                const tr = trigger.vars.trigger;
                if (tr.classList && tr.classList.contains('organizer-card')) {
                    trigger.kill();
                }
            }
        });

        gsap.utils.toArray('.organizer-card').forEach((card, index) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%'
                },
                y: 40,
                opacity: 0,
                duration: 0.8,
                delay: index * 0.08,
                ease: 'power3.out'
            });
        });
    }

    initFormAnimations() {
        // Form wrapper entrance
        gsap.from('.register-form-wrapper', {
            scrollTrigger: {
                trigger: '.register-wrapper',
                start: 'top 70%',
                toggleActions: 'play none none reverse'
            },
            x: 50,
            opacity: 0,
            duration: 1,
            ease: 'power3.out'
        });

        // Pricing cards
        gsap.from('.pricing-card', {
            scrollTrigger: {
                trigger: '.pricing-cards',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            y: 30,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power3.out'
        });

        // Form fields
        gsap.from('.form-group', {
            scrollTrigger: {
                trigger: '.form-fields',
                start: 'top 75%',
                toggleActions: 'play none none reverse'
            },
            y: 20,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power3.out'
        });
    }

    initParallaxEffects() {
        // Venue section parallax
        gsap.to('.venue-3d', {
            scrollTrigger: {
                trigger: '.section-venue',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1
            },
            y: -50,
            ease: 'none'
        });



        // Footer skyline parallax
        gsap.from('.footer-skyline', {
            scrollTrigger: {
                trigger: '.section-footer',
                start: 'top bottom',
                end: 'top center',
                scrub: 1
            },
            opacity: 0,
            y: 50
        });
    }
}

// Initialize animations when DOM is ready
let construoAnimations;

document.addEventListener('DOMContentLoaded', () => {
    construoAnimations = new ConstruoAnimations();
    // Expose to window for dynamic re-initialization
    window.construoAnimations = construoAnimations;
});
