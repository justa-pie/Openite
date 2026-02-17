// Close Welcome Popup
function closeWelcome() {
    const overlay = document.getElementById('welcomeOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        // Remove from DOM after animation
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 500);
        
        // Start music when entering the store
        const bgMusic = document.getElementById('bgMusic');
        if (bgMusic && bgMusic.paused) {
            bgMusic.play().catch(error => {
                console.log('Music autoplay blocked:', error);
            });
        }
    }
}

// Toggle Search Box on Mobile
function toggleSearch() {
    const searchBox = document.getElementById('searchBox');
    const searchToggle = document.getElementById('searchToggle');
    const volumeControl = document.getElementById('volumeControl');
    const volumeToggle = document.getElementById('volumeToggle');
    
    if (searchBox && searchToggle) {
        searchBox.classList.toggle('active');
        searchToggle.classList.toggle('active');
        
        // Close volume if open
        if (volumeControl && volumeControl.classList.contains('active')) {
            volumeControl.classList.remove('active');
            volumeToggle.classList.remove('active');
        }
        
        // Focus on input when opened
        if (searchBox.classList.contains('active')) {
            setTimeout(() => {
                const input = searchBox.querySelector('input');
                if (input) input.focus();
            }, 100);
        }
    }
}

// Toggle Volume Control on Mobile
function toggleVolume() {
    const volumeControl = document.getElementById('volumeControl');
    const volumeToggle = document.getElementById('volumeToggle');
    const searchBox = document.getElementById('searchBox');
    const searchToggle = document.getElementById('searchToggle');
    
    if (volumeControl && volumeToggle) {
        volumeControl.classList.toggle('active');
        volumeToggle.classList.toggle('active');
        
        // Close search if open
        if (searchBox && searchBox.classList.contains('active')) {
            searchBox.classList.remove('active');
            searchToggle.classList.remove('active');
        }
    }
}

// Toggle Sidebar on Mobile
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

// Show Page Function
function showPage(pageName) {
    // Hide all pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => page.classList.remove('active'));
    
    // Show selected page
    const selectedPage = document.getElementById(pageName + '-page');
    if (selectedPage) {
        selectedPage.classList.add('active');
    }
    
    // Update active category in sidebar
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => item.classList.remove('active'));
    
    // Set active for the corresponding sidebar item
    if (pageName === 'home') {
        const homeItem = document.querySelector('.category-item[onclick*="showPage(\'home\')"]');
        if (homeItem) {
            homeItem.classList.add('active');
        }
    } else if (pageName === 'purchase') {
        const purchaseItem = document.querySelector('.category-item[onclick*="showPage(\'purchase\')"]');
        if (purchaseItem) {
            purchaseItem.classList.add('active');
        }
    }
    
    // Close sidebar on mobile
    if (window.innerWidth <= 1024) {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('active');
    }
    
    // Scroll to top when switching pages
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Filter Products by Category
function filterProducts(category) {
    console.log('Filtering by category:', category);
    
    // Switch to products page to show filtered results
    showPage('products');
    
    // Scroll to top immediately
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    const products = document.querySelectorAll('.product-card');
    const dividers = document.querySelectorAll('.product-divider');
    
    // Update active sidebar item
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => item.classList.remove('active'));
    
    // Find and activate the correct sidebar item
    const activeItem = Array.from(categoryItems).find(item => {
        const onclick = item.getAttribute('onclick');
        return onclick && onclick.includes(`filterProducts('${category}')`);
    });
    
    if (activeItem) {
        activeItem.classList.add('active');
    }
    
    // Simple and clear filtering - no fancy animations
    products.forEach(product => {
        const productCategory = product.getAttribute('data-category');
        
        if (category === 'all' || productCategory === category) {
            product.style.display = 'flex';
            product.style.opacity = '1';
            product.style.transform = 'translateY(0)';
        } else {
            product.style.display = 'none';
        }
    });
    
    dividers.forEach(divider => {
        const dividerCategory = divider.getAttribute('data-category');
        
        if (category === 'all' || dividerCategory === category) {
            divider.style.display = 'flex';
            divider.style.opacity = '1';
        } else {
            divider.style.display = 'none';
        }
    });
    
    // Close sidebar on mobile
    if (window.innerWidth <= 1024) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('active');
        }
    }
}

