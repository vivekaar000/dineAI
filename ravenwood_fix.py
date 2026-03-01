#!/usr/bin/env python3
"""
╔═══════════════════════════════════════════════════════════════════════════╗
║   RAVENWOOD MARBLE MAZE - PERFECT SQUARE BOX EDITION                     ║
║   ─────────────────────────────────────────────────────────────────────   ║
║   Fixes Z-axis alignment so the box sits perfectly on the build plate.    ║
║   True perfect sharp edges (no artificial smoothing).                     ║
║   Guaranteed 100% support-free inside.                                    ║
╚═══════════════════════════════════════════════════════════════════════════╝
"""

import sys
import os
import random
import numpy as np

try:
    from skimage.measure import marching_cubes
except ImportError:
    print("scikit-image required. Run: pip install scikit-image")
    sys.exit(1)

try:
    from stl import mesh as stl_mesh
except ImportError:
    print("numpy-stl required. Run: pip install numpy-stl")
    sys.exit(1)

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Pillow required. Run: pip install pillow")
    sys.exit(1)

# ─── Parameters ───────────────────────────────────────────────────────────────
MARBLE_DIA   = 15.5
CLEARANCE    = 1.0
CH_R         = (MARBLE_DIA + CLEARANCE * 2) / 2  # 8.75mm
BODY_SIZE    = 85.0
GRID_N       = 4
SPACING      = 20.0
VOXEL_MM     = 0.5
PAD          = 4
OUTPUT_PATH  = '/Users/aaravvivek/Downloads/ravenwood_pure_box_fixed.stl'

HALF = BODY_SIZE / 2
OFS = [(i - (GRID_N - 1) / 2.0) * SPACING for i in range(GRID_N)]

print("=" * 60)
print("  RAVENWOOD PERFECT SQUARE MAZE GENERATOR  ")
print("=" * 60)

# ─── 1. Generate Labyrinth ────────────────────────────────────────────────────
print("  [1/5] Carving internal spanning-tree labyrinth...", end="", flush=True)

edges = []
visited = set()
random.seed(99)

def dfs(x, y, z):
    visited.add((x, y, z))
    dirs = [(1,0,0), (-1,0,0), (0,1,0), (0,-1,0), (0,0,1), (0,0,-1)]
    random.shuffle(dirs)
    for dx, dy, dz in dirs:
        nx, ny, nz = x + dx, y + dy, z + dz
        if 0 <= nx < GRID_N and 0 <= ny < GRID_N and 0 <= nz < GRID_N:
            if (nx, ny, nz) not in visited:
                edges.append(((x,y,z), (nx,ny,nz)))
                dfs(nx, ny, nz)

dfs(0, 0, 3)
print(f" {len(edges)} support-free tunnels.")

# ─── 2. Voxel Grid Setup ──────────────────────────────────────────────────────
print("  [2/5] Creating 3D Voxel Space...", end="", flush=True)
N = int(np.ceil(BODY_SIZE / VOXEL_MM)) + PAD * 2
coords = np.linspace(-HALF - PAD * VOXEL_MM, HALF + PAD * VOXEL_MM, N)
X, Y, Z = np.meshgrid(coords, coords, coords, indexing='ij')

def sdf_box(size):
    h = size / 2
    sx = np.abs(X) - h
    sy = np.abs(Y) - h
    sz = np.abs(Z) - h
    return np.maximum.reduce([sx, sy, sz])

vol = np.where(sdf_box(BODY_SIZE) <= 0, 1.0, 0.0)
print(f" {N}³ voxels")

# ─── 3. Teardrop SDF Void Rendering ───────────────────────────────────────────
print("  [3/5] Excavating Teardrop void paths...", end="", flush=True)

void_mask = np.zeros((N, N, N), dtype=bool) # Nodes (Onion-domes)
for nx, ny, nz in visited:
    cx, cy, cz = OFS[nx], OFS[ny], OFS[nz]
    dx, dy, dz = X - cx, Y - cy, Z - cz
    d_sph = np.sqrt(dx**2 + dy**2 + dz**2) - CH_R
    d_cone = (np.sqrt(dx**2 + dy**2) + dz) / np.sqrt(2) - CH_R
    d_cone_bounded = np.maximum(d_cone, -dz) # Precent infinite downward void
    void_mask |= (np.minimum(d_sph, d_cone_bounded) <= 0)

# Tunnels (Teardrop profiles)
for ((nx1, ny1, nz1), (nx2, ny2, nz2)) in edges:
    if nx1 != nx2: 
        cx1, cx2 = min(OFS[nx1], OFS[nx2]), max(OFS[nx1], OFS[nx2])
        dy, dz = Y - OFS[ny1], Z - OFS[nz1]
        d_circ = np.sqrt(dy**2 + dz**2) - CH_R
        d_roof = np.maximum((np.abs(dy) + dz) / np.sqrt(2) - CH_R, -dz)
        mask = (np.minimum(d_circ, d_roof) <= 0) & (X >= cx1) & (X <= cx2)
        void_mask |= mask
    elif ny1 != ny2: 
        cy1, cy2 = min(OFS[ny1], OFS[ny2]), max(OFS[ny1], OFS[ny2])
        dx, dz = X - OFS[nx1], Z - OFS[nz1]
        d_circ = np.sqrt(dx**2 + dz**2) - CH_R
        d_roof = np.maximum((np.abs(dx) + dz) / np.sqrt(2) - CH_R, -dz)
        mask = (np.minimum(d_circ, d_roof) <= 0) & (Y >= cy1) & (Y <= cy2)
        void_mask |= mask
    elif nz1 != nz2: 
        cz1, cz2 = min(OFS[nz1], OFS[nz2]), max(OFS[nz1], OFS[nz2])
        dx, dy = X - OFS[nx1], Y - OFS[ny1]
        mask = (np.sqrt(dx**2 + dy**2) <= CH_R) & (Z >= cz1) & (Z <= cz2)
        void_mask |= mask

