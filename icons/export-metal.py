"""Export the selected metallic concept; keep the original flat icons intact."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent
source = Image.open(root / 'metal-source.png').convert('RGBA')
for size in (16, 32, 48, 128):
    source.resize((size, size), Image.Resampling.LANCZOS).save(root / f'metal{size}.png')

preview = Image.new('RGB', (680, 230), '#f5f5f5')
draw = ImageDraw.Draw(preview)
draw.rectangle((340, 0, 680, 230), fill='#202124')
font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 14)
for offset, color, label in ((0, '#303134', 'Light toolbar'), (340, '#f1f3f4', 'Dark toolbar')):
    draw.text((offset + 20, 15), label, font=font, fill=color)
    for x, size in ((20, 16), (82, 32), (157, 48), (232, 96)):
        icon = source.resize((size, size), Image.Resampling.LANCZOS)
        preview.paste(icon, (offset+x, 64+(96-size)//2), icon)
        draw.text((offset+x, 174), f'{size}px', font=font, fill=color)
preview.save(root / 'metal-preview.png')
