#!/usr/bin/env python3
"""
EBT Slot Machine Sprite Cutter
Extracts individual symbols from sprite sheets for the slot machine.
"""

from PIL import Image
import os
import json

# Paths
SPRITESHEET_DIR = "/Users/soleilklosowski/Downloads/EBTCard/TheEBTProgram/frontend/public/slots/spritesheets"
OUTPUT_DIR = "/Users/soleilklosowski/Downloads/EBTCard/TheEBTProgram/frontend/public/slots/symbols"
MANIFEST_PATH = "/Users/soleilklosowski/Downloads/EBTCard/TheEBTProgram/frontend/src/lib/slots/symbols.json"

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Symbol manifest for frontend
manifest = {
    "version": "1.0.0",
    "generated": "2024-11-29",
    "symbols": {}
}

def cut_sprite(img, x, y, width, height, output_name, target_size=128):
    """Cut a sprite from sheet and save as individual PNG."""
    # Crop the sprite
    sprite = img.crop((x, y, x + width, y + height))

    # Resize to target size (maintain aspect ratio, pad if needed)
    sprite.thumbnail((target_size, target_size), Image.Resampling.LANCZOS)

    # Create new image with transparency
    final = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))

    # Center the sprite
    paste_x = (target_size - sprite.width) // 2
    paste_y = (target_size - sprite.height) // 2
    final.paste(sprite, (paste_x, paste_y))

    # Save
    output_path = os.path.join(OUTPUT_DIR, output_name)
    final.save(output_path, 'PNG')
    print(f"  Saved: {output_name}")
    return output_path

# ============ GROCERY ITEMS ============
# Sheet: 2816x1536, 10 columns x 6 rows = 281.6x256 per cell
print("\n=== Cutting Grocery Items ===")
grocery_img = Image.open(os.path.join(SPRITESHEET_DIR, "grocery-items.png"))
GROCERY_CELL_W = 281
GROCERY_CELL_H = 256

grocery_sprites = [
    # Row 0: Produce
    {"name": "apple", "row": 0, "col": 0, "id": 0},
    {"name": "orange", "row": 0, "col": 2, "id": 1},
    {"name": "carrot", "row": 0, "col": 3, "id": 2},
    {"name": "broccoli", "row": 0, "col": 4, "id": 3},
    {"name": "tomato", "row": 0, "col": 5, "id": 4},
    {"name": "cucumber", "row": 0, "col": 6, "id": 5},
    {"name": "bellpepper", "row": 0, "col": 7, "id": 6},
    {"name": "avocado", "row": 0, "col": 8, "id": 7},

    # Row 1: Fruits & Berries
    {"name": "blueberries", "row": 1, "col": 0, "id": 8},
    {"name": "strawberries", "row": 1, "col": 1, "id": 9},
    {"name": "raspberries", "row": 1, "col": 2, "id": 10},
    {"name": "grapes", "row": 1, "col": 4, "id": 11},
    {"name": "watermelon", "row": 1, "col": 5, "id": 12},
    {"name": "lemon", "row": 1, "col": 6, "id": 13},
    {"name": "lime", "row": 1, "col": 7, "id": 14},

    # Row 2: Dairy & Basics
    {"name": "milk", "row": 2, "col": 0, "id": 15},
    {"name": "butter", "row": 2, "col": 1, "id": 16},
    {"name": "eggs", "row": 2, "col": 2, "id": 17},
    {"name": "yogurt", "row": 2, "col": 3, "id": 18},
    {"name": "cheese", "row": 2, "col": 4, "id": 19},
    {"name": "sourcream", "row": 2, "col": 5, "id": 20},
    {"name": "cream", "row": 2, "col": 6, "id": 21},
    {"name": "bread", "row": 2, "col": 8, "id": 22},

    # Row 3: Bakery & Pantry
    {"name": "bagel", "row": 3, "col": 0, "id": 23},
    {"name": "croissant", "row": 3, "col": 1, "id": 24},
    {"name": "muffin", "row": 3, "col": 2, "id": 25},
    {"name": "donut", "row": 3, "col": 3, "id": 26},
    {"name": "cereal", "row": 3, "col": 4, "id": 27},
    {"name": "oatmeal", "row": 3, "col": 5, "id": 28},
    {"name": "rice", "row": 3, "col": 7, "id": 29},
    {"name": "flour", "row": 3, "col": 8, "id": 30},
    {"name": "sugar", "row": 3, "col": 9, "id": 31},

    # Row 4: Canned & Snacks
    {"name": "granola", "row": 4, "col": 0, "id": 32},
    {"name": "pasta", "row": 4, "col": 1, "id": 33},
    {"name": "ketchup", "row": 4, "col": 2, "id": 34},
    {"name": "mustard", "row": 4, "col": 3, "id": 35},
    {"name": "honey", "row": 4, "col": 4, "id": 36},
    {"name": "soup", "row": 4, "col": 6, "id": 37},
    {"name": "beans", "row": 4, "col": 7, "id": 38},
    {"name": "tuna", "row": 4, "col": 8, "id": 39},
    {"name": "corn", "row": 4, "col": 9, "id": 40},

    # Row 5: More items
    {"name": "chips", "row": 5, "col": 0, "id": 41},
    {"name": "pizza", "row": 5, "col": 2, "id": 42},
    {"name": "frozenpizza", "row": 5, "col": 3, "id": 43},
    {"name": "tea", "row": 5, "col": 5, "id": 44},
    {"name": "pretzels", "row": 5, "col": 9, "id": 45},
]

