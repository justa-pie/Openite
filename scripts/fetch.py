#!/usr/bin/env python3
"""
JPSTORE - DISCORD DECORATIONS FETCHER
Lấy toàn bộ decorations từ GitHub + Manual items
"""

import requests
import json
from datetime import datetime
import os

# GitHub Archive URLs
GITHUB_BASE = "https://raw.githubusercontent.com/Infinitay/discord-collectibles-archive/main/discord-data"
AVATAR_DECO_URL = f"{GITHUB_BASE}/avatar-decorations.json"
PROFILE_EFFECTS_URL = f"{GITHUB_BASE}/profile-effects.json"

# VND Exchange Rate
USD_TO_VND = 25000
MARKUP_PERCENT = 15  # Lãi 15%

# Paths
MANUAL_FILE = "./data/manual.json"
OUTPUT_JSON = "./data/products.json"
OUTPUT_HTML = "./data/products.html"
README_FILE = "./README.md"


def print_banner():
    """Banner"""
    print("=" * 80)
    print("""
    ░░░░░██╗██████╗░░██████╗████████╗░█████╗░██████╗░███████╗
    ░░░░░██║██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██╔════╝
    ░░░░░██║██████╔╝╚█████╗░░░░██║░░░██║░░██║██████╔╝█████╗░░
    ██╗░░██║██╔═══╝░░╚═══██╗░░░██║░░░██║░░██║██╔══██╗██╔══╝░░
    ╚█████╔╝██║░░░░░██████╔╝░░░██║░░░╚█████╔╝██║░░██║███████╗
    ░╚════╝░╚═╝░░░░░╚═════╝░░░░╚═╝░░░░╚════╝░╚═╝░░╚═╝╚══════╝
    """)
    print("           DISCORD DECORATIONS FETCHER v2.0")
    print("=" * 80)
    print()


