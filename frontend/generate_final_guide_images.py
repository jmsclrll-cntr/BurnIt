import os
from PIL import Image, ImageDraw, ImageFont
import numpy as np

USER_DIR = r'C:\Users\carlc\.gemini\antigravity\brain\53707382-21ca-439c-a5d3-7c58e6f8521b\.user_uploaded'
GUIDE_DIR = r'c:\BurnIt\frontend\public\guide'
os.makedirs(GUIDE_DIR, exist_ok=True)

# Fonts
font_bold = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 13)
font_bold_lg = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 14)
font_bold_sm = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 12)
font_regular = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 12)

# Colors
ORANGE = (255, 106, 26, 255)
ORANGE_GLOW = (255, 106, 26, 90)
WHITE = (255, 255, 255, 255)
DARK_BG = (22, 22, 27, 255)

def to_dark_mode(pil_img):
    img = pil_img.convert('RGB')
    arr = np.array(img, dtype=float)

    max_c = arr.max(axis=-1)
    min_c = arr.min(axis=-1)
    sat = max_c - min_c

    # Orange mask (preserve vivid orange)
    is_orange = (arr[:, :, 0] > 180) & (arr[:, :, 2] < 90) & (sat > 80)
    is_neutral = ~is_orange

    lum = arr.mean(axis=-1)
    L_in = lum[is_neutral]

    # Piecewise inversion
    L_out = np.piecewise(
        L_in,
        [L_in < 80, (L_in >= 80) & (L_in < 180), (L_in >= 180) & (L_in < 235), (L_in >= 235) & (L_in < 250), L_in >= 250],
        [
            lambda x: 242 - x * 0.35,         # dark text -> bright text
            lambda x: 210 - (x - 80) * 0.6,   # muted text -> light gray
            lambda x: 148 - (x - 180) * 1.8,  # gray pills/borders -> dark gray
            lambda x: 20 + (250 - x) * 0.45,  # cream background -> dark background (#141418)
            lambda x: 28 + (x - 250) * 0.8    # white card -> #1c1c22
        ]
    )

    new_arr = np.zeros_like(arr)
    new_arr[is_orange] = arr[is_orange]

    for c in range(3):
        channel = new_arr[:, :, c]
        channel[is_neutral] = np.clip(L_out * (0.96 + 0.04 * (c == 2)), 0, 255)
        new_arr[:, :, c] = channel

    return Image.fromarray(np.clip(new_arr, 0, 255).astype(np.uint8)).convert('RGBA')

