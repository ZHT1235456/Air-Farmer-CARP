import type { Point2D } from "../types/domain";

export interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** 多边形包围盒 */
export function boundingBox(polygon: Point2D[]): BBox {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of polygon) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

/** 多边形面积（鞋带公式，返回绝对值） */
export function polygonArea(polygon: Point2D[]): number {
  let sum = 0;
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % n];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

/** 多边形质心 */
export function polygonCentroid(polygon: Point2D[]): Point2D {
  let cx = 0,
    cy = 0,
    a = 0;
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const p = polygon[i];
    const q = polygon[(i + 1) % n];
    const cross = p.x * q.y - q.x * p.y;
    cx += (p.x + q.x) * cross;
    cy += (p.y + q.y) * cross;
    a += cross;
  }
  if (a === 0) {
    // 退化为顶点平均
    return {
      x: polygon.reduce((s, p) => s + p.x, 0) / n,
      y: polygon.reduce((s, p) => s + p.y, 0) / n,
    };
  }
  a *= 0.5;
  return { x: cx / (6 * a), y: cy / (6 * a) };
}

/** 射线法判断点是否在多边形内 */
export function pointInPolygon(p: Point2D, polygon: Point2D[]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const pi = polygon[i];
    const pj = polygon[j];
    const intersect =
      pi.y > p.y !== pj.y > p.y &&
      p.x < ((pj.x - pi.x) * (p.y - pi.y)) / (pj.y - pi.y) + pi.x;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * 求一条直线与多边形所有边的交点参数 t（沿 origin + t*dir）。
 * 返回升序排列的 t 列表。
 */
export function linePolygonIntersections(
  origin: Point2D,
  dir: Point2D,
  polygon: Point2D[]
): number[] {
  const ts: number[] = [];
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % n];
    const ex = b.x - a.x;
    const ey = b.y - a.y;
    // 解 origin + t*dir = a + s*e
    const denom = dir.x * ey - dir.y * ex;
    if (Math.abs(denom) < 1e-9) continue; // 平行
    const dx = a.x - origin.x;
    const dy = a.y - origin.y;
    const t = (dx * ey - dy * ex) / denom;
    const s = (dx * dir.y - dy * dir.x) / denom;
    if (s >= -1e-9 && s <= 1 + 1e-9) {
      ts.push(t);
    }
  }
  return ts.sort((x, y) => x - y);
}
