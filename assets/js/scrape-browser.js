const puppeteer = require('puppeteer');
const fs = require('fs').promises;

console.log('╔════════════════════════════════════════╗');
console.log('║  Discord Scraper v2 - Network Mode    ║');
console.log('╚════════════════════════════════════════╝\n');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  let browser;
  const decorationsData = [];
  
  try {
    console.log('🚀 Đang mở browser...');
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage'
      ],
      defaultViewport: null
    });
    
    const page = await browser.newPage();
    
    // Setup network interception để bắt API calls
    await page.setRequestInterception(true);
    
    page.on('request', request => {
      request.continue();
    });
    
    page.on('response', async response => {
      const url = response.url();
      
      // Bắt các API calls liên quan đến shop/store
      if (url.includes('/store') || 
          url.includes('/shop') || 
          url.includes('/avatar-decoration') ||
          url.includes('/collectibles') ||
          url.includes('/products')) {
        
        try {
          const contentType = response.headers()['content-type'];
          if (contentType && contentType.includes('application/json')) {
            const json = await response.json();
            console.log(`\n📡 API Call: ${url.substring(0, 80)}...`);
            console.log(`Response type: ${typeof json}`);
            
            // Lưu response để debug
            if (json) {
              decorationsData.push({
                url: url,
                data: json
              });
            }
          }
        } catch (e) {
          // Ignore errors
        }
      }
    });
    
    // Giả mạo user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Ẩn automation
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
    
    console.log('🌐 Đang mở Discord...');
    await page.goto('https://discord.com/login', { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });
    
    console.log('\n⏳ VUI LÒNG ĐĂNG NHẬP DISCORD...');
    console.log('(Đợi bạn login xong, script sẽ tự chạy)\n');
    
    await page.waitForFunction(
      () => window.location.pathname.includes('@me') || window.location.pathname.includes('/channels'),
      { timeout: 300000 }
    );
    
    console.log('✅ Đã login!\n');
    await sleep(3000);
    
    console.log('🛍️  Đang vào shop...');
    await page.goto('https://discord.com/shop', { 
      waitUntil: 'networkidle0',
      timeout: 60000 
    });
    
    console.log('⏳ Đang đợi shop load (10 giây)...');
    await sleep(10000); // Đợi lâu hơn để API calls hoàn tất
    
    console.log('📜 Đang scroll...');
    await page.evaluate(async () => {
      for (let i = 0; i < 5; i++) {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    });
    
    await sleep(5000);
    
    console.log('\n🔍 Đang phân tích trang...\n');
    
    // Thử nhiều cách khác nhau để tìm decorations
    const result = await page.evaluate(() => {
      const items = [];
      
      // Method 1: Tìm theo class patterns
      const patterns = [
        '[class*="product"]',
        '[class*="item"]',
        '[class*="card"]',
        '[class*="decoration"]',
        '[class*="avatar"]',
        '[data-list-item-id]',
        'article',
        '[role="article"]',
        '[role="listitem"]'
      ];
      
      for (const pattern of patterns) {
        const elements = document.querySelectorAll(pattern);
        console.log(`Pattern "${pattern}": ${elements.length} elements`);
        
        elements.forEach(el => {
          // Tìm images
          const imgs = el.querySelectorAll('img');
          imgs.forEach(img => {
            if (img.src && (img.src.includes('discord') || img.src.includes('cdn'))) {
              const name = img.alt || el.textContent?.trim().substring(0, 50) || 'Unknown';
              
              // Tìm ID từ URL hoặc data attributes
              let id = null;
              const href = el.querySelector('a')?.href || el.closest('a')?.href;
              
              if (href) {
                const match = href.match(/itemSkuId=(\d+)/);
                id = match ? match[1] : null;
              }
              
              // Thử tìm ID từ data attributes
              if (!id) {
                id = el.getAttribute('data-id') || 
                     el.getAttribute('data-sku-id') ||
                     el.getAttribute('data-item-id') ||
                     img.src.match(/\/(\d+)\./)?.[1];
              }
              
              if (id && !items.find(i => i.id === id)) {
                items.push({
                  id: id,
                  name: name.replace(/\s+/g, ' ').trim(),
                  image: img.src,
                  url: href || `https://discord.com/shop`
                });
              }
            }
          });
        });
        
        if (items.length > 0) break;
      }
      
      return {
        items: items,
        htmlSample: document.body.innerHTML.substring(0, 2000)
      };
    });
    
    console.log(`✨ Tìm thấy: ${result.items.length} decorations từ DOM\n`);
    
    // Lưu API data để debug
    if (decorationsData.length > 0) {
      await fs.writeFile(
        'api-responses.json', 
        JSON.stringify(decorationsData, null, 2)
      );
      console.log('💾 Đã lưu API responses: api-responses.json');
    }
    
    let finalDecorations = result.items;
    
    // Nếu không tìm thấy gì, thử parse từ API data
    if (finalDecorations.length === 0 && decorationsData.length > 0) {
      console.log('\n🔄 Đang thử parse từ API responses...');
      
      for (const apiData of decorationsData) {
        try {
          const data = apiData.data;
          
          // Thử tìm decorations trong response
          const findDecorations = (obj, path = '') => {
            if (Array.isArray(obj)) {
              obj.forEach((item, index) => {
                if (item && typeof item === 'object') {
                  // Check if this looks like a decoration
                  if (item.sku_id || item.id || item.name) {
                    finalDecorations.push({
                      id: item.sku_id || item.id || `unknown-${index}`,
                      name: item.name || item.title || `Decoration ${index}`,
                      image: item.preview_url || item.image_url || item.image || '',
                      url: `https://discord.com/shop#itemSkuId=${item.sku_id || item.id}`
                    });
                  }
                  findDecorations(item, `${path}[${index}]`);
                }
              });
            } else if (obj && typeof obj === 'object') {
              Object.keys(obj).forEach(key => {
                if (typeof obj[key] === 'object') {
                  findDecorations(obj[key], `${path}.${key}`);
                }
              });
            }
          };
          
          findDecorations(data);
        } catch (e) {
          console.log('Error parsing API data:', e.message);
        }
      }
      
      // Remove duplicates
      finalDecorations = Array.from(
        new Map(finalDecorations.map(item => [item.id, item])).values()
      );
      
      console.log(`✨ Tìm thấy thêm: ${finalDecorations.length} decorations từ API\n`);
    }
    
    if (finalDecorations.length === 0) {
      console.log('⚠️  KHÔNG TÌM THẤY DECORATIONS!\n');
      console.log('Có thể do:');
      console.log('1. ❌ Tài khoản chưa có quyền truy cập shop');
      console.log('2. ❌ Shop chưa available ở region của bạn');
      console.log('3. ❌ Discord thay đổi hoàn toàn cấu trúc');
      console.log('4. ❌ Cần Discord Nitro để xem shop\n');
      
      // Screenshot để debug
      await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
      console.log('📸 Screenshot: debug-screenshot.png');
      
      const html = await page.content();
      await fs.writeFile('debug-page.html', html);
      console.log('📄 HTML: debug-page.html');
      
      // Save HTML sample
      console.log('\n📝 HTML Sample:');
      console.log(result.htmlSample);
      console.log('\n');
      
    } else {
      // Save data
      const fullData = {
        scrapedAt: new Date().toISOString(),
        total: finalDecorations.length,
        decorations: finalDecorations
      };
      
      await fs.writeFile('decorations.json', JSON.stringify(fullData, null, 2));
      console.log('💾 Đã lưu: decorations.json');
      
      await fs.writeFile('decorations-simple.json', JSON.stringify(finalDecorations, null, 2));
      console.log('💾 Đã lưu: decorations-simple.json');
      
      // Create preview
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Discord Decorations - ${finalDecorations.length} items</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui; background: #1e1e1e; color: #fff; padding: 20px; }
    h1 { text-align: center; margin-bottom: 20px; color: #5865f2; }
    .stats { text-align: center; margin-bottom: 30px; color: #aaa; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; max-width: 1400px; margin: 0 auto; }
    .card { background: #2a2a2a; border-radius: 12px; overflow: hidden; cursor: pointer; transition: transform 0.2s; }
    .card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(88, 101, 242, 0.3); }
    .card img { width: 100%; height: 200px; object-fit: contain; background: #1a1a1a; }
    .card-body { padding: 15px; }
    .card-title { font-weight: 600; margin-bottom: 8px; color: #5865f2; }
    .card-id { font-size: 0.8em; color: #666; }
  </style>
</head>
<body>
  <h1>🎨 Discord Decorations</h1>
  <div class="stats">Total: ${finalDecorations.length} decorations | ${new Date().toLocaleDateString('vi-VN')}</div>
  <div class="grid">
    ${finalDecorations.map(d => `
      <div class="card" onclick="window.open('${d.url}', '_blank')">
        <img src="${d.image}" alt="${d.name}" onerror="this.style.display='none'">
        <div class="card-body">
          <div class="card-title">${d.name}</div>
          <div class="card-id">ID: ${d.id}</div>
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>`;
      
      await fs.writeFile('preview.html', html);
      console.log('💾 Đã lưu: preview.html');
      
      console.log('\n✅ HOÀN TẤT!');
      console.log(`📊 Tổng cộng: ${finalDecorations.length} decorations\n`);
    }
    
  } catch (error) {
    console.error('\n❌ Lỗi:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    console.log('\n⏸️  Nhấn Enter để đóng browser...');
    await new Promise(resolve => process.stdin.once('data', resolve));
    
    if (browser) {
      await browser.close();
      console.log('👋 Đã đóng browser\n');
    }
  }
}

main();