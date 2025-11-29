#!/usr/bin/env python3
"""
Cut the new memecons sprite sheets into individual slot machine symbols.
All sheets are 4x4 grids.
"""

from PIL import Image
import os

# Source and destination paths
SOURCE_DIR = '/Users/soleilklosowski/Downloads/memecons/New Folder With Items'
DEST_DIR = '/Users/soleilklosowski/Downloads/EBTCard/TheEBTProgram/frontend/public/slots/symbols'

# Sprite sheet definitions (filename -> prefix)
SHEETS = {
    'Gemini_Generated_Image_lenx8mlenx8mlenx.png': 'coolcat',      # White cat with rainbow glasses
    'Gemini_Generated_Image_n3mhrrn3mhrrn3mh.png': 'shiba',        # Shiba with sunglasses
    'Gemini_Generated_Image_q6end0q6end0q6en.png': 'tabby',        # Tabby cat with sunglasses
    'Gemini_Generated_Image_ubm86dubm86dubm8.png': 'trump',        # Trump character
    'Gemini_Generated_Image_vvdrrkvvdrrkvvdr.png': 'pepefrog',     # Pepe frog with sunglasses (regular)
    'Gemini_Generated_Image_dhmlpddhmlpddhml.png': 'pepe',         # Special pepe actions sheet
}

# Position names for the regular 4x4 shopping sheets (same layout for all)
REGULAR_POSITIONS = [
    # Row 1
    'cart', 'store', 'basket', 'avocado',
    # Row 2
    'bakery', 'steak', 'bananas', 'sauces',
    # Row 3
    'linda', 'checkout', 'card', 'bags',
    # Row 4
    'shopping', 'car', 'kitchen', 'stonks',
]

# Position names for the special pepe actions sheet (different layout)
PEPE_POSITIONS = [
    # Row 1
    'cart', 'money', 'king', 'receipt',
    # Row 2
    'stonks', 'shopping', 'neet', 'atm',
    # Row 3
    'npc', 'maga', 'cope', 'moneybag',
    # Row 4
    'rich', 'feelsgood', 'bitcoin', 'diamond',
]

def cut_sprite_sheet(source_path, prefix, positions, grid_size=4):
    """Cut a sprite sheet into individual images."""
    img = Image.open(source_path)
    width, height = img.size

    cell_width = width // grid_size
    cell_height = height // grid_size

    print(f"Processing {prefix}: {width}x{height}, cell size: {cell_width}x{cell_height}")

    cut_count = 0
    for row in range(grid_size):
        for col in range(grid_size):
            idx = row * grid_size + col
            if idx >= len(positions):
                continue

            name = positions[idx]

            # Calculate crop box
            left = col * cell_width
            top = row * cell_height
            right = left + cell_width
            bottom = top + cell_height

            # Crop the cell
            cell = img.crop((left, top, right, bottom))

            # Save with consistent naming
            output_path = os.path.join(DEST_DIR, f'{prefix}_{name}.png')
            cell.save(output_path, 'PNG')
            cut_count += 1
            print(f"  Saved: {prefix}_{name}.png")

    return cut_count

def main():
    os.makedirs(DEST_DIR, exist_ok=True)

    total_cut = 0

    for filename, prefix in SHEETS.items():
        source_path = os.path.join(SOURCE_DIR, filename)

        if not os.path.exists(source_path):
            print(f"Warning: {filename} not found, skipping...")
            continue

        # Use special positions for the pepe actions sheet
        if prefix == 'pepe':
            positions = PEPE_POSITIONS
        else:
            positions = REGULAR_POSITIONS

        count = cut_sprite_sheet(source_path, prefix, positions)
        total_cut += count

    print(f"\nTotal symbols cut: {total_cut}")
    print(f"Output directory: {DEST_DIR}")

if __name__ == '__main__':
    main()
