const DECORATIONS_DATA = [];


    let currentData = [];
    let currentView = 'grid';
    let selectedDecoration = null;

    function getProxiedImageUrl(url) {
      if (!url) return '';
      
      if (url.includes('cdn.discordapp.com')) {
        if (url.includes('.gif')) {
          return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=400`;
        }
        return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=400&output=webp`;
      }
      
      return url;
    }
    
    function getImageWithFallbacks(decoration) {
      const id = decoration.id;
      const originalUrl = decoration.image;
      
      const urls = [
        originalUrl,
        `https://cdn.discordapp.com/avatar-decoration-presets/a_${id}.gif?size=240&passthrough=true`,
        `https://cdn.discordapp.com/avatar-decoration-presets/${id}.png?size=240&passthrough=true`,
        `https://cdn.discordapp.com/avatar-decoration-presets/${id}.png`,
      ].filter(Boolean);
      
      return urls.map(u => getProxiedImageUrl(u));
    }

    document.addEventListener('DOMContentLoaded', () => {
      loadDecorations();
      setupEventListeners();
    });

    function loadDecorations() {
      currentData = DECORATIONS_DATA;
      document.getElementById('total-count').textContent = currentData.length;
      renderDecorations(currentData);
    }

    function renderDecorations(data) {
      const grid = document.getElementById('decorations-grid');

      if (data.length === 0) {
        grid.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon" role="img" aria-label="No results">🔍</div>
            <h3>Không tìm thấy decoration nào</h3>
            <p>Thử tìm kiếm với từ khóa khác</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = data.map(decoration => {
        const fallbackUrls = getImageWithFallbacks(decoration);
        const primaryUrl = fallbackUrls[0];
        
        const typeLabel = decoration.typeLabel || 
                          (decoration.type === 'avatar_decoration' ? '👤 Avatar Deco' : 
                          decoration.type === 'nameplate' ? '📛 Nameplate' :
                          decoration.type === 'profile_effect' ? '✨ Profile Effect' : '🎨 Decoration');
        
        let pricingHTML = '';
        if (decoration.pricing && decoration.pricing.regular) {
          if (decoration.pricing.nitro && decoration.pricing.nitro < decoration.pricing.regular) {
            const discount = Math.round((1 - decoration.pricing.nitro / decoration.pricing.regular) * 100);
            pricingHTML = `
              <div class="card-pricing">
                <span class="price-regular">${decoration.pricing.regular.toLocaleString()} ${decoration.pricing.currency}</span>
                <span class="price-nitro">${decoration.pricing.nitro.toLocaleString()} ${decoration.pricing.currency}</span>
                <span class="price-badge">-${discount}%</span>
              </div>
            `;
          } else {
            pricingHTML = `
              <div class="card-pricing">
                <span class="price-single">${decoration.pricing.regular.toLocaleString()} ${decoration.pricing.currency}</span>
              </div>
            `;
          }
        }
        
        return `
        <div class="card" onclick="showDetail('${decoration.id}')" data-type="${decoration.type || 'decoration'}">
          <div class="card-image">
            <span class="type-badge">${typeLabel}</span>
            <img
              src="${primaryUrl}"
              alt="${decoration.name}"
              data-fallbacks='${JSON.stringify(fallbackUrls.slice(1))}'
              onerror="tryNextFallback(this)"
              loading="lazy"
            >
          </div>
          <div class="card-body">
            <div class="card-title">${decoration.name}</div>
            <div class="card-id">ID: ${decoration.id}</div>
            ${pricingHTML}
            <div class="card-actions">
              <button class="btn" onclick="event.stopPropagation(); openInDiscordDirect('${decoration.url}')">
                <i class="fas fa-external-link-alt"></i> Xem
              </button>
              <button class="btn" onclick="event.stopPropagation(); copyId('${decoration.id}')">
                <i class="fas fa-copy"></i> Copy ID
              </button>
            </div>
          </div>
        </div>
      `;
      }).join('');
    }

    function setupEventListeners() {
      const searchInput = document.getElementById('search-input');
      searchInput.addEventListener('input', () => {
        applyFilters();
      });

      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.filter-btn').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
          applyFilters();
        });
      });

      document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.view-btn').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
          
          const view = btn.dataset.view;
          const grid = document.getElementById('decorations-grid');
          
          if (view === 'list') {
            grid.classList.add('list-view');
          } else {
            grid.classList.remove('list-view');
          }
        });
      });

      document.getElementById('detail-modal').addEventListener('click', (e) => {
        if (e.target.id === 'detail-modal') {
          closeModal();
        }
      });
    }

    function applyFilters() {
      const searchQuery = document.getElementById('search-input').value.toLowerCase();
      const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
      
      let filtered = DECORATIONS_DATA;
      
      if (activeFilter !== 'all') {
        filtered = filtered.filter(d => d.type === activeFilter);
      }
      
      if (searchQuery) {
        filtered = filtered.filter(d => 
          d.name.toLowerCase().includes(searchQuery) ||
          d.id.includes(searchQuery)
        );
      }
      
      renderDecorations(filtered);
      document.getElementById('total-count').textContent = filtered.length;
    }

    function showDetail(id) {
      selectedDecoration = DECORATIONS_DATA.find(d => d.id === id);
      if (!selectedDecoration) return;

      const fallbackUrls = getImageWithFallbacks(selectedDecoration);
      const modalImg = document.getElementById('modal-image');
      modalImg.src = fallbackUrls[0];
      modalImg.alt = `${selectedDecoration.name} decoration preview`;
      modalImg.setAttribute('data-fallbacks', JSON.stringify(fallbackUrls.slice(1)));
      modalImg.onerror = function() { tryNextFallback(this); };
      
      document.getElementById('modal-title').textContent = selectedDecoration.name;
      document.getElementById('modal-id').textContent = `ID: ${selectedDecoration.id}`;
      document.getElementById('detail-modal').classList.add('active');
    }

    function closeModal() {
      document.getElementById('detail-modal').classList.remove('active');
    }

    function openInDiscord() {
      if (selectedDecoration) {
        window.open(selectedDecoration.url, '_blank', 'noopener,noreferrer');
      }
    }

    function openInDiscordDirect(url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    function copyId(id) {
      navigator.clipboard.writeText(id).then(() => {
        const notification = document.createElement('div');
        notification.textContent = '✅ Đã copy ID!';
        notification.setAttribute('role', 'status');
        notification.setAttribute('aria-live', 'polite');
        notification.style.cssText = `
          position: fixed;
          top: 80px;
          right: 20px;
          background: #5a7a8a;
          color: #f4f6f8;
          padding: 12px 20px;
          border-radius: 10px;
          z-index: 9999;
          font-family: Outfit, sans-serif;
          font-size: 0.9rem;
          box-shadow: 0 8px 24px rgba(28,31,35,0.2);
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
          notification.remove();
        }, 2000);
      });
    }

    function tryNextFallback(img) {
      try {
        const fallbacks = JSON.parse(img.getAttribute('data-fallbacks') || '[]');
        if (fallbacks.length > 0) {
          const nextUrl = fallbacks.shift();
          img.setAttribute('data-fallbacks', JSON.stringify(fallbacks));
          img.src = nextUrl;
        } else {
          img.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%231a1a1a%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2220%22%3E🎨%3C/text%3E%3C/svg%3E';
          img.alt = 'Decoration image not available';
        }
      } catch (e) {
        img.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%231a1a1a%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2220%22%3E🎨%3C/text%3E%3C/svg%3E';
        img.alt = 'Decoration image not available';
      }
    }