const fs = require('fs');

console.log('╔════════════════════════════════════════╗');
console.log('║  Parser v4 - Standalone First + Bundle ║');
console.log('╚════════════════════════════════════════╝\n');

// ── Extract pricing ───────────────────────────────────────────────────
function extractPricing(pricesObj) {
  if (!pricesObj) return null;
  const r = { regular: null, nitro: null, currency: 'VND' };
  for (const [key, label] of [['0', 'regular'], ['4', 'nitro']]) {
    const prices = pricesObj[key]?.country_prices?.prices;
    if (!prices?.[0]) continue;
    const p = prices[0];
    r[label]   = p.exponent ? p.amount / Math.pow(10, p.exponent) : p.amount;
    r.currency = (p.currency || 'VND').toUpperCase();
  }
  return (r.regular || r.nitro) ? r : null;
}

// ── Read API file ─────────────────────────────────────────────────────
let filename;
if      (fs.existsSync('api-responses-complete.json')) filename = 'api-responses-complete.json';
else if (fs.existsSync('api-responses.json'))          filename = 'api-responses.json';
else { console.error('❌ Không tìm thấy API data file!'); process.exit(1); }

console.log(`📖 Đang đọc ${filename}...`);
const apiData = JSON.parse(fs.readFileSync(filename, 'utf8'));
console.log(`✅ Đọc thành công (${apiData.length} responses)\n`);

// ── Load bundle images if available ─────────────────────────────────
let bundleImages = {};
if (fs.existsSync('bundle-images.json')) {
  bundleImages = JSON.parse(fs.readFileSync('bundle-images.json', 'utf8'));
  console.log(`🖼️  Loaded ${Object.keys(bundleImages).length} bundle images từ bundle-images.json\n`);
} else {
  // Try extracting from api-responses if scrape-browser v3 was run
  for (const resp of apiData) {
    if (resp.url === 'bundle-listings-compiled' && resp.data?.bundleImages) {
      bundleImages = resp.data.bundleImages;
      console.log(`🖼️  Loaded ${Object.keys(bundleImages).length} bundle images từ api-responses.json\n`);
      break;
    }
  }
  if (!Object.keys(bundleImages).length) {
    console.log('ℹ️  bundle-images.json chưa có — bundle sẽ dùng ảnh nameplate/avatar thay thế.');
    console.log('   Chạy scrape-browser.js v3 để có ảnh bundle chính xác.\n');
  }
}

const decorations = [];
const seenIds = new Set();

function addItem(id, name, image, type, typeLabel, isAnimated, asset, rawType, pricing, extras = {}) {
  id = String(id);
  if (!id || seenIds.has(id)) return false;
  seenIds.add(id);
  decorations.push({
    id, name: (name || '').trim(), image,
    url: `https://discord.com/shop#itemSkuId=${id}`,
    type, typeLabel, isAnimated,
    asset: asset || null, rawType, pricing, ...extras
  });
  return true;
}

function processSubItem(it, pricing, name) {
  const t = it.type;
  if (t === 0) {
    if (!it.assets) return;
    addItem(it.sku_id || it.id, name,
      it.assets.animated_image_url || it.assets.static_image_url,
      'avatar_decoration', '👤 Avatar Decoration',
      !!it.assets.animated_image_url, it.asset, 0, pricing);
  } else if (t === 2) {
    if (!it.assets) return;
    addItem(it.sku_id || it.id, name,
      it.assets.animated_image_url || it.assets.static_image_url,
      'nameplate', '📛 Nameplate',
      !!it.assets.animated_image_url, it.asset || '', 2, pricing);
  } else if (t === 1) {
    // Lấy GIF động từ effects[0].src thay vì thumbnail tĩnh
    const animatedSrc = it.effects?.[0]?.src || it.thumbnailPreviewSrc || it.reducedMotionSrc || '';
    addItem(it.sku_id, it.title || it.label || name,
      animatedSrc,  // ← Dùng GIF từ effects[0].src, không phải thumbnail
      'profile_effect', '✨ Profile Effect',
      !!(it.effects?.length), null, 1, pricing,
      { effects: it.effects || [], description: it.description || '' });
  }
}

