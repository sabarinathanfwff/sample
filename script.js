// ============================================
// Dynamic Website JavaScript
// ============================================

// ============================================
// Data
// ============================================
const skillsData = [
    {
        icon: '&#60;&#47;&#62;',
        name: 'Frontend Development',
        description: 'Building responsive and interactive user interfaces with modern frameworks.',
        progress: 95
    },
    {
        icon: '&#128012;',
        name: 'Backend Development',
        description: 'Creating robust server-side applications and APIs with scalable architecture.',
        progress: 88
    },
    {
        icon: '&#128202;',
        name: 'Data Analysis',
        description: 'Transforming raw data into meaningful insights using advanced analytics tools.',
        progress: 82
    },
    {
        icon: '&#128241;',
        name: 'Mobile Development',
        description: 'Developing cross-platform mobile applications with native-like performance.',
        progress: 78
    },
    {
        icon: '&#127912;',
        name: 'UI/UX Design',
        description: 'Designing intuitive and visually appealing user experiences.',
        progress: 85
    },
    {
        icon: '&#128187;',
        name: 'DevOps & Cloud',
        description: 'Managing infrastructure and deployments on cloud platforms.',
        progress: 75
    }
];

const projectsData = [
    {
        title: 'E-Commerce Platform',
        description: 'A full-featured online store with real-time inventory management and secure payments.',
        tags: ['web'],
        icon: '&#128722;',
        technologies: ['React', 'Node.js', 'MongoDB', 'Stripe']
    },
    {
        title: 'Fitness Tracker App',
        description: 'Mobile app for tracking workouts, nutrition, and health metrics with social features.',
        tags: ['mobile', 'web'],
        icon: '&#127939;',
        technologies: ['React Native', 'Firebase', 'Redux']
    },
    {
        title: 'Analytics Dashboard',
        description: 'Real-time business intelligence dashboard with interactive charts and reports.',
        tags: ['web', 'design'],
        icon: '&#128200;',
        technologies: ['Vue.js', 'D3.js', 'Python', 'PostgreSQL']
    },
    {
        title: 'Social Media Manager',
        description: 'All-in-one platform for managing multiple social media accounts and scheduling posts.',
        tags: ['web'],
        icon: '&#128172;',
        technologies: ['Next.js', 'Prisma', 'Redis', 'AWS']
    },
    {
        title: 'AI Chat Application',
        description: 'Intelligent chatbot with natural language processing and multi-language support.',
        tags: ['web', 'mobile'],
        icon: '&#129302;',
        technologies: ['Python', 'TensorFlow', 'FastAPI', 'React']
    },
    {
        title: 'Portfolio Generator',
        description: 'Dynamic portfolio builder with customizable templates and themes.',
        tags: ['web', 'design'],
        icon: '&#128188;',
        technologies: ['TypeScript', 'Astro', 'Tailwind CSS']
    }
];

// ============================================
// DOM Elements
// ============================================
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const themeToggle = document.getElementById('themeToggle');
const skillsGrid = document.getElementById('skillsGrid');
const projectsGrid = document.getElementById('projectsGrid');
const projectFilters = document.getElementById('projectFilters');
const contactForm = document.getElementById('contactForm');
const typedName = document.getElementById('typedName');
const typedRole = document.getElementById('typedRole');

// ============================================
// Theme Management
// ============================================
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.innerHTML = theme === 'dark' ? '&#9728;' : '&#9790;';
}

// ============================================
// Navigation
// ============================================
function initNavigation() {
    // Mobile toggle
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Update active nav link
        updateActiveNavLink();
    });
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let currentSection = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.scrollY >= sectionTop) {
            currentSection = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

// ============================================
// Typing Effect
// ============================================
function typeText(element, text, speed = 100) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

function initTypingEffect() {
    const roles = [
        'I build dynamic web experiences',
        'I create stunning interfaces',
        'I develop scalable applications',
        'I design intuitive systems'
    ];
    let roleIndex = 0;

    typeText(typedName, 'John Doe', 100);
    
    setTimeout(() => {
        setInterval(() => {
            roleIndex = (roleIndex + 1) % roles.length;
            typeText(typedRole, roles[roleIndex], 50);
        }, 3000);
    }, 1500);
}

// ============================================
// Skills Rendering
// ============================================
function renderSkills() {
    skillsGrid.innerHTML = skillsData.map((skill, index) => `
        <div class="skill-card" style="animation-delay: ${index * 0.1}s">
            <div class="skill-icon">${skill.icon}</div>
            <h3 class="skill-name">${skill.name}</h3>
            <p class="skill-description">${skill.description}</p>
            <div class="skill-progress">
                <div class="skill-progress-bar" data-progress="${skill.progress}"></div>
            </div>
        </div>
    `).join('');
}

function animateSkillBars() {
    const skillBars = document.querySelectorAll('.skill-progress-bar');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                const progress = bar.getAttribute('data-progress');
                setTimeout(() => {
                    bar.style.width = `${progress}%`;
                }, 200);
                observer.unobserve(bar);
            }
        });
    }, { threshold: 0.5 });

    skillBars.forEach(bar => observer.observe(bar));
}