# -------------------------------------------------------------
# STEP 1: im1 + highlight im2 (Exercise pills)
# -------------------------------------------------------------
def build_step1(base_img):
    im = base_img.copy()
    d = ImageDraw.Draw(im)

    rx0, ry0, rx1, ry1 = 486, 45, 868, 86
    # Rounded orange border around pills
    d.rounded_rectangle([rx0, ry0, rx1, ry1], radius=14, outline=ORANGE, width=3)
    d.rounded_rectangle([rx0-2, ry0-2, rx1+2, ry1+2], radius=16, outline=ORANGE_GLOW, width=2)

    # Callout badge below pills
    badge_text = 'Tap an exercise pill or leave Auto-detect on'
    bbox = font_bold.getbbox(badge_text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    bx0 = int((rx0 + rx1) / 2 - tw / 2 - 16)
    bx1 = int((rx0 + rx1) / 2 + tw / 2 + 16)
    by0 = ry1 + 8
    by1 = by0 + th + 14

    # Pointer triangle pointing UP to pills
    tri_mid = int((rx0 + rx1) / 2)
    d.polygon([(tri_mid - 7, by0), (tri_mid + 7, by0), (tri_mid, by0 - 7)], fill=ORANGE)
    d.rounded_rectangle([bx0, by0, bx1, by1], radius=8, fill=ORANGE)
    d.text((bx0 + 16, by0 + 7), badge_text, fill=WHITE, font=font_bold)
    return im

# -------------------------------------------------------------
# STEP 2: im3 + visualization to step away (6-8 ft away)
# -------------------------------------------------------------
def build_step2(base_img):
    im = base_img.copy()
    d = ImageDraw.Draw(im)

    cx0, cy0, cx1, cy1 = 166, 95, 681, 416
    d.rounded_rectangle([cx0, cy0, cx1, cy1], radius=16, outline=ORANGE, width=3)
    d.rounded_rectangle([cx0-2, cy0-2, cx1+2, cy1+2], radius=18, outline=ORANGE_GLOW, width=2)

    # Viewfinder corner brackets inside camera viewport
    bracket_len = 26
    bw = 3
    # Top-Left
    d.line([(cx0 + 16, cy0 + 16), (cx0 + 16 + bracket_len, cy0 + 16)], fill=ORANGE, width=bw)
    d.line([(cx0 + 16, cy0 + 16), (cx0 + 16, cy0 + 16 + bracket_len)], fill=ORANGE, width=bw)
    # Top-Right
    d.line([(cx1 - 16, cy0 + 16), (cx1 - 16 - bracket_len, cy0 + 16)], fill=ORANGE, width=bw)
    d.line([(cx1 - 16, cy0 + 16), (cx1 - 16, cy0 + 16 + bracket_len)], fill=ORANGE, width=bw)
    # Bottom-Left
    d.line([(cx0 + 16, cy1 - 16), (cx0 + 16 + bracket_len, cy1 - 16)], fill=ORANGE, width=bw)
    d.line([(cx0 + 16, cy1 - 16), (cx0 + 16, cy1 - 16 - bracket_len)], fill=ORANGE, width=bw)
    # Bottom-Right
    d.line([(cx1 - 16, cy1 - 16), (cx1 - 16 - bracket_len, cy1 - 16)], fill=ORANGE, width=bw)
    d.line([(cx1 - 16, cy1 - 16), (cx1 - 16, cy1 - 16 - bracket_len)], fill=ORANGE, width=bw)

    # Distance indicator badge near the top of the camera viewport
    step2_text = '<-- Stand 6 to 8 ft away (Keep head to feet in frame) -->'
    bbox2 = font_bold.getbbox(step2_text)
    tw2 = bbox2[2] - bbox2[0]
    th2 = bbox2[3] - bbox2[1]
    s2_x0 = int((cx0 + cx1) / 2 - tw2 / 2 - 16)
    s2_x1 = int((cx0 + cx1) / 2 + tw2 / 2 + 16)
    s2_y0 = cy0 + 16
    s2_y1 = s2_y0 + th2 + 14

    d.rounded_rectangle([s2_x0, s2_y0, s2_x1, s2_y1], radius=8, fill=ORANGE)
    d.text((s2_x0 + 16, s2_y0 + 7), step2_text, fill=WHITE, font=font_bold)

    # Centered standing body outline guide in center
    mid_x = int((cx0 + cx1) / 2)
    # Head
    d.ellipse([mid_x - 10, cy0 + 68, mid_x + 10, cy0 + 88], outline=ORANGE, width=2)
    # Torso
    d.line([(mid_x, cy0 + 88), (mid_x, cy0 + 140)], fill=ORANGE, width=2)
    # Arms
    d.line([(mid_x - 22, cy0 + 105), (mid_x + 22, cy0 + 105)], fill=ORANGE, width=2)
    # Legs
    d.line([(mid_x, cy0 + 140), (mid_x - 16, cy0 + 185)], fill=ORANGE, width=2)
    d.line([(mid_x, cy0 + 140), (mid_x + 16, cy0 + 185)], fill=ORANGE, width=2)

    # Distance label right below person
    dist_label = '6 - 8 FEET'
    bl = font_bold_sm.getbbox(dist_label)
    dl_w = bl[2] - bl[0]
    dl_x = int(mid_x - dl_w / 2)
    d.text((dl_x, cy0 + 192), dist_label, fill=ORANGE, font=font_bold_sm)

    return im

# -------------------------------------------------------------
# STEP 3: im1 + highlight im4 (Finish & predict calories)
# -------------------------------------------------------------
def build_step3(base_img):
    im = base_img.copy()
    d = ImageDraw.Draw(im)

    fx0, fy0, fx1, fy1 = 702, 372, 845, 406
    d.rounded_rectangle([fx0, fy0, fx1, fy1], radius=10, outline=ORANGE, width=3)
    d.rounded_rectangle([fx0-2, fy0-2, fx1+2, fy1+2], radius=12, outline=ORANGE_GLOW, width=2)

    # Callout badge below the button
    step3_text = 'Tap when your last repetition is done'
    bbox3 = font_bold.getbbox(step3_text)
    tw3 = bbox3[2] - bbox3[0]
    th3 = bbox3[3] - bbox3[1]
    s3_x0 = int((fx0 + fx1) / 2 - tw3 / 2 - 14)
    s3_x1 = int((fx0 + fx1) / 2 + tw3 / 2 + 14)
    s3_y0 = fy1 + 8
    s3_y1 = s3_y0 + th3 + 12

    tri_btn = int((fx0 + fx1) / 2)
    d.polygon([(tri_btn - 6, s3_y0), (tri_btn + 6, s3_y0), (tri_btn, s3_y0 - 6)], fill=ORANGE)
    d.rounded_rectangle([s3_x0, s3_y0, s3_x1, s3_y1], radius=7, fill=ORANGE)
    d.text((s3_x0 + 14, s3_y0 + 6), step3_text, fill=WHITE, font=font_bold)
    return im

# -------------------------------------------------------------
# STEP 4: im5 (Workout complete modal)
# -------------------------------------------------------------
def build_step4(base_img):
    im = base_img.copy()
    d = ImageDraw.Draw(im)

    mx0, my0, mx1, my1 = 390, 100, 635, 405
    d.rounded_rectangle([mx0-2, my0-2, mx1+2, my1+2], radius=14, outline=ORANGE, width=3)
    d.rounded_rectangle([mx0-4, my0-4, mx1+4, my1+4], radius=16, outline=ORANGE_GLOW, width=2)

    # Callout badge above modal
    step4_text = 'Session summary: kcal burned & duration logged'
    bbox4 = font_bold.getbbox(step4_text)
    tw4 = bbox4[2] - bbox4[0]
    th4 = bbox4[3] - bbox4[1]
    s4_x0 = int((mx0 + mx1) / 2 - tw4 / 2 - 14)
    s4_x1 = int((mx0 + mx1) / 2 + tw4 / 2 + 14)
    s4_y0 = my0 - th4 - 18
    s4_y1 = my0 - 8

    tri_m = int((mx0 + mx1) / 2)
    d.polygon([(tri_m - 6, s4_y1), (tri_m + 6, s4_y1), (tri_m, s4_y1 + 6)], fill=ORANGE)
    d.rounded_rectangle([s4_x0, s4_y0, s4_x1, s4_y1], radius=7, fill=ORANGE)
    d.text((s4_x0 + 14, s4_y0 + 5), step4_text, fill=WHITE, font=font_bold)
    return im

def main():
    im1_raw = Image.open(os.path.join(USER_DIR, 'media_1794834295383_e315dbe6.png')).convert('RGBA')
    im3_raw = Image.open(os.path.join(USER_DIR, 'media_1794834360201_f3e5c043.png')).convert('RGBA')
    im5_raw = Image.open(os.path.join(USER_DIR, 'media_1794834464572_5d5efcf6.png')).convert('RGBA')

    # 1. Light mode builds
    s1_light = build_step1(im1_raw)
    s2_light = build_step2(im3_raw)
    s3_light = build_step3(im1_raw)
    s4_light = build_step4(im5_raw)

    s1_light.save(os.path.join(GUIDE_DIR, 'actual_step1_select_light.png'), optimize=True)
    s2_light.save(os.path.join(GUIDE_DIR, 'actual_step2_camera_light.png'), optimize=True)
    s3_light.save(os.path.join(GUIDE_DIR, 'actual_step3_finish_light.png'), optimize=True)
    s4_light.save(os.path.join(GUIDE_DIR, 'actual_step4_summary_light.png'), optimize=True)
    print('Saved all 4 light mode images')

    # 2. Dark mode builds
    im1_dark_base = to_dark_mode(im1_raw)
    im3_dark_base = to_dark_mode(im3_raw)
    im5_dark_base = to_dark_mode(im5_raw)

    s1_dark = build_step1(im1_dark_base)
    s2_dark = build_step2(im3_dark_base)
    s3_dark = build_step3(im1_dark_base)
    s4_dark = build_step4(im5_dark_base)

    s1_dark.save(os.path.join(GUIDE_DIR, 'actual_step1_select_dark.png'), optimize=True)
    s2_dark.save(os.path.join(GUIDE_DIR, 'actual_step2_camera_dark.png'), optimize=True)
    s3_dark.save(os.path.join(GUIDE_DIR, 'actual_step3_finish_dark.png'), optimize=True)
    s4_dark.save(os.path.join(GUIDE_DIR, 'actual_step4_summary_dark.png'), optimize=True)
    print('Saved all 4 dark mode images')

if __name__ == '__main__':
    main()

