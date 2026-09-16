"""Render the toolbar mark with Pillow: python icons/generate.py."""
from pathlib import Path
from math import cos, sin, radians
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
SCALE = 64

def curve(a, b, c, d):
    return [tuple((1-t)**3*a[j] + 3*(1-t)**2*t*b[j] +
                  3*(1-t)*t*t*c[j] + t**3*d[j] for j in (0, 1))
            for t in (i/128 for i in range(129))]

def render(size):
    im = Image.new('RGBA', (16*SCALE, 16*SCALE))
    draw = ImageDraw.Draw(im)
    draw.ellipse(tuple(round(v*SCALE) for v in (.25,.25,15.75,15.75)),
                 fill='#202124')
    # Two clockwise arrows; broad strokes remain distinct at 16 pixels.
    for start in (205,25):
        arc = [(8+6*cos(radians(a)),8+6*sin(radians(a)))
               for a in (start+i*130/128 for i in range(129))]
        draw.line([(round(x*SCALE),round(y*SCALE)) for x,y in arc],
                  fill='#ff665c',width=round(1.5*SCALE),joint='curve')
        x,y = arc[-1]
        angle = radians(start+130)
        tx,ty = -sin(angle),cos(angle)
        nx,ny = cos(angle),sin(angle)
        head = [(x+tx*1.35,y+ty*1.35),
                (x-tx*.9+nx*1.55,y-ty*.9+ny*1.55),
                (x-tx*.9-nx*1.55,y-ty*.9-ny*1.55)]
        draw.polygon([(round(a*SCALE),round(b*SCALE)) for a,b in head],fill='#ff665c')
    points = [(10.25,5.2),(7.3,5.2)]
    points += curve((7.3,5.2),(5.2,5.2),(5.2,7.45),(7.3,7.8))
    points += [(8.7,8.2)]
    points += curve((8.7,8.2),(10.8,8.55),(10.8,10.8),(8.7,10.8))
    points += [(5.75,10.8)]
    draw.line([(round(x*SCALE),round(y*SCALE)) for x,y in points],
              fill='white', width=round(1.65*SCALE), joint='curve')
    return im.resize((size,size), Image.Resampling.LANCZOS)

for size in (16,32,48,128):
    render(size).save(ROOT / f'icon{size}.png')

# Review the exact exported assets at native size on both toolbar backgrounds.
preview = Image.new('RGB',(720,300),'#f5f5f5')
d = ImageDraw.Draw(preview)
d.rectangle((360,0,720,300),fill='#202124')
font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',16)
for offset, color, label in ((0,'#303134','Light toolbar'),(360,'#f1f3f4','Dark toolbar')):
    d.text((offset+24,18),label,font=font,fill=color)
    for x,size in ((32,16),(100,32),(186,48)):
        preview.paste(render(size),(offset+x,66+(48-size)//2),render(size))
        d.text((offset+x,125),str(size)+' px',font=font,fill=color)
    preview.paste(render(96),(offset+32,178),render(96))
    d.text((offset+146,214),'S + refresh arrows',font=font,fill=color)
preview.save(ROOT / 'preview.png')
