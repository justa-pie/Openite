const fs = require('fs');

console.log('╔═══════════════════════════════════════════╗');
console.log('║  Inject Data → deco.js                   ║');
console.log('╚═══════════════════════════════════════════╝\n');

const JSON_FILE   = 'decorations-simple.json';
const JS_FILE     = 'assets/js/deco.js';

try {
  // Đọc JSON
  if (!fs.existsSync(JSON_FILE)) {
    console.error('❌ Không tìm thấy: ' + JSON_FILE);
    process.exit(1);
  }
  const decorations = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
  console.log('✅ Đọc ' + decorations.length + ' decorations từ ' + JSON_FILE + '\n');

  // Đọc deco.js
  if (!fs.existsSync(JS_FILE)) {
    console.error('❌ Không tìm thấy: ' + JS_FILE);
    process.exit(1);
  }
  let jsContent = fs.readFileSync(JS_FILE, 'utf8');

  // Replace DECORATIONS_DATA placeholder
  const pattern     = /const DECORATIONS_DATA = \[.*?\];/s;
  const replacement = 'const DECORATIONS_DATA = ' + JSON.stringify(decorations, null, 2) + ';';

  if (!pattern.test(jsContent)) {
    console.error('❌ Không tìm thấy DECORATIONS_DATA trong deco.js!');
    process.exit(1);
  }

  jsContent = jsContent.replace(pattern, replacement);
  fs.writeFileSync(JS_FILE, jsContent);

  console.log('✅ Đã inject data vào ' + JS_FILE);
  console.log('📊 ' + decorations.length + ' items | ' + (fs.statSync(JS_FILE).size / 1024).toFixed(1) + ' KB\n');
  console.log('🚀 Mở deco.html trong browser!\n');

} catch (err) {
  console.error('\n❌ Lỗi:', err.message);
  process.exit(1);
}