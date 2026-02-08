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
    // Switch to products page if not already there
    showPage('products');
    
    const products = document.querySelectorAll('.product-card');
    
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
    
    // Filter products with animation
    products.forEach(product => {
        const productCategory = product.getAttribute('data-category');
        
        if (category === 'all' || productCategory === category) {
            product.style.display = 'block';
            setTimeout(() => {
                product.style.opacity = '1';
                product.style.transform = 'translateY(0)';
            }, 10);
        } else {
            product.style.opacity = '0';
            product.style.transform = 'translateY(20px)';
            setTimeout(() => {
                product.style.display = 'none';
            }, 300);
        }
    });
    
    // Close sidebar on mobile
    if (window.innerWidth <= 1024) {
        toggleSidebar();
    }
}

// Search Functionality
const searchInput = document.querySelector('.search-box input');
if (searchInput) {
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
});

// Smooth Scroll for All Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        
        // Don't prevent default for Discord link placeholder
        if (href === '#DISCORD_LINK') {
            return;
        }
        
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
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
    showPage('home');
    
    // Make sure all products are visible on page load
    const products = document.querySelectorAll('.product-card');
    products.forEach(product => {
        product.style.display = 'block';
    });
});