// ── Collect all products ──────────────────────────────────────────────
const allProducts = [];
for (const response of apiData) {
  const d = response.data;
  if (d?.categories)
    for (const cat of d.categories)
      for (const prod of (cat.products || []))
        allProducts.push(prod);
  if (d?.shop_blocks)
    for (const block of d.shop_blocks)
      for (const sub of (block.subblocks || []))
        for (const prod of (sub.products || sub.items || []))
          allProducts.push(prod);
}
console.log(`🔍 Tổng products: ${allProducts.length}\n`);

// ═══════════════════════════════════════════════════════
//  PASS 1: STANDALONE — correct name + correct price
// ═══════════════════════════════════════════════════════
console.log('Pass 1: Standalone products...');
for (const prod of allProducts) {
  if (prod.type === 1000) continue;
  const prodName    = prod.name || '';
  const prodPricing = extractPricing(prod.prices);

  if (prod.variants?.length) {
    for (const variant of prod.variants) {
      const vName    = variant.name || prodName;
      const vPricing = extractPricing(variant.prices) || prodPricing;
      for (const it of (variant.items || []))
        processSubItem(it, vPricing, vName);
    }
    continue;
  }
  for (const it of (prod.items || []))
    processSubItem(it, prodPricing, prodName);
}
const afterPass1 = decorations.length;
console.log(`   ✅ ${afterPass1} standalone items\n`);

// ═══════════════════════════════════════════════════════
//  PASS 2: BUNDLES — add bundle itself only
// ═══════════════════════════════════════════════════════
console.log('Pass 2: Bundles...');
for (const prod of allProducts) {
  if (prod.type !== 1000) continue;
  const items   = prod.items || [];
  const pricing = extractPricing(prod.prices);
  const sku     = String(prod.sku_id);

  // Best bundle image: from bundle-images.json (store listing) → nameplate → avatar → fx
  const plateItem  = items.find(it => it.type === 2);
  const avatarItem = items.find(it => it.type === 0);
  const fxItem     = items.find(it => it.type === 1);

  const bundleImage =
    bundleImages[sku]                          ||   // ← real bundle store listing image
    plateItem?.assets?.animated_image_url      ||
    avatarItem?.assets?.animated_image_url     ||
    fxItem?.thumbnailPreviewSrc                || '';

  const includedTypes = items.map(it =>
    it.type === 0 ? 'Avatar' : it.type === 2 ? 'Nameplate' : 'Profile FX'
  );

  addItem(sku, prod.name || '', bundleImage,
    'bundle', '📦 Bundle', true, null, 1000, pricing, {
      bundleItems: items.map(it => ({
        sku_id: String(it.sku_id || it.id),
        type: it.type === 0 ? 'avatar_decoration' : it.type === 2 ? 'nameplate' : 'profile_effect',
      })),
      includedTypes,
    }
  );
}
console.log(`   ✅ ${decorations.length - afterPass1} bundles\n`);

// ── Stats ─────────────────────────────────────────────────────────────
const stats = {
  total:             decorations.length,
  bundles:           decorations.filter(d => d.type === 'bundle').length,
  avatarDecorations: decorations.filter(d => d.type === 'avatar_decoration').length,
  nameplates:        decorations.filter(d => d.type === 'nameplate').length,
  profileEffects:    decorations.filter(d => d.type === 'profile_effect').length,
  withPricing:       decorations.filter(d => d.pricing).length,
  bundlesWithImages: decorations.filter(d => d.type === 'bundle' && d.image).length,
};

console.log('📊 KẾT QUẢ:');
console.log(`   📦 Bundles           : ${stats.bundles} (${stats.bundlesWithImages} có hình)`);
console.log(`   👤 Avatar Decorations: ${stats.avatarDecorations}`);
console.log(`   📛 Nameplates        : ${stats.nameplates}`);
console.log(`   ✨ Profile Effects   : ${stats.profileEffects}`);
console.log(`   💰 With Pricing      : ${stats.withPricing}`);
console.log(`   📦 TOTAL             : ${stats.total}\n`);

// Save
console.log('💾 Đang lưu...');
fs.writeFileSync('decorations-simple.json', JSON.stringify(decorations, null, 2));
console.log('✅ decorations-simple.json');
fs.writeFileSync('decorations.json', JSON.stringify({
  scrapedAt: new Date().toISOString(), source: filename, stats, decorations
}, null, 2));
console.log('✅ decorations.json\n');
console.log('🎯 Tiếp theo: node inject-data.js\n');