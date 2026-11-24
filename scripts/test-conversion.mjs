export function oklchToRgb(L, C, h) {
  const rad = (h * Math.PI) / 180;
  const a = C * Math.cos(rad);
  const b = C * Math.sin(rad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const r_lin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g_lin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b_lin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const transfer = (c) =>
    c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(0, c), 1 / 2.4) - 0.055;

  const red = Math.min(255, Math.max(0, Math.round(transfer(r_lin) * 255)));
  const green = Math.min(255, Math.max(0, Math.round(transfer(g_lin) * 255)));
  const blue = Math.min(255, Math.max(0, Math.round(transfer(b_lin) * 255)));

  const hex = '#' + [red, green, blue].map((x) => x.toString(16).padStart(2, '0')).join('');
  return { rgb: [red, green, blue], hex };
}

console.log('Hermosa Pink calculated:', oklchToRgb(0.881, 0.0558, 1.03));
