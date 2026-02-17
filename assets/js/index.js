// ─── Close Welcome Popup ────────────────────────────────────────────
function closeWelcome() {
    const overlay = document.getElementById('welcomeOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        setTimeout(() => { overlay.style.display = 'none'; }, 500);
        const bgMusic = document.getElementById('bgMusic');
        if (bgMusic && bgMusic.paused) bgMusic.play().catch(() => {});
    }
}

// ─── Toggle Search Box ───────────────────────────────────────────────
function toggleSearch() {
    const searchBox     = document.getElementById('searchBox');
    const searchToggle  = document.getElementById('searchToggle');
    const volumeControl = document.getElementById('volumeControl');
    const volumeToggle  = document.getElementById('volumeToggle');
    if (!searchBox || !searchToggle) return;
    searchBox.classList.toggle('active');
    searchToggle.classList.toggle('active');
    if (volumeControl && volumeControl.classList.contains('active')) {
        volumeControl.classList.remove('active');
        if (volumeToggle) volumeToggle.classList.remove('active');
    }
    if (searchBox.classList.contains('active')) {
        setTimeout(() => { const i = searchBox.querySelector('input'); if (i) i.focus(); }, 150);
    }
}

// ─── Toggle Volume Panel (mobile) ───────────────────────────────────
function toggleVolume() {
    const volumeControl = document.getElementById('volumeControl');
    const volumeToggle  = document.getElementById('volumeToggle');
    const searchBox     = document.getElementById('searchBox');
    const searchToggle  = document.getElementById('searchToggle');
    if (!volumeControl || !volumeToggle) return;
    volumeControl.classList.toggle('active');
    volumeToggle.classList.toggle('active');
    if (searchBox && searchBox.classList.contains('active')) {
        searchBox.classList.remove('active');
        if (searchToggle) searchToggle.classList.remove('active');
    }
}

// ─── Toggle Sidebar ──────────────────────────────────────────────────
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
}

// ─── Show Page ───────────────────────────────────────────────────────
function showPage(pageName) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    const selected = document.getElementById(pageName + '-page');
    if (selected) selected.classList.add('active');

    document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
    if (pageName === 'home') {
        const el = document.querySelector('.category-item[onclick*="showPage(\'home\')"]');
        if (el) el.classList.add('active');
    } else if (pageName === 'purchase') {
        const el = document.querySelector('.category-item[onclick*="showPage(\'purchase\')"]');
        if (el) el.classList.add('active');
    }

    if (window.innerWidth <= 1024) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('active');
    }

    // FIX 1: scroll to top cho TẤT CẢ page transitions (kể cả khi filter)
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Filter Products ─────────────────────────────────────────────────
function filterProducts(category) {
    // showPage đã scroll to top rồi, không cần scroll thêm
    showPage('products');

    document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
    const activeItem = Array.from(document.querySelectorAll('.category-item')).find(item => {
        const oc = item.getAttribute('onclick');
        return oc && oc.includes("filterProducts('" + category + "')");
    });
    if (activeItem) activeItem.classList.add('active');

    document.querySelectorAll('.product-card').forEach(product => {
        const cat = product.getAttribute('data-category');
        if (category === 'all' || cat === category) {
            product.style.display = 'flex';
            product.style.opacity = '1';
            product.style.transform = 'translateY(0)';
        } else {
            product.style.display = 'none';
        }
    });

    document.querySelectorAll('.product-divider').forEach(divider => {
        const cat = divider.getAttribute('data-category');
        if (category === 'all' || cat === category) {
            divider.style.display = 'flex';
            divider.style.opacity = '1';
        } else {
            divider.style.display = 'none';
        }
    });
}

// ─── Search ──────────────────────────────────────────────────────────
// FIX 2: class .product-category không tồn tại → dùng data-category attribute
function initSearch() {
    const searchInput = document.querySelector('.search-box input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.trim().toLowerCase();

        if (term.length > 0) {
            showPage('products');
            document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
        }

        const visibleCategories = new Set();

        document.querySelectorAll('.product-card').forEach(product => {
            const nameEl = product.querySelector('.product-name');
            const descEl = product.querySelector('.product-description');
            const cat    = product.getAttribute('data-category') || '';
            const name   = nameEl ? nameEl.textContent.toLowerCase() : '';
            const desc   = descEl ? descEl.textContent.toLowerCase() : '';

            const match = term === '' || name.includes(term) || desc.includes(term) || cat.includes(term);

            if (match) {
                product.style.display = 'flex';
                product.style.opacity = '1';
                product.style.transform = 'translateY(0)';
                visibleCategories.add(cat);
            } else {
                product.style.display = 'none';
            }
        });

        document.querySelectorAll('.product-divider').forEach(divider => {
            const cat = divider.getAttribute('data-category') || '';
            if (term === '' || visibleCategories.has(cat)) {
                divider.style.display = 'flex';
                divider.style.opacity = '1';
            } else {
                divider.style.display = 'none';
            }
        });
    });
}

