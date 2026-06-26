import * as THREE from "three";

/** 柔和圆点，四周平铺复制以保证纹理无缝（移植自参考实现） */
function softDot(
  ctx: CanvasRenderingContext2D,
  size: number,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha: number
): void {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const cx = x + dx * size;
      const cy = y + dy * size;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = alpha;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function makeCanvas(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  return { canvas, ctx };
}

/** 土壤漫反射：暖灰颗粒 + 石粒 + 沿 U 方向的犁沟暗条 */
function buildSoilDetail(size: number): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(size);
  ctx.fillStyle = "#e6ddcf";
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 900; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 4 + Math.random() * 22;
    const dark = Math.random() < 0.55;
    const v = dark ? 150 + Math.random() * 40 : 235 + Math.random() * 20;
    softDot(ctx, size, x, y, r, `rgb(${v},${v - 6},${v - 16})`, dark ? 0.5 : 0.4);
  }
  for (let i = 0; i < 120; i++) {
    softDot(ctx, size, Math.random() * size, Math.random() * size, 1.5 + Math.random() * 2.5, "#8a8278", 0.6);
  }

  // 犁沟暗条：沿 V 方向的竖向暗带（配合 map.rotation 对齐航带方向）
  const furrows = 11;
  for (let i = 0; i < furrows; i++) {
    const cx = ((i + 0.5) / furrows) * size + (Math.random() - 0.5) * 4;
    const w = size / furrows;
    const grad = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
    grad.addColorStop(0, "rgba(60,44,26,0)");
    grad.addColorStop(0.5, "rgba(60,44,26,0.28)");
    grad.addColorStop(1, "rgba(60,44,26,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(cx - w / 2, 0, w, size);
  }
  return canvas;
}

function buildSoilBump(size: number): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(size);
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1100; i++) {
    const r = 3 + Math.random() * 16;
    const up = Math.random() < 0.5;
    const v = up ? 190 + Math.random() * 50 : 40 + Math.random() * 50;
    softDot(ctx, size, Math.random() * size, Math.random() * size, r, `rgb(${v},${v},${v})`, 0.45);
  }
  return canvas;
}

function buildGrass(size: number): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(size);
  ctx.fillStyle = "#5f7d3c";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1400; i++) {
    const r = 3 + Math.random() * 14;
    const light = Math.random() < 0.5;
    const g = light ? 130 + Math.random() * 40 : 70 + Math.random() * 30;
    softDot(ctx, size, Math.random() * size, Math.random() * size, r, `rgb(${g - 30},${g},${40 + Math.random() * 20})`, 0.4);
  }
  for (let i = 0; i < 80; i++) {
    softDot(ctx, size, Math.random() * size, Math.random() * size, 2 + Math.random() * 3, "#c9c24a", 0.5);
  }
  return canvas;
}

function buildCloud(size: number): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(size);
  ctx.clearRect(0, 0, size, size);
  for (let i = 0; i < 10; i++) {
    const cx = size * (0.3 + Math.random() * 0.4);
    const cy = size * (0.45 + Math.random() * 0.25);
    const r = size * (0.12 + Math.random() * 0.18);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, "rgba(255,255,255,0.92)");
    g.addColorStop(0.6, "rgba(255,255,255,0.5)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvas;
}

// ---------- 模块级缓存：画布只生成一次 ----------
let _soilDetail: HTMLCanvasElement | null = null;
let _soilBump: HTMLCanvasElement | null = null;
let _grass: HTMLCanvasElement | null = null;
let _cloud: HTMLCanvasElement | null = null;

function texFromCanvas(
  canvas: HTMLCanvasElement,
  repeat: number,
  srgb: boolean,
  rotation = 0
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 8;
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  if (rotation !== 0) {
    tex.center.set(0.5, 0.5);
    tex.rotation = rotation;
  }
  return tex;
}

/** 土壤漫反射纹理；rotation 对齐犁沟方向，repeat 按世界尺度平铺 */
export function soilDetailTexture(repeat: number, rotation = 0): THREE.CanvasTexture {
  if (!_soilDetail) _soilDetail = buildSoilDetail(512);
  return texFromCanvas(_soilDetail, repeat, true, rotation);
}
export function soilBumpTexture(repeat: number, rotation = 0): THREE.CanvasTexture {
  if (!_soilBump) _soilBump = buildSoilBump(512);
  return texFromCanvas(_soilBump, repeat, false, rotation);
}
export function grassTexture(repeat: number): THREE.CanvasTexture {
  if (!_grass) _grass = buildGrass(512);
  return texFromCanvas(_grass, repeat, true);
}
export function cloudTexture(): THREE.CanvasTexture {
  if (!_cloud) _cloud = buildCloud(256);
  const tex = new THREE.CanvasTexture(_cloud);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