for sprite in grocery_sprites:
    x = sprite["col"] * GROCERY_CELL_W
    y = sprite["row"] * GROCERY_CELL_H
    filename = f"grocery_{sprite['name']}.png"
    cut_sprite(grocery_img, x, y, GROCERY_CELL_W, GROCERY_CELL_H, filename)
    manifest["symbols"][f"grocery_{sprite['name']}"] = {
        "id": sprite["id"],
        "name": sprite["name"],
        "category": "grocery",
        "file": f"/slots/symbols/{filename}",
        "rarity": "common"
    }

grocery_img.close()

# ============ CHAD/WOJAK ACTIONS ============
# Sheet: 2816x1536, 6 columns x 4 rows = 469x384 per cell
print("\n=== Cutting Chad/Wojak Sprites ===")
chad_img = Image.open(os.path.join(SPRITESHEET_DIR, "chad-actions.png"))
CHAD_CELL_W = 469
CHAD_CELL_H = 384

chad_sprites = [
    # Row 0
    {"name": "cart", "row": 0, "col": 0, "id": 100},
    {"name": "receipt", "row": 0, "col": 1, "id": 101},
    {"name": "bags", "row": 0, "col": 2, "id": 102},
    {"name": "register", "row": 0, "col": 4, "id": 103},

    # Row 1: Money themed
    {"name": "rich", "row": 1, "col": 0, "id": 104},
    {"name": "stonks", "row": 1, "col": 1, "id": 105},
    {"name": "moneythrow", "row": 1, "col": 2, "id": 106},
    {"name": "spend", "row": 1, "col": 3, "id": 107},
    {"name": "atm", "row": 1, "col": 4, "id": 108},

    # Row 2: Meme poses
    {"name": "cope", "row": 2, "col": 0, "id": 109},
    {"name": "maga", "row": 2, "col": 1, "id": 110},
    {"name": "bitcoin", "row": 2, "col": 3, "id": 111},
    {"name": "feelsgood", "row": 2, "col": 4, "id": 112},
    {"name": "neet", "row": 2, "col": 5, "id": 113},

    # Row 3: More
    {"name": "diamond", "row": 3, "col": 0, "id": 114},
    {"name": "moneybag", "row": 3, "col": 1, "id": 115},
    {"name": "npc", "row": 3, "col": 2, "id": 116},
    {"name": "card", "row": 3, "col": 4, "id": 117},
]

for sprite in chad_sprites:
    x = sprite["col"] * CHAD_CELL_W
    y = sprite["row"] * CHAD_CELL_H
    filename = f"meme_chad_{sprite['name']}.png"
    cut_sprite(chad_img, x, y, CHAD_CELL_W, CHAD_CELL_H, filename)
    manifest["symbols"][f"meme_chad_{sprite['name']}"] = {
        "id": sprite["id"],
        "name": sprite["name"],
        "category": "meme_chad",
        "file": f"/slots/symbols/{filename}",
        "rarity": "rare" if sprite["name"] in ["bitcoin", "diamond", "stonks"] else "uncommon"
    }

chad_img.close()

# ============ DOGE ACTIONS ============
print("\n=== Cutting Doge Sprites ===")
doge_img = Image.open(os.path.join(SPRITESHEET_DIR, "shiba-shopping.png"))
DOGE_CELL_W = 704
DOGE_CELL_H = 384

doge_sprites = [
    {"name": "cart", "row": 0, "col": 0, "id": 200},
    {"name": "shelf", "row": 0, "col": 1, "id": 201},
    {"name": "basket", "row": 0, "col": 2, "id": 202},
    {"name": "avocado", "row": 0, "col": 3, "id": 203},

    {"name": "bakery", "row": 1, "col": 0, "id": 204},
    {"name": "steak", "row": 1, "col": 1, "id": 205},
    {"name": "bananas", "row": 1, "col": 2, "id": 206},
    {"name": "hotsauce", "row": 1, "col": 3, "id": 207},

    {"name": "employee", "row": 2, "col": 0, "id": 208},
    {"name": "checkout", "row": 2, "col": 1, "id": 209},
    {"name": "card", "row": 2, "col": 2, "id": 210},
    {"name": "bags", "row": 2, "col": 3, "id": 211},

    {"name": "walking", "row": 3, "col": 0, "id": 212},
    {"name": "car", "row": 3, "col": 1, "id": 213},
    {"name": "kitchen", "row": 3, "col": 2, "id": 214},
    {"name": "stonks", "row": 3, "col": 3, "id": 215},
]

