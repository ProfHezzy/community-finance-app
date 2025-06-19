document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------------
    // 1. Preloader
    // ------------------------------------
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        window.addEventListener('load', () => {
            preloader.classList.add('hidden');
            // Remove preloader from DOM after transition
            preloader.addEventListener('transitionend', () => {
                preloader.remove();
            });
        });
    }

    // ------------------------------------
    // 2. Particles.js Initialization
    // ------------------------------------
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            // ... (keep your existing particles.js config)
        });
    }

    // ------------------------------------
    // 3. Feature Cards Animation
    // ------------------------------------
    const featureCards = document.querySelectorAll('.feature-card');
    const animateFeatureCards = () => {
        featureCards.forEach((card, index) => {
            const cardTop = card.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (cardTop < windowHeight - 100) {
                const animation = card.getAttribute('data-animation');
                const delay = card.getAttribute('data-delay') || index * 100;
                
                setTimeout(() => {
                    card.classList.add(animation);
                    card.style.opacity = '1';
                }, delay);
            }
        });
    };

    // Run on load and scroll
    animateFeatureCards();
    window.addEventListener('scroll', animateFeatureCards);

    // ------------------------------------
    // 4. Pricing Cards Animation
    // ------------------------------------
    const pricingCards = document.querySelectorAll('.pricing-card');
    const animatePricingCards = () => {
        pricingCards.forEach((card, index) => {
            const cardTop = card.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (cardTop < windowHeight - 100) {
                const animation = card.getAttribute('data-animation');
                const delay = card.getAttribute('data-delay') || index * 150;
                
                setTimeout(() => {
                    card.classList.add(animation);
                    card.style.opacity = '1';
                }, delay);
            }
        });
    };

    // Run on load and scroll
    animatePricingCards();
    window.addEventListener('scroll', animatePricingCards);

    // ------------------------------------
    // 5. Navbar Sticky Effect & Logo Swap
    // ------------------------------------
    const navbar = document.querySelector('.navbar');
    const handleScroll = () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();

    // ------------------------------------
    // 6. Mobile Menu Toggle
    // ------------------------------------
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
        });
    }

    // ------------------------------------
    // 7. Smooth Scrolling for Anchor Links
    // ------------------------------------
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                const navbarHeight = navbar.offsetHeight;
                const offsetPosition = targetElement.offsetTop - navbarHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ------------------------------------
    // 8. FAQ Accordion
    // ------------------------------------
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            
            // Close other open answers
            faqQuestions.forEach(otherQuestion => {
                if (otherQuestion !== question && otherQuestion.classList.contains('active')) {
                    otherQuestion.classList.remove('active');
                    otherQuestion.nextElementSibling.classList.remove('active');
                }
            });

            // Toggle current answer
            question.classList.toggle('active');
            answer.classList.toggle('active');
        });
    });

    // ------------------------------------
    // 9. Back to Top Button
    // ------------------------------------
    const backToTopButton = document.getElementById('backToTop');
    if (backToTopButton) {
        const toggleBackToTop = () => {
            if (window.scrollY > 300) {
                backToTopButton.classList.add('show');
            } else {
                backToTopButton.classList.remove('show');
            }
        };
        window.addEventListener('scroll', toggleBackToTop);
        toggleBackToTop();

        backToTopButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});