def fetch_from_github(url, name):
    """Fetch data từ GitHub"""
    print(f"📡 Fetching {name}...")
    
    try:
        response = requests.get(url, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success: {len(data)} items")
            return data
        else:
            print(f"   ❌ Error: HTTP {response.status_code}")
            return None
            
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return None


def load_manual_items():
    """Load manual decorations từ manual.json"""
    print(f"📂 Loading manual items...")
    
    if not os.path.exists(MANUAL_FILE):
        print(f"   ⚠️  File not found: {MANUAL_FILE}")
        print(f"   ℹ️  Creating empty manual.json...")
        os.makedirs(os.path.dirname(MANUAL_FILE), exist_ok=True)
        with open(MANUAL_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)
        return []
    
    try:
        with open(MANUAL_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(f"   ✅ Loaded: {len(data)} items")
            return data
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return []


def parse_github_decorations(raw_data, item_type='avatar_decoration'):
    """Parse GitHub data thành format chuẩn"""
    
    decorations = []
    
    for item in raw_data:
        # Tính giá
        price_usd = item.get('price', 0)
        price_vnd_base = int(price_usd * USD_TO_VND)
        price_vnd_sale = int(price_vnd_base * (1 + MARKUP_PERCENT / 100))
        
        # Get image URL
        if item_type == 'avatar_decoration':
            image_url = item.get('animated_image_url') or item.get('static_image_url', '')
        else:
            image_url = item.get('image_url', '')
        
        decoration = {
            'id': item.get('id', ''),
            'sku_id': item.get('sku_id', ''),
            'name': item.get('name', 'Unknown'),
            'description': item.get('description', ''),
            'price_usd': price_usd,
            'price_vnd_base': price_vnd_base,
            'price_vnd_sale': price_vnd_sale,
            'image_url': image_url,
            'collection': item.get('category_name', 'Unknown'),
            'available': not item.get('deleted', False),
            'premium': item.get('premium_type', 0) > 0,
            'type': item_type,
            'added_date': item.get('created_at', ''),
            'source': 'github'
        }
        
        decorations.append(decoration)
    
    return decorations


def parse_manual_decorations(manual_data):
    """Parse manual items thành format chuẩn"""
    
    decorations = []
    
    for item in manual_data:
        # Tính giá
        price_usd = item.get('price_usd', 0)
        price_vnd_base = int(price_usd * USD_TO_VND)
        price_vnd_sale = int(price_vnd_base * (1 + MARKUP_PERCENT / 100))
        
        decoration = {
            'id': f"manual_{len(decorations)}",
            'sku_id': '',
            'name': item.get('name', 'Unknown'),
            'description': item.get('description', ''),
            'price_usd': price_usd,
            'price_vnd_base': price_vnd_base,
            'price_vnd_sale': price_vnd_sale,
            'image_url': item.get('image_url', ''),
            'collection': item.get('collection', 'Custom'),
            'available': item.get('available', True),
            'premium': item.get('premium', False),
            'type': item.get('type', 'avatar_decoration'),
            'added_date': datetime.now().isoformat(),
            'source': 'manual'
        }
        
        decorations.append(decoration)
    
    return decorations


def generate_html_product(item):
    """Generate HTML cho 1 product card"""
    
    # Badge
    badge = ''
    if item['premium']:
        badge = '<span class="product-badge">Premium</span>\n                            '
    
    # Stock status
    stock_status = 'Còn hàng' if item['available'] else 'Hết hàng'
    stock_class = 'in-stock' if item['available'] else 'out-of-stock'
    
    # Price display
    if item['price_vnd_sale'] > 0:
        price_html = f'''<div class="product-price">
                                    <span class="price-sale">{item['price_vnd_sale']:,}đ</span>
                                    <span class="price-original">{item['price_vnd_base']:,}đ</span>
                                </div>'''
    else:
        price_html = '<div class="product-price">Free</div>'
    
    # Category
    category = 'Avatar Decoration' if item['type'] == 'avatar_decoration' else 'Profile Effect'
    data_category = 'decoration' if item['type'] == 'avatar_decoration' else 'effect'
    
    # Safe name (escape quotes)
    safe_name = item['name'].replace("'", "\\'")
    
    # Description (limit 150 chars)
    description = item['description'][:150]
    if len(item['description']) > 150:
        description += '...'
    
    html = f'''                    <!-- {item["name"]} -->
                    <div class="product-card" data-category="{data_category}" data-type="{item['type']}" data-collection="{item['collection']}">
                        <div class="product-image">
                            <img src="{item['image_url']}" alt="{item['name']}" loading="lazy" onerror="this.style.display='none';">
                            {badge}<span class="stock-badge {stock_class}">{stock_status}</span>
                        </div>
                        <div class="product-info">
                            <div class="product-category">{category}</div>
                            <h3 class="product-name">{item['name']}</h3>
                            <p class="product-description">{description}</p>
                            <div class="product-footer">
                                {price_html}
                                <button class="add-to-cart" onclick="addToCart('{safe_name}', {item['price_vnd_sale']})" {'disabled' if not item['available'] else ''}>
                                    <i class="fas fa-shopping-cart"></i> Thêm vào giỏ
                                </button>
                            </div>
                        </div>
                    </div>
'''
    
    return html


def save_json(data, filepath):
    """Save JSON file"""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"   💾 Saved: {filepath}")


def save_html(html_content, filepath):
    """Save HTML file"""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"   📄 Saved: {filepath}")


def generate_stats(all_items):
    """Generate statistics"""
    
    total_items = len(all_items)
    github_items = sum(1 for item in all_items if item.get('source') == 'github')
    manual_items = sum(1 for item in all_items if item.get('source') == 'manual')
    decorations = sum(1 for item in all_items if item['type'] == 'avatar_decoration')
    effects = sum(1 for item in all_items if item['type'] == 'profile_effect')
    available = sum(1 for item in all_items if item['available'])
    premium = sum(1 for item in all_items if item['premium'])
    
    collections = set(item['collection'] for item in all_items)
    
    stats = {
        'total_items': total_items,
        'github_items': github_items,
        'manual_items': manual_items,
        'avatar_decorations': decorations,
        'profile_effects': effects,
        'available_items': available,
        'premium_items': premium,
        'total_collections': len(collections),
        'collections': sorted(list(collections)),
    }
    
    return stats