// ─── Close Sidebar When Clicking Outside ────────────────────────────
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    if (!sidebar || !menuBtn) return;
    if (window.innerWidth <= 1024 &&
        sidebar.classList.contains('active') &&
        !sidebar.contains(e.target) &&
        !menuBtn.contains(e.target)) {
        sidebar.classList.remove('active');
    }
});

// ─── Smooth Scroll Anchors ───────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (!href || href === '#' || href.length <= 1 || href === '#DISCORD_LINK') return;
        e.preventDefault();
        try {
            const target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        } catch (err) {}
    });
});

// ─── Scroll Animation ────────────────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

['.product-card', '.feature-card', '.testimonial-card', '.stat-card'].forEach(sel => {
    document.querySelectorAll(sel).forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });
});

// ─── Handle Resize ───────────────────────────────────────────────────
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (window.innerWidth > 1024) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.remove('active');
        }
    }, 250);
});

// ─── DOMContentLoaded ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    showPage('home');

    document.querySelectorAll('.product-card').forEach(p => { p.style.display = 'flex'; });

    // ── Music & Volume ──────────────────────────────────────────────
    const bgMusic      = document.getElementById('bgMusic');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue  = document.getElementById('volumeValue');
    const volumeIcon   = document.getElementById('volumeIcon');

    if (!bgMusic || !volumeSlider || !volumeValue || !volumeIcon) return;

    bgMusic.volume = volumeSlider.value / 100;
    let musicStarted = false;
    const startMusic = () => {
        if (musicStarted) return;
        bgMusic.play().then(() => { musicStarted = true; }).catch(() => {});
    };
    startMusic();
    ['click', 'touchstart', 'keydown'].forEach(ev => {
        document.addEventListener(ev, () => { if (!musicStarted) startMusic(); }, { once: true });
    });

    // Đồng bộ icon + text theo volume
    const syncIcons = (vol) => {
        const cls = vol == 0 ? 'fas fa-volume-mute'
                  : vol < 50 ? 'fas fa-volume-down'
                  : 'fas fa-volume-up';
        volumeIcon.className = cls;
        const mobIcon = document.getElementById('volumeIconMobile');
        if (mobIcon) mobIcon.className = cls;
        volumeValue.textContent = vol + '%';
    };

    // Hàm mute/unmute dùng chung cho desktop và mobile
    const toggleMute = () => {
        if (bgMusic.volume > 0) {
            volumeIcon.dataset.prevVol = volumeSlider.value;
            bgMusic.volume = 0;
            volumeSlider.value = 0;
            syncIcons(0);
        } else {
            const prev = Number(volumeIcon.dataset.prevVol) || 30;
            bgMusic.volume = prev / 100;
            volumeSlider.value = prev;
            syncIcons(prev);
        }
    };

    // Slider desktop
    volumeSlider.addEventListener('input', (e) => {
        const vol = Number(e.target.value);
        bgMusic.volume = vol / 100;
        syncIcons(vol);
    });

    // Icon desktop: click = mute/unmute
    volumeIcon.addEventListener('click', toggleMute);

    // FIX 3: Mobile volumeToggle
    // - Panel đóng  → bấm = mở panel
    // - Panel mở    → bấm = mute/unmute (không đóng panel)
    const volumeToggleBtn = document.getElementById('volumeToggle');
    if (volumeToggleBtn) {
        // Xóa onclick cũ trong HTML nếu có, gắn listener riêng
        volumeToggleBtn.removeAttribute('onclick');
        volumeToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const panel = document.getElementById('volumeControl');
            if (panel && panel.classList.contains('active')) {
                toggleMute();
            } else {
                toggleVolume();
            }
        });
    }
});

// ─── Product Detail Modal ─────────────────────────────────────────────
function showProductDetail(card) {
    const modal = document.getElementById('productModal');
    if (!modal) return;
    const image       = card.querySelector('.product-image img');
    const name        = card.querySelector('.product-name');
    const description = card.querySelector('.product-description');
    const price       = card.querySelector('.product-price');
    const stockBadge  = card.querySelector('.stock-badge');

    if (image)       document.getElementById('modalProductImage').src = image.src;
    if (name)        document.getElementById('modalProductName').textContent = name.textContent;
    if (description) document.getElementById('modalProductDescription').textContent = description.textContent;
    if (price)       document.getElementById('modalProductPrice').textContent = price.textContent;

    const modalStock = document.getElementById('modalStockBadge');
    if (stockBadge && modalStock) {
        modalStock.textContent   = stockBadge.textContent;
        modalStock.className     = stockBadge.className;
        modalStock.style.display = 'block';
    } else if (modalStock) {
        modalStock.style.display = 'none';
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

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeProductModal(); });