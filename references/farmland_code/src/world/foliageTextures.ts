import * as THREE from 'three';

/** 草叶贴图(带 alpha):用于草丛十字面片。 */
export function grassBladeTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  const blades = 14;
  for (let i = 0; i < blades; i++) {
    const x = 8 + Math.random() * (size - 16);
    const w = 3 + Math.random() * 4;
    const h = size * (0.55 + Math.random() * 0.4);
    const lean = (Math.random() - 0.5) * 22;
    const base = size;
    const g = ctx.createLinearGradient(0, base, 0, base - h);
    const hue = 95 + Math.random() * 25;
    g.addColorStop(0, `hsl(${hue},45%,22%)`);
    g.addColorStop(1, `hsl(${hue},55%,48%)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, base);
    ctx.quadraticCurveTo(x + lean / 2, base - h * 0.6, x + lean, base - h);
    ctx.quadraticCurveTo(x + lean / 2, base - h * 0.6, x + w / 2, base);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 柔和云朵贴图(带 alpha):多个白色径向渐变叠加成蓬松云团。 */
export function cloudTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  const blobs = 10;
  for (let i = 0; i < blobs; i++) {
    const cx = size * (0.3 + Math.random() * 0.4);
    const cy = size * (0.45 + Math.random() * 0.25);
    const r = size * (0.12 + Math.random() * 0.18);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(255,255,255,0.92)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