def generate_readme(stats):
    """Generate README.md"""
    
    readme = f"""# JPSTORE - Discord Decorations

## 📊 Statistics

- **Total Items:** {stats['total_items']}
  - From GitHub: {stats['github_items']}
  - Manual Added: {stats['manual_items']}
- **Avatar Decorations:** {stats['avatar_decorations']}
- **Profile Effects:** {stats['profile_effects']}
- **Available:** {stats['available_items']}
- **Premium:** {stats['premium_items']}
- **Collections:** {stats['total_collections']}

## 📅 Last Updated

{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 🔄 How to Update

### Fetch toàn bộ từ GitHub
```bash
cd ~/Documents/GitHub/profile
python3 scripts/fetch.py
```

### Thêm decoration mới
Edit file `data/manual.json`:
```json
{{
  "name": "Your Decoration Name",
  "description": "Description here",
  "price_usd": 2.99,
  "image_url": "https://cdn.discordapp.com/...",
  "collection": "Collection Name",
  "type": "avatar_decoration",
  "premium": false,
  "available": true
}}
```

Sau đó chạy lại script để generate HTML.

## 📝 Collections

{chr(10).join('- ' + c for c in stats['collections'])}

## 📦 Generated Files

- `data/products.json` - Full data (backup)
- `data/products.html` - HTML code (copy vào index.html)
- `README.md` - This file
"""
    
    return readme


def main():
    print_banner()
    
    print("🔍 FETCHING DATA...")
    print()
    
    # Fetch từ GitHub
    avatar_deco_raw = fetch_from_github(AVATAR_DECO_URL, "Avatar Decorations")
    profile_effects_raw = fetch_from_github(PROFILE_EFFECTS_URL, "Profile Effects")
    
    # Load manual items
    manual_raw = load_manual_items()
    
    print()
    print("⚙️  PARSING DATA...")
    print()
    
    # Parse GitHub data
    github_decorations = []
    if avatar_deco_raw:
        github_decorations.extend(parse_github_decorations(avatar_deco_raw, 'avatar_decoration'))
    if profile_effects_raw:
        github_decorations.extend(parse_github_decorations(profile_effects_raw, 'profile_effect'))
    
    print(f"   ✅ GitHub items: {len(github_decorations)}")
    
    # Parse manual data
    manual_decorations = parse_manual_decorations(manual_raw)
    print(f"   ✅ Manual items: {len(manual_decorations)}")
    
    # Merge tất cả
    all_items = github_decorations + manual_decorations
    print(f"   ✅ Total items: {len(all_items)}")
    
    # Generate stats
    stats = generate_stats(all_items)
    
    print()
    print("📊 STATISTICS:")
    print(f"   Total Items:        {stats['total_items']}")
    print(f"   - GitHub:           {stats['github_items']}")
    print(f"   - Manual:           {stats['manual_items']}")
    print(f"   Avatar Decorations: {stats['avatar_decorations']}")
    print(f"   Profile Effects:    {stats['profile_effects']}")
    print(f"   Available:          {stats['available_items']}")
    print(f"   Premium:            {stats['premium_items']}")
    print(f"   Collections:        {stats['total_collections']}")
    
    # Save JSON
    print()
    print("💾 SAVING FILES...")
    print()
    
    full_data = {
        'items': all_items,
        'stats': stats,
        'fetched_at': datetime.now().isoformat(),
        'config': {
            'usd_to_vnd': USD_TO_VND,
            'markup_percent': MARKUP_PERCENT
        }
    }
    
    save_json(full_data, OUTPUT_JSON)
    
    # Generate HTML
    print()
    print("🎨 GENERATING HTML...")
    print()
    
    html_parts = []
    for item in all_items:
        html_parts.append(generate_html_product(item))
    
    html_content = '\n'.join(html_parts)
    save_html(html_content, OUTPUT_HTML)
    
    # Generate README
    readme = generate_readme(stats)
    save_html(readme, README_FILE)
    
    # Final summary
    print()
    print("=" * 80)
    print("🎉 SUCCESS!")
    print("=" * 80)
    print()
    print("📦 FILES CREATED:")
    print(f"   1. {OUTPUT_JSON} - Full data (backup)")
    print(f"   2. {OUTPUT_HTML} - HTML code (ready to paste)")
    print(f"   3. {README_FILE} - Statistics & info")
    print()
    print("📝 NEXT STEPS:")
    print(f"   1. Open {OUTPUT_HTML}")
    print("   2. Copy all content")
    print("   3. Paste into index.html at <div class='products-grid'>")
    print()
    print("🔄 TO ADD NEW ITEMS:")
    print(f"   1. Edit {MANUAL_FILE}")
    print("   2. Run: python3 scripts/fetch.py")
    print()
    print("=" * 80)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Cancelled by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()