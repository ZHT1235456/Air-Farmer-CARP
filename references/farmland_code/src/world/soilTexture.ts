import * as THREE from 'three';

/** 在画布上绘制一个柔和圆点,并在四周平铺复制以保证纹理无缝。 */
function softDot(
  ctx: CanvasRenderingContext2D,
  size: number,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha: number,
): void {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const cx = x + dx * size;
      const cy = y + dy * size;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = alpha;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function makeCanvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement, repeat: number, srgb: boolean): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 8;
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  return tex;
}

/** 低对比度暖灰颗粒,用于调制顶点棕色,叠加细碎土纹。 */
export function makeSoilDetailTexture(size = 512): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(size);
  ctx.fillStyle = '#e6ddcf';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 4 + Math.random() * 22;
    const dark = Math.random() < 0.55;
    const v = dark ? 150 + Math.random() * 40 : 235 + Math.random() * 20;
    softDot(ctx, size, x, y, r, `rgb(${v},${v - 6},${v - 16})`, dark ? 0.5 : 0.4);
  }
  // 少量小石粒
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    softDot(ctx, size, x, y, 1.5 + Math.random() * 2.5, '#8a8278', 0.6);
  }
  return canvas;
}

/** 灰度凹凸图:细碎土块的高低起伏。 */
export function makeSoilBumpTexture(size = 512): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(size);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1100; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 3 + Math.random() * 16;
    const up = Math.random() < 0.5;
    const v = up ? 190 + Math.random() * 50 : 40 + Math.random() * 50;
    softDot(ctx, size, x, y, r, `rgb(${v},${v},${v})`, 0.45);
  }
  return canvas;
}

/** 周边草地纹理。 */
export function makeGrassTexture(size = 512): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(size);
  ctx.fillStyle = '#5f7d3c';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 3 + Math.random() * 14;
    const light = Math.random() < 0.5;
    const g = light ? 130 + Math.random() * 40 : 70 + Math.random() * 30;
    softDot(ctx, size, x, y, r, `rgb(${g - 30},${g},${40 + Math.random() * 20})`, 0.4);
  }
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    softDot(ctx, size, x, y, 2 + Math.random() * 3, '#c9c24a', 0.5);
  }
  return canvas;
}

export function soilDetailTexture(repeat: number): THREE.CanvasTexture {
  return toTexture(makeSoilDetailTexture(), repeat, true);
}
export function soilBumpTexture(repeat: number): THREE.CanvasTexture {
  return toTexture(makeSoilBumpTexture(), repeat, false);
}
export function grassTexture(repeat: number): THREE.CanvasTexture {
  return toTexture(makeGrassTexture(), repeat, true);
}
