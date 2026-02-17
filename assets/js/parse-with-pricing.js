const fs = require('fs');

console.log('╔════════════════════════════════════════╗');
console.log('║  Parser with Pricing - All Types      ║');
console.log('╚════════════════════════════════════════╝\n');

// ── Trích giá từ object prices ────────────────────────────────────────
function extractPricing(pricesObject) {
  if (!pricesObject) return null;
  const result = { regular: null, nitro: null, currency: 'VND' };

  for (const [key, label] of [['0', 'regular'], ['4', 'nitro']]) {
    const entry = pricesObject[key];
    if (!entry) continue;
    const cp = entry.country_prices;
    if (!cp || !cp.prices || !cp.prices[0]) continue;
    const p = cp.prices[0];
    const exp = p.exponent || 0;
    result[label] = exp ? p.amount / Math.pow(10, exp) : p.amount;
    result.currency = (p.currency || 'VND').toUpperCase();
  }

  return (result.regular || result.nitro) ? result : null;
}

// ── Đọc file API ──────────────────────────────────────────────────────
let filename;
if      (fs.existsSync('api-responses-complete.json')) filename = 'api-responses-complete.json';
else if (fs.existsSync('api-responses.json'))          filename = 'api-responses.json';
else {
  console.error('❌ Không tìm thấy API data file!');
  console.error('   Chạy: node scrape-browser.js\n');
  process.exit(1);
}

console.log(`📖 Đang đọc ${filename}...`);
const apiData = JSON.parse(fs.readFileSync(filename, 'utf8'));
console.log(`✅ Đọc thành công (${apiData.length} responses)\n`);

const decorations = [];
const seenIds     = new Set();

// ── Helper: thêm decoration vào list ─────────────────────────────────
function addDecoration(id, name, image, type, typeLabel, isAnimated, asset, rawType, pricing, extras = {}) {
  id = String(id);
  if (!id || seenIds.has(id)) return;
  seenIds.add(id);
  decorations.push({
    id, name: (name || '').trim(),
    image,
    url: `https://discord.com/shop#itemSkuId=${id}`,
    type, typeLabel, isAnimated, asset: asset || null, rawType,
    pricing,
    ...extras
  });
}

// ── Helper: xử lý 1 sub-item (type 0 / 2 / 1) với pricing cha ───────
function processSubItem(sub, parentPricing) {
  const t = sub.type;

  // TYPE 0 - Avatar Decoration
  if (t === 0) {
    if (!sub.assets) return;
    const img  = sub.assets.animated_image_url || sub.assets.static_image_url;
    const anim = !!sub.assets.animated_image_url;
    addDecoration(
      sub.sku_id || sub.id,
      sub.label,
      img,
      'avatar_decoration', '👤 Avatar Decoration',
      anim, sub.asset, 0, parentPricing
    );
  }

  // TYPE 2 - Nameplate hoặc Profile Effect
  else if (t === 2) {
    if (!sub.assets) return;
    const img     = sub.assets.animated_image_url || sub.assets.static_image_url;
    const anim    = !!sub.assets.animated_image_url;
    const asset   = sub.asset || '';
    const isPlate = asset.includes('nameplates/');
    addDecoration(
      sub.sku_id || sub.id,
      sub.label,
      img,
      isPlate ? 'nameplate' : 'profile_effect',
      isPlate ? '📛 Nameplate'  : '✨ Profile Effect',
      anim, asset, 2, parentPricing
    );
  }

  // TYPE 1 - Profile Effect
  else if (t === 1) {
    const img = sub.thumbnailPreviewSrc || sub.reducedMotionSrc || '';
    addDecoration(
      sub.sku_id,
      sub.title || sub.name,
      img,
      'profile_effect', '✨ Profile Effect',
      !!(sub.effects && sub.effects.length),
      null, 1, parentPricing,
      { effects: sub.effects || [], description: sub.description || '' }
    );
  }
}

// ── Xử lý từng product trong category ────────────────────────────────
function processProduct(prod) {
  const t = prod.type;

  // BUNDLE (type 1000) → pricing từ bundle, sub-items là items[]
  if (t === 1000) {
    const pricing = extractPricing(prod.prices);
    for (const sub of (prod.items || [])) {
      processSubItem(sub, pricing);
    }
    return;
  }

  // STANDALONE type 0, 1, 2 → pricing nằm ở chính prod.prices
  const pricing = extractPricing(prod.prices);

  // Có variants → mỗi variant có pricing riêng
  if (prod.variants && prod.variants.length > 0) {
    for (const variant of prod.variants) {
      const vPricing = extractPricing(variant.prices) || pricing;
      for (const sub of (variant.items || [])) {
        processSubItem(sub, vPricing);
      }
    }
    return;
  }

  // Không có variants → xử lý items[] với pricing chung
  for (const sub of (prod.items || [])) {
    processSubItem(sub, pricing);
  }
}

// ── Scan toàn bộ API responses ────────────────────────────────────────
console.log('🔍 Đang extract...\n');

for (const response of apiData) {
  const data = response.data;

  // collectibles-categories: { categories: [ { products: [...] } ] }
  if (data && data.categories) {
    for (const cat of data.categories) {
      for (const prod of (cat.products || [])) {
        processProduct(prod);
      }
    }
  }

  // collectibles-shop: { shop_blocks: [ { subblocks: [...] } ] }
  if (data && data.shop_blocks) {
    for (const block of data.shop_blocks) {
      for (const sub of (block.subblocks || [])) {
        for (const prod of (sub.products || sub.items || [])) {
          processProduct(prod);
        }
      }
    }
  }
}

// ── Thống kê ──────────────────────────────────────────────────────────
const stats = {
  total:            decorations.length,
  avatarDecorations: decorations.filter(d => d.type === 'avatar_decoration').length,
  nameplates:       decorations.filter(d => d.type === 'nameplate').length,
  profileEffects:   decorations.filter(d => d.type === 'profile_effect').length,
  animated:         decorations.filter(d => d.isAnimated).length,
  withPricing:      decorations.filter(d => d.pricing).length,
};

console.log(`✨ Tìm thấy: ${stats.total} items\n`);
console.log('📊 PHÂN LOẠI:\n');
console.log(`   👤 Avatar Decorations : ${stats.avatarDecorations}`);
console.log(`   📛 Nameplates         : ${stats.nameplates}`);
console.log(`   ✨ Profile Effects    : ${stats.profileEffects}`);
console.log(`   🎬 Animated           : ${stats.animated}`);
console.log(`   💰 With Pricing       : ${stats.withPricing}`);
console.log(`   📦 Total              : ${stats.total}\n`);

if (stats.withPricing < stats.total) {
  const missing = decorations.filter(d => !d.pricing);
  console.log(`⚠️  ${missing.length} items THIẾU pricing:`);
  missing.slice(0, 5).forEach(d => console.log(`   - [${d.type}] ${d.name} (${d.id})`));
  console.log();
}

// ── Lưu file ─────────────────────────────────────────────────────────
console.log('💾 Đang lưu files...');

fs.writeFileSync('decorations-simple.json', JSON.stringify(decorations, null, 2));
console.log('✅ decorations-simple.json');

fs.writeFileSync('decorations.json', JSON.stringify({
  scrapedAt: new Date().toISOString(),
  source: filename,
  stats,
  decorations,
}, null, 2));
console.log('✅ decorations.json\n');

console.log('🎯 Bước tiếp theo:');
console.log('   node inject-data.js');
console.log('   open index.html\n');