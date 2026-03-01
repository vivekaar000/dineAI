#!/usr/bin/env python3
"""
Revolutionary Modular Marble Maze Generator - Ravenwood High School
Uses Signed Distance Functions (SDF) and Skimage Marching Cubes
Outputs multiple interlocking 3D tiles.
"""

import os
import sys
import numpy as np
from skimage.measure import marching_cubes
from stl import mesh as stl_mesh
from PIL import Image, ImageDraw, ImageFont

# ─── Configuration ───────────────
TILE_SIZE = 40.0
VOXEL_MM = 0.4
R_MARBLE = 15.5
CLEARANCE = 1.0
R_CH = (R_MARBLE + CLEARANCE*2) / 2 # 8.75mm
HALF = TILE_SIZE / 2
PAD = 10

N = int(np.ceil(TILE_SIZE / VOXEL_MM)) + PAD * 2
coords = np.linspace(-HALF - PAD * VOXEL_MM, HALF + PAD * VOXEL_MM, N)
X, Y, Z = np.meshgrid(coords, coords, coords, indexing='ij')

def get_void_mask():
    return np.zeros((N, N, N), dtype=bool)

def sdf_box(hs):
    return np.maximum.reduce([np.abs(X) - hs, np.abs(Y) - hs, np.abs(Z) - hs])

def add_interlocks(vol):
    """ Adds holes on top, pegs on bottom """
    C = 14.0 # Corner offset
    H_DEPTH = 3.0
    P_HEIGHT = 2.8 # slightly shorter than hole
    R_HOLE = 2.5
    R_PEG = 2.2
    
    # 4 corners
    for cx in [-C, C]:
        for cy in [-C, C]:
            d_cyl = np.sqrt((X - cx)**2 + (Y - cy)**2)
            # Hole on top
            void_mask = (d_cyl <= R_HOLE) & (Z > HALF - H_DEPTH)
            vol[void_mask] = 0.0
            # Peg on bottom
            peg_mask = (d_cyl <= R_PEG) & (Z >= -HALF - P_HEIGHT) & (Z <= -HALF)
            vol[peg_mask] = 1.0
    return vol

def generate_tile(name, void_mask, text=None):
    print(f"Generating {name}...")
    # Base Box
    vol = np.where(sdf_box(HALF) <= 0, 1.0, 0.0)
    
    # Apply void mask
    vol[void_mask] = 0.0
    
    # Add interlocks
    vol = add_interlocks(vol)
    
    if text:
        img1 = render_text_mask(N, N, text[0], 6, int(8 / VOXEL_MM))
        img2 = render_text_mask(N, N, text[1], -6, int(8 / VOXEL_MM))
        img = img1 | img2
        img = np.roll(img, int(0 / VOXEL_MM), axis=0) # centered
        M_neg_x = img[::-1, ::-1].T
        mask_neg_x = (X < -HALF + 1.2) & (X >= -HALF)
        M3 = np.zeros_like(void_mask, dtype=bool)
        M3[:,:,:] = M_neg_x[:, np.newaxis, :]
        vol = np.where(M3 & mask_neg_x, 0.0, vol)

    # Marching cubes
    verts, faces, normals, _ = marching_cubes(vol, level=0.5, spacing=(VOXEL_MM, VOXEL_MM, VOXEL_MM))
    verts += np.array([coords[0]] * 3)
    verts[:, 2] += HALF + 3.0 # Shift Z above 0
    
    mesh = stl_mesh.Mesh(np.zeros(len(faces), dtype=stl_mesh.Mesh.dtype))
    for i, f in enumerate(faces):
        mesh.vectors[i] = verts[f]
    mesh.update_normals()
    
    path = f"/Users/aaravvivek/Downloads/{name}.stl"
    mesh.save(path)
    print(f"Saved {path} ({os.path.getsize(path)/1e6:.2f} MB)")

def render_text_mask(w, h, txt, y_offset, font_size):
    img = Image.new('L', (w, h), 0)
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/Library/Fonts/Arial Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), txt, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x_px = (w - tw) // 2
    y_px = h//2 - int(y_offset / VOXEL_MM) - th//2
    draw.text((x_px, y_px), txt, font=font, fill=255)
    return np.array(img) > 128

# ─── Tile 1: Straight ───────────────
void1 = get_void_mask()
# Groove on top from Y=-HALF to Y=HALF
dx1 = X
dz1 = Z - HALF
d_circ1 = np.sqrt(dx1**2 + dz1**2) - R_CH
# Make it teardrop roof for support free (though it's on top so open to air)
void1 |= (d_circ1 <= 0) & (Z > HALF - R_CH)

generate_tile("tile_straight", void1)

# ─── Tile 2: Turn ───────────────
void2 = get_void_mask()
# Groove curving from (0, -HALF) to (HALF, 0). Center of torus at (HALF, -HALF)
dx2 = X - HALF
dy2 = Y + HALF
dz2 = Z - HALF
d_cyl2 = np.sqrt(dx2**2 + dy2**2) - HALF
d_torus = np.sqrt(d_cyl2**2 + dz2**2) - R_CH
void2 |= (d_torus <= 0) & (X <= HALF) & (Y >= -HALF) & (Z > HALF - R_CH)
generate_tile("tile_turn", void2)

# ─── Tile 3: Internal Drop ───────────────
void3 = get_void_mask()
# Enters from top Y=0. Drops internally and exits Front Y=HALF
# Vertical part: Top to Center
dx3 = X
dy3 = Y
mask_vert = (np.sqrt(dx3**2 + dy3**2) <= R_CH) & (Z >= 0)
void3 |= mask_vert

# Horizontal part: Center to Y=HALF
dz3 = Z
d_horiz = np.sqrt(dx3**2 + dz3**2) - R_CH
# Teardrop roof for horizontal part
d_roof = np.maximum((np.abs(dx3) + dz3) / np.sqrt(2) - R_CH, -dz3)
mask_horiz = (np.minimum(d_horiz, d_roof) <= 0) & (Y >= 0)
void3 |= mask_horiz

# Smooth Corner (Sphere at origin)
d_sph = np.sqrt(X**2 + Y**2 + Z**2) - R_CH
d_cone = (np.sqrt(X**2 + Y**2) + Z) / np.sqrt(2) - R_CH
mask_corner = (np.minimum(d_sph, np.maximum(d_cone, -Z)) <= 0) & (Y >= 0) & (Z >= 0)
void3 |= mask_corner

generate_tile("tile_drop", void3)

# ─── Tile 4: Base Spacer Engraved ───────────────
void4 = get_void_mask()
# Solid box, no void path.
generate_tile("tile_base", void4, text=("RAVENWOOD", "HIGH SCHOOL"))

print("All tiles generated successfully!")