// Search Functionality
function initSearch() {
    const searchInput = document.querySelector('.search-box input');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const products = document.querySelectorAll('.product-card');
        
        // Switch to products page when searching
        if (searchTerm.length > 0) {
            showPage('products');
            
            // Deactivate all sidebar items when searching
            const categoryItems = document.querySelectorAll('.category-item');
            categoryItems.forEach(item => item.classList.remove('active'));
        }
        
        products.forEach(product => {
            const productName = product.querySelector('.product-name').textContent.toLowerCase();
            const productDesc = product.querySelector('.product-description').textContent.toLowerCase();
            const productCategory = product.querySelector('.product-category').textContent.toLowerCase();
            
            if (productName.includes(searchTerm) || 
                productDesc.includes(searchTerm) || 
                productCategory.includes(searchTerm)) {
                product.style.display = 'block';
                product.style.opacity = '1';
                product.style.transform = 'translateY(0)';
            } else {
                product.style.opacity = '0';
                product.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    product.style.display = 'none';
                }, 300);
            }
        });
        
        // If search is cleared, show all products
        if (searchTerm.length === 0) {
            products.forEach(product => {
                product.style.display = 'block';
                product.style.opacity = '1';
                product.style.transform = 'translateY(0)';
            });
        }
    });
}

// Close Sidebar When Clicking Outside on Mobile
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    
    if (window.innerWidth <= 1024 && 
        sidebar.classList.contains('active') && 
        !sidebar.contains(e.target) && 
        !menuBtn.contains(e.target)) {
        sidebar.classList.remove('active');
    }
    
    // Close search/volume when clicking outside
    if (window.innerWidth <= 768) {
        const searchBox = document.getElementById('searchBox');
        const searchToggle = document.getElementById('searchToggle');
        const volumeControl = document.getElementById('volumeControl');
        const volumeToggle = document.getElementById('volumeToggle');
        
        // Close search if clicking outside
        if (searchBox && searchBox.classList.contains('active') &&
            !searchBox.contains(e.target) && 
            !searchToggle.contains(e.target)) {
            searchBox.classList.remove('active');
            searchToggle.classList.remove('active');
        }
        
        // Close volume if clicking outside
        if (volumeControl && volumeControl.classList.contains('active') &&
            !volumeControl.contains(e.target) && 
            !volumeToggle.contains(e.target)) {
            volumeControl.classList.remove('active');
            volumeToggle.classList.remove('active');
        }
    }
});

// Smooth Scroll for All Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        
        // Don't prevent default for Discord link placeholder or empty hash
        if (href === '#DISCORD_LINK' || href === '#' || !href || href.length <= 1) {
            return;
        }
        
        e.preventDefault();
        try {
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        } catch (err) {
            console.warn('Invalid selector:', href);
        }
    });
});

// Animation on Scroll for Product Cards
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all product cards
document.querySelectorAll('.product-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'all 0.6s ease';
    observer.observe(card);
});

// Observe feature cards
document.querySelectorAll('.feature-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'all 0.6s ease';
    observer.observe(card);
});

// Observe testimonial cards
document.querySelectorAll('.testimonial-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'all 0.6s ease';
    observer.observe(card);
});

// Observe stat cards
document.querySelectorAll('.stat-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'all 0.6s ease';
    observer.observe(card);
});

// Handle window resize
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Close sidebar on desktop size
        if (window.innerWidth > 1024) {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.remove('active');
        }
    }, 250);
});