// ============================================
// Projects Rendering
// ============================================
function renderProjects(filter = 'all') {
    const filteredProjects = filter === 'all' 
        ? projectsData 
        : projectsData.filter(project => project.tags.includes(filter));

    projectsGrid.innerHTML = filteredProjects.map((project, index) => `
        <div class="project-card" style="animation: fadeInUp 0.5s ease-out ${index * 0.1}s forwards; opacity: 0;">
            <div class="project-image">
                <span class="project-image-icon">${project.icon}</span>
            </div>
            <div class="project-content">
                <div class="project-tags">
                    ${project.technologies.map(tech => `<span class="project-tag">${tech}</span>`).join('')}
                </div>
                <h3 class="project-title">${project.title}</h3>
                <p class="project-description">${project.description}</p>
                <div class="project-links">
                    <a href="#" class="project-link">&#128279; View Project</a>
                    <a href="#" class="project-link">&#128394; Source Code</a>
                </div>
            </div>
        </div>
    `).join('');
}

function initProjectFilters() {
    const filterButtons = projectFilters.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderProjects(button.getAttribute('data-filter'));
        });
    });
}

// ============================================
// Contact Form
// ============================================
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}Error`);
    field.classList.add('error');
    errorElement.textContent = message;
}

function clearError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}Error`);
    field.classList.remove('error');
    errorElement.textContent = '';
}

function validateForm() {
    let isValid = true;
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();

    // Reset all errors
    ['name', 'email', 'subject', 'message'].forEach(clearError);

    if (!name) {
        showError('name', 'Name is required');
        isValid = false;
    } else if (name.length < 2) {
        showError('name', 'Name must be at least 2 characters');
        isValid = false;
    }

    if (!email) {
        showError('email', 'Email is required');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError('email', 'Please enter a valid email address');
        isValid = false;
    }

    if (!subject) {
        showError('subject', 'Subject is required');
        isValid = false;
    }

    if (!message) {
        showError('message', 'Message is required');
        isValid = false;
    } else if (message.length < 10) {
        showError('message', 'Message must be at least 10 characters');
        isValid = false;
    }

    return isValid;
}

function initContactForm() {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const submitBtn = contactForm.querySelector('.btn-submit');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');

        btnText.style.display = 'none';
        btnLoader.style.display = 'inline';
        submitBtn.disabled = true;

        // Simulate form submission
        setTimeout(() => {
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
            submitBtn.disabled = false;
            
            document.getElementById('formSuccess').style.display = 'flex';
            contactForm.reset();

            setTimeout(() => {
                document.getElementById('formSuccess').style.display = 'none';
            }, 5000);
        }, 2000);
    });

    // Real-time validation
    ['name', 'email', 'subject', 'message'].forEach(fieldId => {
        const field = document.getElementById(fieldId);
        field.addEventListener('input', () => {
            clearError(fieldId);
        });
    });
}

// ============================================
// Scroll Animations
// ============================================
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.section-header, .stat-card, .skill-card, .project-card, .info-card').forEach(el => {
        observer.observe(el);
    });
}

// ============================================
// Counter Animation
// ============================================
function initCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target'));
                animateCounter(counter, target);
                observer.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 50;
    const duration = 2000;
    const stepTime = duration / 50;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current) + '+';
    }, stepTime);
}

// ============================================
// Smooth Scroll
// ============================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================================
// Parallax Effect for Hero Shapes
// ============================================
function initParallax() {
    const shapes = document.querySelectorAll('.shape');
    
    window.addEventListener('mousemove', (e) => {
        const x = (window.innerWidth / 2 - e.pageX) / 50;
        const y = (window.innerHeight / 2 - e.pageY) / 50;

        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.5;
            shape.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
        });
    });
}

// ============================================
// Initialize Everything
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initTypingEffect();
    renderSkills();
    animateSkillBars();
    renderProjects();
    initProjectFilters();
    initContactForm();
    initScrollAnimations();
    initCounters();
    initSmoothScroll();
    initParallax();
    
    themeToggle.addEventListener('click', toggleTheme);
});

// ============================================
// Service Worker Registration (for PWA capabilities)
// ============================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker can be added here for offline support
        console.log('Dynamic website ready!');
    });
}
