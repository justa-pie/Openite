const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const fsSync = require('fs');

console.log('╔════════════════════════════════════════╗');
console.log('║  Discord Scraper v4 - Bundle Images   ║');
console.log('╚════════════════════════════════════════╝\n');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox',
             '--disable-blink-features=AutomationControlled'],
      defaultViewport: null,
    });

    const page = await browser.newPage();

    // ── Intercept ALL API responses passively ─────────────────────────
    const capturedResponses = [];
    const capturedUrls = new Set();

    await page.setRequestInterception(true);
    page.on('request', req => req.continue());

    page.on('response', async response => {
      const url = response.url();
      if (!url.includes('/api/v9/')) return;
      if (capturedUrls.has(url)) return;

      const patterns = [
        '/collectibles-categories',
        '/collectibles-shop',
        '/collectibles-purchases',
        '/collectibles-marketing',
        '/store/published-listings',  // bundle listing images
      ];
      if (!patterns.some(p => url.includes(p))) return;

      try {
        const ct = response.headers()['content-type'] || '';
        if (!ct.includes('application/json')) return;
        const json = await response.json();
        if (!json) return;
        capturedUrls.add(url);
        capturedResponses.push({ url, data: json });
        const short = url.replace('https://discord.com/api/v9', '').split('?')[0];
        console.log(`  📡 ${short}`);
      } catch (_) {}
    });

    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
    );
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    // ── Login ─────────────────────────────────────────────────────────
    console.log('🌐 Mở Discord...');
    await page.goto('https://discord.com/login', { waitUntil: 'networkidle2', timeout: 60000 });
    console.log('\n⏳ VUI LÒNG ĐĂNG NHẬP...');
    await page.waitForFunction(
      () => window.location.pathname.includes('@me') || window.location.pathname.includes('/channels'),
      { timeout: 300000 }
    );
    console.log('✅ Đã login!\n');
    await sleep(3000);

    // ── Load shop to capture main collectibles endpoints ──────────────
    console.log('🛍️  Vào shop...');
    await page.goto('https://discord.com/shop', { waitUntil: 'networkidle0', timeout: 60000 });
    await sleep(6000);
    await page.evaluate(async () => {
      for (let i = 0; i < 4; i++) {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(r => setTimeout(r, 1200));
      }
    });
    await sleep(2000);
    console.log(`  ✅ Phase 1: ${capturedResponses.length} responses\n`);

    // ── Get bundle SKUs ───────────────────────────────────────────────
    let bundleSkus = [];
    const allSources = [...capturedResponses];
    if (fsSync.existsSync('api-responses.json')) {
      const prev = JSON.parse(fsSync.readFileSync('api-responses.json', 'utf8'));
      allSources.push(...prev);
    }
    for (const resp of allSources) {
      const d = resp.data;
      if (d?.categories)
        for (const cat of d.categories)
          for (const prod of (cat.products || []))
            if (prod.type === 1000 && !bundleSkus.includes(prod.sku_id))
              bundleSkus.push(prod.sku_id);
    }
    console.log(`📦 ${bundleSkus.length} bundles cần fetch\n`);

    if (bundleSkus.length === 0) {
      console.log('⚠️  Không tìm thấy bundle SKUs. Kiểm tra lại api-responses.json');
    }

    // ── Navigate to each bundle page to trigger store-listing API ─────
    // Strategy: use Discord's own shop URL with itemSkuId hash
    // This makes Discord's app call /store/published-listings/sku/{id} automatically
    console.log('🖼️  Đang trigger store-listing API cho từng bundle...');
    console.log('   (Phương pháp: navigate đến từng bundle URL)\n');

    let fetched = 0;
    const BATCH = 10; // process in batches, navigating quickly

    for (let i = 0; i < bundleSkus.length; i++) {
      const sku = bundleSkus[i];
      const url = `https://discord.com/shop#itemSkuId=${sku}`;

      try {
        // Navigate and wait briefly for the API call to fire
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await sleep(1200); // give time for store-listing fetch
        fetched++;

        if (fetched % BATCH === 0) {
          console.log(`   ${fetched}/${bundleSkus.length} bundles...`);
        }
      } catch (e) {
        // timeout or nav error - continue
      }
    }
    console.log(`\n  ✅ Navigated ${fetched} bundle pages`);
    await sleep(2000);

    // ── Extract bundle images from captured store-listing responses ────
    const bundleImages = {};
    let imgCount = 0;

    for (const resp of capturedResponses) {
      if (!resp.url.includes('/store/published-listings/sku/')) continue;
      const sku = resp.url.split('/store/published-listings/sku/')[1]?.split('?')[0];
      if (!sku) continue;

      const d = resp.data;
      // Published listing structure varies — check common image fields
      const imgUrl =
        d?.summary?.thumbnail?.url                   ||
        d?.summary?.thumbnail                         ||
        d?.summary?.box_art?.url                      ||
        d?.summary?.header_background?.url            ||
        d?.sku?.thumbnail?.url                        ||
        d?.listing?.summary?.thumbnail?.url           ||
        d?.thumbnail?.url                             ||
        null;

      if (imgUrl && typeof imgUrl === 'string') {
        bundleImages[sku] = imgUrl;
        imgCount++;
      }
    }

    console.log(`\n🖼️  Bundle images captured: ${imgCount}/${bundleSkus.length}`);

    // If passive capture missed some, log sample listing structure for debugging
    if (imgCount === 0) {
      const sampleListing = capturedResponses.find(r => r.url.includes('/store/published-listings/sku/'));
      if (sampleListing) {
        console.log('\n  DEBUG - Sample listing structure:');
        console.log('  Keys:', Object.keys(sampleListing.data));
        if (sampleListing.data.summary) {
          console.log('  summary keys:', Object.keys(sampleListing.data.summary));
        }
        console.log('  Full (first 500 chars):', JSON.stringify(sampleListing.data).slice(0, 500));
      } else {
        console.log('\n  ⚠️  No store-listing responses were captured.');
        console.log('  Discord may not call this endpoint via page navigation.');
        console.log('  Will try direct XMLHttpRequest approach...\n');

        // Fallback: use XMLHttpRequest inside browser (uses session cookies automatically)
        console.log('  Trying XHR fallback for first 5 bundles...');
        for (const sku of bundleSkus.slice(0, 5)) {
          try {
            const result = await page.evaluate(async (skuId) => {
              return new Promise((resolve) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', `/api/v9/store/published-listings/sku/${skuId}`, true);
                xhr.withCredentials = true;
                xhr.onload = () => {
                  try { resolve({ status: xhr.status, data: JSON.parse(xhr.responseText) }); }
                  catch (e) { resolve({ status: xhr.status, error: xhr.responseText.slice(0, 200) }); }
                };
                xhr.onerror = () => resolve({ status: 0, error: 'XHR error' });
                xhr.send();
              });
            }, sku);

            console.log(`  SKU ${sku}: status=${result.status}`);
            if (result.status === 200) {
              console.log('  Keys:', Object.keys(result.data));
              console.log('  Sample:', JSON.stringify(result.data).slice(0, 300));
            } else {
              console.log('  Error:', result.error?.slice(0, 100));
            }
          } catch (e) {
            console.log(`  SKU ${sku}: exception - ${e.message}`);
          }
          await sleep(300);
        }
      }
    }

    // ── Save results ─────────────────────────────────────────────────
    await fs.writeFile('bundle-images.json', JSON.stringify(bundleImages, null, 2));
    console.log('\n💾 bundle-images.json saved');

    // Merge and save api-responses.json
    let finalResponses = [...capturedResponses];
    if (fsSync.existsSync('api-responses.json')) {
      const prev = JSON.parse(fsSync.readFileSync('api-responses.json', 'utf8'));
      const existUrls = new Set(capturedResponses.map(r => r.url));
      for (const r of prev) {
        if (!existUrls.has(r.url)) finalResponses.push(r);
      }
    }
    await fs.writeFile('api-responses.json', JSON.stringify(finalResponses, null, 2));
    console.log('💾 api-responses.json updated\n');

    console.log(`📊 Tổng: ${imgCount} bundle images`);
    if (imgCount > 0) {
      console.log('🎯 Tiếp theo: node parse-with-pricing.js && node inject-data.js\n');
    } else {
      console.log('⚠️  Chưa lấy được hình bundle. Xem debug output ở trên.\n');
    }

  } catch (err) {
    console.error('\n❌ Lỗi:', err.message);
  } finally {
    console.log('⏸️  Nhấn Enter để đóng...');
    await new Promise(r => process.stdin.once('data', r));
    if (browser) await browser.close();
  }
}

main();