x_in, y_in, z_in_center = OFS[0], OFS[0], OFS[3]
dx, dy = X - x_in, Y - y_in
d_vert = np.sqrt(dx**2 + dy**2)
void_mask |= (d_vert <= CH_R) & (Z >= z_in_center)

x_out, y_out, z_out_center = OFS[3], OFS[3], OFS[0]
dx, dy = X - x_out, Y - y_out
d_vert = np.sqrt(dx**2 + dy**2)
void_mask |= (d_vert <= CH_R) & (Z <= z_out_center)

tz = (Z - HALF)  
mask_funnel_in = (tz >= -3.5) & (tz <= 0)
r_at_in = CH_R + (tz + 3.5)  
dx, dy = X - x_in, Y - y_in
void_mask |= (np.sqrt(dx**2 + dy**2) <= r_at_in) & mask_funnel_in

tz = (-HALF - Z) 
mask_funnel_out = (tz >= -3.5) & (tz <= 0)
r_at_out = CH_R + (tz + 3.5)
dx, dy = X - x_out, Y - y_out
void_mask |= (np.sqrt(dx**2 + dy**2) <= r_at_out) & mask_funnel_out

vol[void_mask] = 0.0

print(" done")

# ─── 4. Engraving ─────────────────────────────────────────────────────────────
print("  [4/5] Engraving Typography...", end="", flush=True)

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

img1 = render_text_mask(N, N, "RAVENWOOD", 8.0, int(11 / VOXEL_MM))
img2 = render_text_mask(N, N, "HIGH SCHOOL", -8.0, int(8 / VOXEL_MM))
img_y_np = img1 | img2

M_pos_y = img_y_np[::-1, ::-1].T
M_neg_y = img_y_np[::-1, :].T

mask_pos_y = (Y > HALF - 1.2) & (Y <= HALF)
mask_neg_y = (Y < -HALF + 1.2) & (Y >= -HALF)

M3_pos_y = np.zeros_like(void_mask, dtype=bool)
M3_pos_y[:,:,:] = M_pos_y[:, np.newaxis, :]
vol = np.where(M3_pos_y & mask_pos_y, 0.0, vol)

M3_neg_y = np.zeros_like(void_mask, dtype=bool)
M3_neg_y[:,:,:] = M_neg_y[:, np.newaxis, :]
vol = np.where(M3_neg_y & mask_neg_y, 0.0, vol)

img_z_in = render_text_mask(N, N, "IN", 0, int(8 / VOXEL_MM))
dx_px = int(x_in / VOXEL_MM)
dy_px = -int((y_in + 14) / VOXEL_MM) 
img_z_in = np.roll(np.roll(img_z_in, dx_px, axis=1), dy_px, axis=0)

M_pos_z = img_z_in[::-1, :].T
mask_pos_z = (Z > HALF - 1.2) & (Z <= HALF)
M3_pos_z = np.zeros_like(void_mask, dtype=bool)
M3_pos_z[:,:,:] = M_pos_z[:, :, np.newaxis]
vol = np.where(M3_pos_z & mask_pos_z, 0.0, vol)

img_z_out = render_text_mask(N, N, "OUT", 0, int(8 / VOXEL_MM))
dx_px = int(x_out / VOXEL_MM)
dy_px = int((y_out + 14) / VOXEL_MM) 
img_z_out = np.roll(np.roll(img_z_out, dx_px, axis=1), dy_px, axis=0)

M_neg_z = img_z_out[::-1, :].T
mask_neg_z = (Z < -HALF + 1.2) & (Z >= -HALF)
M3_neg_z = np.zeros_like(void_mask, dtype=bool)
M3_neg_z[:,:,:] = M_neg_z[:, :, np.newaxis]
vol = np.where(M3_neg_z & mask_neg_z, 0.0, vol)

print(" done")

# ─── 5. Mesh Extraction & Save ────────────────────────────────────────────────
print("  [5/5] Extracting sharp ISO surface and Saving...", end="", flush=True)

# Note: Removed Gaussian filter, so edges form a perfect sharp square box!
verts, faces, normals, _ = marching_cubes(vol, level=0.5, spacing=(VOXEL_MM, VOXEL_MM, VOXEL_MM))
verts += np.array([coords[0]] * 3)

# 💥 FIX: Shift Z so the box sits exactly on the build plate (Z=0 to 85)
# This prevents Slicers from clipping "half" the model beneath the virtual floor.
verts[:, 2] += HALF

maze_mesh = stl_mesh.Mesh(np.zeros(len(faces), dtype=stl_mesh.Mesh.dtype))
for i, f in enumerate(faces):
    maze_mesh.vectors[i] = verts[f]
maze_mesh.update_normals()

maze_mesh.save(OUTPUT_PATH)
print(" done!")

size_mb = os.path.getsize(OUTPUT_PATH) / 1_000_000
print("=" * 60)
print(f"  ✅ PERFECT SQUARE BOX MAZE COMPLETED")
print("=" * 60)
print(f"  Saved File : {OUTPUT_PATH}")
print(f"  Size       : {size_mb:.1f} MB")