for sprite in doge_sprites:
    x = sprite["col"] * DOGE_CELL_W
    y = sprite["row"] * DOGE_CELL_H
    filename = f"meme_doge_{sprite['name']}.png"
    cut_sprite(doge_img, x, y, DOGE_CELL_W, DOGE_CELL_H, filename)
    manifest["symbols"][f"meme_doge_{sprite['name']}"] = {
        "id": sprite["id"],
        "name": sprite["name"],
        "category": "meme_doge",
        "file": f"/slots/symbols/{filename}",
        "rarity": "rare" if sprite["name"] in ["stonks", "steak"] else "uncommon"
    }

doge_img.close()

# ============ PEPE SHOPPING ============
print("\n=== Cutting Pepe Sprites ===")
pepe_img = Image.open(os.path.join(SPRITESHEET_DIR, "pepefrog-shopping.png"))

pepe_sprites = [
    {"name": "cart", "row": 0, "col": 0, "id": 300},
    {"name": "shelf", "row": 0, "col": 1, "id": 301},
    {"name": "basket", "row": 0, "col": 2, "id": 302},
    {"name": "avocado", "row": 0, "col": 3, "id": 303},

    {"name": "bakery", "row": 1, "col": 0, "id": 304},
    {"name": "steak", "row": 1, "col": 1, "id": 305},
    {"name": "bananas", "row": 1, "col": 2, "id": 306},
    {"name": "hotsauce", "row": 1, "col": 3, "id": 307},

    {"name": "employee", "row": 2, "col": 0, "id": 308},
    {"name": "checkout", "row": 2, "col": 1, "id": 309},
    {"name": "card", "row": 2, "col": 2, "id": 310},
    {"name": "bags", "row": 2, "col": 3, "id": 311},

    {"name": "walking", "row": 3, "col": 0, "id": 312},
    {"name": "car", "row": 3, "col": 1, "id": 313},
    {"name": "kitchen", "row": 3, "col": 2, "id": 314},
    {"name": "stonks", "row": 3, "col": 3, "id": 315},
]

for sprite in pepe_sprites:
    x = sprite["col"] * DOGE_CELL_W  # Same grid as doge
    y = sprite["row"] * DOGE_CELL_H
    filename = f"meme_pepe_{sprite['name']}.png"
    cut_sprite(pepe_img, x, y, DOGE_CELL_W, DOGE_CELL_H, filename)
    manifest["symbols"][f"meme_pepe_{sprite['name']}"] = {
        "id": sprite["id"],
        "name": sprite["name"],
        "category": "meme_pepe",
        "file": f"/slots/symbols/{filename}",
        "rarity": "epic" if sprite["name"] in ["stonks", "steak"] else "rare"
    }

pepe_img.close()

# ============ COOLCAT SHOPPING ============
print("\n=== Cutting Cool Cat Sprites ===")
cat_img = Image.open(os.path.join(SPRITESHEET_DIR, "coolcat-shopping.png"))

cat_sprites = [
    {"name": "cart", "row": 0, "col": 0, "id": 400},
    {"name": "shelf", "row": 0, "col": 1, "id": 401},
    {"name": "basket", "row": 0, "col": 2, "id": 402},
    {"name": "checkout", "row": 2, "col": 1, "id": 403},
    {"name": "card", "row": 2, "col": 2, "id": 404},
    {"name": "stonks", "row": 3, "col": 3, "id": 405},
]

for sprite in cat_sprites:
    x = sprite["col"] * DOGE_CELL_W
    y = sprite["row"] * DOGE_CELL_H
    filename = f"meme_cat_{sprite['name']}.png"
    cut_sprite(cat_img, x, y, DOGE_CELL_W, DOGE_CELL_H, filename)
    manifest["symbols"][f"meme_cat_{sprite['name']}"] = {
        "id": sprite["id"],
        "name": sprite["name"],
        "category": "meme_cat",
        "file": f"/slots/symbols/{filename}",
        "rarity": "rare"
    }

cat_img.close()

# ============ SAVE MANIFEST ============
print("\n=== Saving Manifest ===")
os.makedirs(os.path.dirname(MANIFEST_PATH), exist_ok=True)
with open(MANIFEST_PATH, 'w') as f:
    json.dump(manifest, f, indent=2)
print(f"Saved manifest to: {MANIFEST_PATH}")

# Summary
print(f"\n=== COMPLETE ===")
print(f"Total symbols cut: {len(manifest['symbols'])}")
print(f"Output directory: {OUTPUT_DIR}")
print(f"Manifest: {MANIFEST_PATH}")
