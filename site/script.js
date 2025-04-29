// Adicionar imagens dos cursos do site original
document.addEventListener('DOMContentLoaded', function() {
    // Carousel functionality
    const screenItems = document.querySelectorAll('.screen-item');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    let currentIndex = 0;

    function showSlide(index) {
        // Hide all slides
        screenItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // Remove active class from all dots
        dots.forEach(dot => {
            dot.classList.remove('active');
        });
        
        // Show the current slide and activate the corresponding dot
        screenItems[index].classList.add('active');
        dots[index].classList.add('active');
        currentIndex = index;
    }

    // Event listeners for dots
    dots.forEach(dot => {
        dot.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            showSlide(index);
        });
    });

    // Event listeners for prev/next buttons
    prevBtn.addEventListener('click', function() {
        let newIndex = currentIndex - 1;
        if (newIndex < 0) {
            newIndex = screenItems.length - 1;
        }
        showSlide(newIndex);
    });

    nextBtn.addEventListener('click', function() {
        let newIndex = currentIndex + 1;
        if (newIndex >= screenItems.length) {
            newIndex = 0;
        }
        showSlide(newIndex);
    });

    // Auto-advance carousel every 5 seconds
    setInterval(function() {
        let newIndex = currentIndex + 1;
        if (newIndex >= screenItems.length) {
            newIndex = 0;
        }
        showSlide(newIndex);
    }, 5000);

    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('header a, .hero-buttons a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Header scroll effect
    const header = document.querySelector('.main-header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.style.padding = '10px 0';
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.padding = '15px 0';
            header.style.boxShadow = 'none';
        }
    });

    // Mobile menu toggle (for smaller screens)
    const createMobileMenu = () => {
        if (window.innerWidth <= 768) {
            const nav = document.querySelector('.main-nav');
            const navUl = nav.querySelector('ul');
            
            // Create mobile menu button if it doesn't exist
            if (!document.querySelector('.mobile-menu-btn')) {
                const menuBtn = document.createElement('button');
                menuBtn.classList.add('mobile-menu-btn');
                menuBtn.innerHTML = '☰';
                menuBtn.style.background = 'none';
                menuBtn.style.border = 'none';
                menuBtn.style.color = '#23364e';
                menuBtn.style.fontSize = '24px';
                menuBtn.style.cursor = 'pointer';
                
                nav.parentNode.insertBefore(menuBtn, nav);
                
                // Hide nav by default on mobile
                navUl.style.display = 'none';
                navUl.style.flexDirection = 'column';
                navUl.style.width = '100%';
                navUl.style.textAlign = 'center';
                
                // Toggle menu on click
                menuBtn.addEventListener('click', function() {
                    if (navUl.style.display === 'none') {
                        navUl.style.display = 'flex';
                    } else {
                        navUl.style.display = 'none';
                    }
                });
            }
        }
    };
    
    // Call on load
    createMobileMenu();
    
    // Call on resize
    window.addEventListener('resize', createMobileMenu);

    // Atualizar imagens dos cursos com as imagens do site original
    const updateCourseImages = () => {
        // Verificar se os elementos existem antes de tentar atualizar
        const courseCards = document.querySelectorAll('.course-card');
        if (courseCards.length >= 4) {
            // Adicionar as novas imagens de cursos
            const courseImages = [
                'images/curso_familia_divorcio.png',
                'images/curso_poder_pais.png',
                'images/curso_cuidados_bebe.png'
            ];
            
            // Atualizar as últimas 3 cards de cursos com as novas imagens
            for (let i = 0; i < Math.min(3, courseImages.length); i++) {
                if (courseCards[i + 1]) {
                    const courseImage = courseCards[i + 1].querySelector('.course-image');
                    if (courseImage) {
                        courseImage.style.backgroundImage = `url('${courseImages[i]}')`;
                    }
                }
            }
        }
    };
    
    // Chamar a função para atualizar as imagens dos cursos
    updateCourseImages();
});