// Initialize - Show home page by default
document.addEventListener('DOMContentLoaded', () => {
    // Initialize search functionality
    initSearch();
    
    showPage('home');
    
    // Make sure all products are visible on page load
    const products = document.querySelectorAll('.product-card');
    products.forEach(product => {
        product.style.display = 'block';
    });

    // Background Music Control with Volume Slider
    const bgMusic = document.getElementById('bgMusic');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    const volumeIcon = document.getElementById('volumeIcon');
    
    if (bgMusic && volumeSlider && volumeValue && volumeIcon) {
        // Set initial volume
        bgMusic.volume = volumeSlider.value / 100;
        let musicStarted = false;

        // Function to start music
        const startMusic = () => {
            if (!musicStarted) {
                bgMusic.play().then(() => {
                    console.log('🎵 Music started!');
                    musicStarted = true;
                }).catch(error => {
                    console.log('Waiting for user interaction...', error);
                });
            }
        };

        // Try to play immediately
        startMusic();

        // Start music on ANY user interaction
        const interactions = ['click', 'touchstart', 'keydown', 'mousemove', 'scroll'];
        const startOnInteraction = () => {
            if (!musicStarted) {
                startMusic();
                // Remove all listeners after music starts
                interactions.forEach(event => {
                    document.removeEventListener(event, startOnInteraction);
                });
            }
        };

        // Add listeners for all interaction types
        interactions.forEach(event => {
            document.addEventListener(event, startOnInteraction, { once: true });
        });

        // Volume slider control
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value;
            bgMusic.volume = volume / 100;
            volumeValue.textContent = volume + '%';
            
            // Update both icons based on volume
            const iconClass = volume == 0 ? 'fas fa-volume-mute' : 
                            volume < 50 ? 'fas fa-volume-down' : 'fas fa-volume-up';
            
            volumeIcon.className = iconClass;
            
            // Also update mobile toggle icon
            const volumeIconMobile = document.getElementById('volumeIconMobile');
            if (volumeIconMobile) {
                volumeIconMobile.className = iconClass;
            }
        });

        // Click icon to toggle mute/unmute
        volumeIcon.addEventListener('click', () => {
            const volumeIconMobile = document.getElementById('volumeIconMobile');
            
            if (bgMusic.volume > 0) {
                // Mute
                volumeIcon.dataset.previousVolume = volumeSlider.value;
                volumeSlider.value = 0;
                bgMusic.volume = 0;
                volumeValue.textContent = '0%';
                volumeIcon.className = 'fas fa-volume-mute';
                if (volumeIconMobile) volumeIconMobile.className = 'fas fa-volume-mute';
            } else {
                // Unmute to previous volume
                const previousVolume = volumeIcon.dataset.previousVolume || 30;
                volumeSlider.value = previousVolume;
                bgMusic.volume = previousVolume / 100;
                volumeValue.textContent = previousVolume + '%';
                
                const iconClass = previousVolume < 50 ? 'fas fa-volume-down' : 'fas fa-volume-up';
                volumeIcon.className = iconClass;
                if (volumeIconMobile) volumeIconMobile.className = iconClass;
            }
        });
    }
});
// Product Detail Modal Functions
function showProductDetail(card) {
    const modal = document.getElementById('productModal');
    if (!modal) return;
    
    const image = card.querySelector('.product-image img');
    const name = card.querySelector('.product-name');
    const description = card.querySelector('.product-description');
    const price = card.querySelector('.product-price');
    const stockBadge = card.querySelector('.stock-badge');
    
    if (image) document.getElementById('modalProductImage').src = image.src;
    if (name) document.getElementById('modalProductName').textContent = name.textContent;
    if (description) document.getElementById('modalProductDescription').textContent = description.textContent;
    if (price) document.getElementById('modalProductPrice').textContent = price.textContent;
    
    const modalStockBadge = document.getElementById('modalStockBadge');
    if (stockBadge && modalStockBadge) {
        modalStockBadge.textContent = stockBadge.textContent;
        modalStockBadge.className = stockBadge.className;
        modalStockBadge.style.display = 'block';
    } else if (modalStockBadge) {
        modalStockBadge.style.display = 'none';
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeProductModal();
    }
});