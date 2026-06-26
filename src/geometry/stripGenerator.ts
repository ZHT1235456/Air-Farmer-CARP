import type { Point2D } from "../types/domain";
import { boundingBox, linePolygonIntersections } from "./polygon";

/** 裸航带段（未赋 id / 需求等业务属性） */
export interface StripSegment {
  start: Point2D;
  end: Point2D;
}

const MIN_STRIP_LEN = 1e-3;

/**
 * 在多边形内按给定方向生成平行航带。
 * @param polygon 农田边界
 * @param direction 航带方向（弧度）
 * @param spacing 相邻航带间距（= 播种幅宽）
 */
export function generateStrips(
  polygon: Point2D[],
  direction: number,
  spacing: number
): StripSegment[] {
  if (polygon.length < 3 || spacing <= 0) return [];

  const d: Point2D = { x: Math.cos(direction), y: Math.sin(direction) };
  const n: Point2D = { x: -Math.sin(direction), y: Math.cos(direction) }; // 垂直方向

  // 在垂直方向 n 上的投影范围，决定铺多少条扫描线
  let minN = Infinity;
  let maxN = -Infinity;
  for (const p of polygon) {
    const proj = p.x * n.x + p.y * n.y;
    if (proj < minN) minN = proj;
    if (proj > maxN) maxN = proj;
  }

  const segments: StripSegment[] = [];
  // 首条扫描线居中偏移半个幅宽，使覆盖更均衡
  for (let offset = minN + spacing / 2; offset < maxN; offset += spacing) {
    const origin: Point2D = { x: offset * n.x, y: offset * n.y };
    const ts = linePolygonIntersections(origin, d, polygon);
    // 成对取交点（进入 / 离开）得到多边形内部线段
    for (let i = 0; i + 1 < ts.length; i += 2) {
      const t0 = ts[i];
      const t1 = ts[i + 1];
      const start: Point2D = { x: origin.x + t0 * d.x, y: origin.y + t0 * d.y };
      const end: Point2D = { x: origin.x + t1 * d.x, y: origin.y + t1 * d.y };
      if (Math.hypot(end.x - start.x, end.y - start.y) > MIN_STRIP_LEN) {
        segments.push({ start, end });
      }
    }
  }
  return segments;
}

/** 估算适合该多边形的默认航带方向：取最长边的方向 */
export function suggestStripDirection(polygon: Point2D[]): number {
  let best = 0;
  let bestLen = -1;
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % n];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len > bestLen) {
      bestLen = len;
      best = Math.atan2(b.y - a.y, b.x - a.x);
    }
  }
  return best;
}

export { boundingBox };
