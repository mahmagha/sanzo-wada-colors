#!/usr/bin/env python3
"""Bake tileable fabric maps (normal + AO/roughness/tint) from a procedural yarn model.

This does what a Blender bake does, in plain numpy: build a height field of real yarn
geometry (round yarns that go over and under each other, twist, slubs, fuzz), then derive
a tangent-space normal map, ambient occlusion, roughness and a per-thread tint map.

  pip install numpy pillow
  python3 scripts/bake-fabric-maps.py

Writes src/assets/fabrics/<fabric>-n.png (normal) and <fabric>-o.png
(R = ambient occlusion, G = roughness, B = per-thread tint). All maps tile seamlessly.
"""
import os

import numpy as np
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'assets', 'fabrics')
PX = 24  # pixels per thread in the bake


def warp_on_top(pattern, x, y):
    if pattern == 'plain':
        return (x + y) % 2 == 0
    if pattern == 'twill':
        return (x + y) % 4 < 2
    if pattern == 'twill31':
        return (x + y) % 4 != 0
    if pattern == 'satin':
        return (x * 2) % 5 != y % 5
    raise ValueError(pattern)


def smoothstep(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def periodic_noise(rng, n, cutoff, amp=1.0):
    """Tileable 2D noise (low-pass filtered white noise), roughly zero mean, unit std * amp."""
    w = rng.standard_normal((n, n))
    f = np.fft.fft2(w)
    fy = np.fft.fftfreq(n)[:, None] * n
    fx = np.fft.fftfreq(n)[None, :] * n
    r = np.sqrt(fx**2 + fy**2)
    f *= np.exp(-((r / cutoff) ** 2))
    out = np.real(np.fft.ifft2(f))
    out -= out.mean()
    out /= out.std() + 1e-9
    return out * amp


def sines_1d(rng, count, n, max_cycles=6):
    """Periodic 1D signals (one per thread) built from integer-cycle sines over n samples."""
    t = np.arange(n) / n
    sig = np.zeros((count, n))
    for k in range(count):
        for c in range(1, max_cycles + 1):
            sig[k] += rng.uniform(0.3, 1) / c * np.sin(2 * np.pi * (c * t + rng.uniform()))
        sig[k] /= sig[k].std() + 1e-9
    return sig


def bake_woven(name, pattern, k, p):
    rng = np.random.default_rng(p.get('seed', 1))
    n = k * PX
    ys, xs = np.mgrid[0:n, 0:n]
    xf = (xs + 0.5) / PX  # position in thread units
    yf = (ys + 0.5) / PX
    ti = np.floor(xf).astype(int) % k  # warp thread index (columns)
    tj = np.floor(yf).astype(int) % k  # weft thread index (rows)
    u = (xf % 1.0) * 2 - 1  # across a warp thread
    v = (yf % 1.0) * 2 - 1  # across a weft thread

    # over/under level of each crossing: +1 warp over, -1 warp under
    lv = np.array([[1.0 if warp_on_top(pattern, i, j) else -1.0 for i in range(k)] for j in range(k)])  # [j][i]

    def interp_level(axis_pos, fixed_idx, axis):
        """Smoothly interpolate crossing levels along a thread, between crossing centres."""
        c = axis_pos - 0.5
        i0 = np.floor(c).astype(int)
        t = smoothstep(c - i0)
        a = i0 % k
        b = (i0 + 1) % k
        if axis == 'y':  # moving along a warp thread (varying row j), fixed column i
            return lv[a, fixed_idx] * (1 - t) + lv[b, fixed_idx] * t
        return lv[fixed_idx, a] * (1 - t) + lv[fixed_idx, b] * t  # along a weft (varying i), fixed row j

    z_warp = interp_level(yf, ti, 'y')
    z_weft = -interp_level(xf, tj, 'x')

    # yarn radius per thread, with slubs (thickness changing along the yarn)
    t_idx = np.arange(n) / n
    radius_w = np.ones((n, n))
    radius_f = np.ones((n, n))
    if p['slub'] > 0:
        sw = sines_1d(rng, k, n)  # per warp thread, along y
        sf = sines_1d(rng, k, n)  # per weft thread, along x
        radius_w = 1 + p['slub'] * sw[ti, ys]
        radius_f = 1 + p['slub'] * sf[tj, xs]
    thick_w = 1 + p['thick_var'] * (rng.uniform(-1, 1, k))[ti]
    thick_f = 1 + p['thick_var'] * (rng.uniform(-1, 1, k))[tj]
    rw = p['radius'] * thick_w * radius_w
    rf = p['radius'] * thick_f * radius_f

    prof_w = np.sqrt(np.clip(1 - u**2, 0, 1)) ** 0.85
    prof_f = np.sqrt(np.clip(1 - v**2, 0, 1)) ** 0.85
    # yarn twist: fine diagonal ridges along the yarn
    twist_w = 1 + p['twist'] * np.sin(2 * np.pi * (yf * p['twist_freq'] + u * 0.9))
    twist_f = 1 + p['twist'] * np.sin(2 * np.pi * (xf * p['twist_freq'] + v * 0.9))

    h_warp = z_warp * p['arch'] + prof_w * rw * twist_w
    h_weft = z_weft * p['arch'] + prof_f * rf * twist_f
    # warp yarns that dip under a weft are hidden by the weft: use a smooth max
    s = 10.0
    h = np.log(np.exp(s * h_warp) + np.exp(s * h_weft)) / s

    # fuzz / fibre noise
    if p['fuzz'] > 0:
        h += periodic_noise(rng, n, n / 6, p['fuzz'] * 0.5)
        h += periodic_noise(rng, n, n / 2.2, p['fuzz'] * 0.3)

    # per-thread tint, taken from whichever yarn is on top
    tint_w = rng.uniform(-1, 1, k)[ti]
    tint_f = rng.uniform(-1, 1, k)[tj] - p['weft_dark']
    top_is_warp = h_warp >= h_weft
    tint = np.where(top_is_warp, tint_w, tint_f) * p['tint'] * 0.5 + 0.5
    tint = np.clip(tint + periodic_noise(rng, n, n / 8, 0.04), 0, 1)

    # shading maps
    hn = (h - h.min()) / (h.max() - h.min() + 1e-9)
    ao = np.clip(0.35 + 0.75 * hn, 0, 1) ** 1.1
    crest = np.where(top_is_warp, prof_w, prof_f)
    rough = np.clip(p['rough'] - p['rough_crest'] * crest + periodic_noise(rng, n, n / 10, 0.03), 0.05, 1)
    save(name, h, ao, rough, tint, p['normal_strength'])


def bake_leather(name, p):
    rng = np.random.default_rng(p.get('seed', 5))
    n = 256
    pts = 60
    feat = rng.uniform(0, n, (pts, 2))
    ys, xs = np.mgrid[0:n, 0:n]
    d1 = np.full((n, n), 1e9)
    d2 = np.full((n, n), 1e9)
    for ox in (-n, 0, n):
        for oy in (-n, 0, n):
            for fx, fy in feat:
                d = np.hypot(xs - (fx + ox), ys - (fy + oy))
                d2 = np.minimum(d2, np.maximum(d1, d))
                d1 = np.minimum(d1, d)
    edge = np.clip((d2 - d1) / 14.0, 0, 1)  # 0 on the crease between pebbles
    h = smoothstep(edge) * 0.9 + periodic_noise(rng, n, n / 3, 0.05)
    h += periodic_noise(rng, n, n / 40, 0.08)
    hn = (h - h.min()) / (h.max() - h.min() + 1e-9)
    ao = 0.45 + 0.55 * smoothstep(edge)
    rough = np.clip(p['rough'] - 0.2 * smoothstep(edge) + periodic_noise(rng, n, n / 20, 0.03), 0.05, 1)
    tint = np.clip(0.5 + periodic_noise(rng, n, n / 14, 0.18), 0, 1)
    save(name, h * 1.0, ao, rough, tint, p['normal_strength'])


def save(name, h, ao, rough, tint, strength):
    os.makedirs(OUT, exist_ok=True)
    # periodic gradient
    dx = (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) * 0.5
    dy = (np.roll(h, -1, axis=0) - np.roll(h, 1, axis=0)) * 0.5
    nx, ny, nz = -dx * strength, -dy * strength, np.ones_like(h)
    ln = np.sqrt(nx**2 + ny**2 + nz**2)
    nrm = np.stack([nx / ln, ny / ln, nz / ln], axis=-1)
    Image.fromarray(((nrm * 0.5 + 0.5) * 255).round().astype(np.uint8), 'RGB').save(
        os.path.join(OUT, f'{name}-n.png'), optimize=True
    )
    orm = np.stack([ao, rough, tint], axis=-1)
    Image.fromarray((np.clip(orm, 0, 1) * 255).round().astype(np.uint8), 'RGB').save(
        os.path.join(OUT, f'{name}-o.png'), optimize=True
    )
    print(name, h.shape)


COMMON = dict(radius=0.9, arch=0.35, thick_var=0.06, slub=0, twist=0.0, twist_freq=1.0, fuzz=0.0, tint=0.5,
              weft_dark=0.1, rough=0.9, rough_crest=0.15, normal_strength=7.0)

if __name__ == '__main__':
    bake_woven('cotton', 'plain', 8, dict(COMMON, seed=1, twist=0.05, twist_freq=1.2, fuzz=0.012, tint=0.45))
    bake_woven('wool', 'twill', 8, dict(COMMON, seed=2, radius=1.0, arch=0.25, twist=0.1, twist_freq=1.6, fuzz=0.07,
                                         tint=0.7, rough=0.97, rough_crest=0.05, normal_strength=6.0))
    bake_woven('linen', 'plain', 12, dict(COMMON, seed=3, radius=0.85, arch=0.3, thick_var=0.18, slub=0.35, twist=0.05,
                                           fuzz=0.025, tint=0.8, rough=0.88, normal_strength=7.5))
    bake_woven('denim', 'twill31', 8, dict(COMMON, seed=4, radius=0.95, arch=0.3, twist=0.1, twist_freq=1.4,
                                            fuzz=0.025, tint=0.6, weft_dark=-0.9, rough=0.88, normal_strength=7.5))
    bake_woven('silk', 'satin', 10, dict(COMMON, seed=6, radius=0.8, arch=0.12, thick_var=0.02, twist=0.0, fuzz=0.0,
                                          tint=0.2, rough=0.32, rough_crest=0.12, normal_strength=4.0))
    bake_leather('leather', dict(seed=5, rough=0.5, normal_strength=5.5))
