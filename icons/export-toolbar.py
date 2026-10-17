"""Export the toolbar refinement without changing the original metallic assets."""
from pathlib import Path
import json
import argparse
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--prefix', default='toolbar', choices=('toolbar', 'toolbar-v2'))
prefix = parser.parse_args().prefix
source = Image.open(root / f'{prefix}-source.png').convert('RGBA')
# Ignore near-transparent fringe when centering; never stretch either axis.
bounds = source.getchannel('A').point(lambda a: 255 if a > 16 else 0).getbbox()
assert bounds, 'Source must contain visible artwork'
source = source.crop(bounds)
sizes = (16, 20, 24, 28, 32, 40, 48, 64, 128)
for size in sizes:
    icon = Image.new('RGBA', (size, size))
    fitted = source.copy()
    fitted.thumbnail((size, size), Image.Resampling.LANCZOS)
    icon.alpha_composite(fitted, ((size-fitted.width)//2, (size-fitted.height)//2))
    icon.save(root / f'{prefix}{size}.png')

preview = Image.new('RGB', (760, 250), '#f5f5f5')
draw = ImageDraw.Draw(preview)
font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 14)
for offset, bg, fg in ((0, '#f5f5f5', '#202124'), (380, '#202124', '#f5f5f5')):
    draw.rectangle((offset, 0, offset+379, 249), fill=bg)
    draw.text((offset+16, 12), 'Original / refined at native pixel sizes', font=font, fill=fg)
    for i, size in enumerate((16, 20, 24, 28, 32, 48)):
        x = offset+18+i*58
        old = Image.open(root/'metal-source.png').convert('RGBA').resize((size,size), Image.Resampling.LANCZOS)
        new = Image.open(root/f'{prefix}{size}.png')
        preview.paste(old, (x, 58), old)
        preview.paste(new, (x, 125), new)
        draw.text((x, 190), str(size), font=font, fill=fg)
preview.save(root/f'{prefix}-preview.png')

manifest = json.loads((root.parent/'manifest.json').read_text())
for size, path in manifest['action']['default_icon'].items():
    with Image.open(root.parent/path) as icon:
        assert icon.size == (int(size), int(size))
        assert icon.mode == 'RGBA'
print('Exported and verified all toolbar sizes; original metallic assets preserved.')
