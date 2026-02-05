/**
 * CONSTRUO 2026 - GSAP Animations
 * Scroll-triggered animations and interactions
 */

class ConstruoAnimations {
    constructor() {
        this.init();
    }

    init() {
        // Register GSAP plugins
        gsap.registerPlugin(ScrollTrigger);

        // Initialize all animations
        this.initPreloader();
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

    initPreloader() {
        const preloader = document.getElementById('preloader');
        const progress = document.querySelector('.loader-progress');
        const loaderText = document.querySelector('.loader-text');

        // Settings from Supabase if available
        const s = (window.construoApp && window.construoApp.siteConfig && window.construoApp.siteConfig.settings) || {};

        if (loaderText && s.loaderText) {
            loaderText.innerHTML = `${s.loaderText}<span class="dots">...</span>`;
        }

        if (progress && s.loaderColor) {
            progress.style.background = s.loaderColor;
        }

        const speed = s.loaderSpeed || 100;

        // Simulate loading progress
        let loadProgress = 0;
        const loadInterval = setInterval(() => {
            loadProgress += Math.random() * 15;
            if (loadProgress >= 100) {
                loadProgress = 100;
                clearInterval(loadInterval);

                // Hide preloader
                setTimeout(() => {
                    gsap.to(preloader, {
                        opacity: 0,
                        duration: 0.5,
                        onComplete: () => {
                            preloader.classList.add('loaded');
                            this.playHeroEntrance();
                        }
                    });
                }, 500);
            }
            if (progress) progress.style.width = `${loadProgress}%`;
        }, speed);
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
        gsap.to('.hero-content', {
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

        // Sponsors billboard parallax
        gsap.utils.toArray('.sponsor-billboard').forEach((billboard, index) => {
            gsap.to(billboard, {
                scrollTrigger: {
                    trigger: billboard,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1
                },
                y: (index % 2 === 0) ? -30 : 30,
                ease: 'none'
            });
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
