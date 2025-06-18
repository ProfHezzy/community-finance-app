// static/js/main.js

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
    // Ensure particles.js library is loaded before this runs
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            "particles": {
                "number": {
                    "value": 80,
                    "density": {
                        "enable": true,
                        "value_area": 800
                    }
                },
                "color": {
                    "value": "#ffffff"
                },
                "shape": {
                    "type": "circle",
                    "stroke": {
                        "width": 0,
                        "color": "#000000"
                    },
                    "polygon": {
                        "nb_sides": 5
                    }
                },
                "opacity": {
                    "value": 0.5,
                    "random": false,
                    "anim": {
                        "enable": false,
                        "speed": 1,
                        "opacity_min": 0.1,
                        "sync": false
                    }
                },
                "size": {
                    "value": 3,
                    "random": true,
                    "anim": {
                        "enable": false,
                        "speed": 40,
                        "size_min": 0.1,
                        "sync": false
                    }
                },
                "line_linked": {
                    "enable": true,
                    "distance": 150,
                    "color": "#ffffff",
                    "opacity": 0.4,
                    "width": 1
                },
                "move": {
                    "enable": true,
                    "speed": 3,
                    "direction": "none",
                    "random": false,
                    "straight": false,
                    "out_mode": "out",
                    "bounce": false,
                    "attract": {
                        "enable": false,
                        "rotateX": 600,
                        "rotateY": 1200
                    }
                }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": {
                    "onhover": {
                        "enable": true,
                        "mode": "grab"
                    },
                    "onclick": {
                        "enable": true,
                        "mode": "push"
                    },
                    "resize": true
                },
                "modes": {
                    "grab": {
                        "distance": 140,
                        "line_linked": {
                            "opacity": 1
                        }
                    },
                    "bubble": {
                        "distance": 400,
                        "size": 40,
                        "duration": 2,
                        "opacity": 8,
                        "speed": 3
                    },
                    "repulse": {
                        "distance": 200,
                        "duration": 0.4
                    },
                    "push": {
                        "particles_nb": 4
                    },
                    "remove": {
                        "particles_nb": 2
                    }
                }
            },
            "retina_detect": true
        });
    }

    // ------------------------------------
    // 3. Navbar Sticky Effect & Logo Swap
    // ------------------------------------
    const navbar = document.querySelector('.navbar');
    const logoLight = document.querySelector('.logo-light');
    const logoDark = document.querySelector('.logo-dark');
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileToggleSpans = document.querySelectorAll('.hamburger span');

    const handleScroll = () => {
        if (window.scrollY > 50) { // Adjust scroll threshold as needed
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Call on load to check initial position

    // ------------------------------------
    // 4. Mobile Menu Toggle
    // ------------------------------------
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
        document.body.classList.toggle('no-scroll'); // Optional: prevent scrolling when menu is open
    });

    // Close mobile menu when a nav link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                document.body.classList.remove('no-scroll');
            }
        });
    });

    // ------------------------------------
    // 5. Smooth Scrolling for Anchor Links
    // ------------------------------------
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                const navbarHeight = navbar.offsetHeight; // Get current navbar height
                const offsetPosition = targetElement.offsetTop - navbarHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ------------------------------------
    // 6. Scroll-triggered Animations (Intersection Observer)
    // ------------------------------------
    const animateElements = document.querySelectorAll('[data-animation]');

    const observerOptions = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.2 // Trigger when 20% of the element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const animationClass = `animate__animated animate__${element.dataset.animation}`;
                const animationDelay = element.dataset.delay || '0';

                setTimeout(() => {
                    element.classList.add(animationClass, 'animated');
                }, parseInt(animationDelay));

                observer.unobserve(element); // Stop observing once animated
            }
        });
    }, observerOptions);

    animateElements.forEach(element => {
        observer.observe(element);
    });

    // ------------------------------------
    // 7. Back to Top Button
    // ------------------------------------
    const backToTopButton = document.getElementById('backToTop');

    const toggleBackToTop = () => {
        if (window.scrollY > 300) { // Show button after scrolling 300px
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    };

    window.addEventListener('scroll', toggleBackToTop);
    toggleBackToTop(); // Check on load

    backToTopButton.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // ------------------------------------
    // 8. FAQ Accordion
    // ------------------------------------
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling; // Get the next sibling (the answer div)

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
    // 9. Simple Testimonial Slider (Optional - For more complex sliders, consider libraries like Swiper.js)
    // ------------------------------------
    // If you need a more advanced slider with dots/arrows, consider using a lightweight library
    // For now, it's a simple grid, which looks good with your current structure.
    // If you want actual auto-sliding or navigation, you'd add that logic here.
});