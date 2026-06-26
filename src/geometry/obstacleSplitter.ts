import type { Obstacle, Point2D } from "../types/domain";
import { pointToSegment } from "./distance";
import { pointInPolygon } from "./polygon";
import type { StripSegment } from "./stripGenerator";

export interface SplitSegment extends StripSegment {
  /** 是否由障碍物切分产生 */
  split: boolean;
}

/** 采样分辨率（世界单位）：教学型实现，足够表达切分效果 */
const SAMPLE_STEP = 0.4;
const MIN_SUB_LEN = 0.8;
const DEFAULT_BUFFER = 1.5;

/** 判断点是否落在某障碍物的禁飞 / 缓冲区内 */
export function isPointBlocked(p: Point2D, obstacles: Obstacle[]): boolean {
  for (const o of obstacles) {
    if (o.type === "point" && o.position) {
      const r = (o.radius ?? 0) + (o.buffer ?? DEFAULT_BUFFER);
      if (Math.hypot(p.x - o.position.x, p.y - o.position.y) <= r) return true;
    } else if (o.type === "line" && o.points && o.points.length >= 2) {
      const buf = o.buffer ?? DEFAULT_BUFFER;
      for (let i = 0; i + 1 < o.points.length; i++) {
        if (pointToSegment(p, o.points[i], o.points[i + 1]) <= buf) return true;
      }
    } else if (o.type === "polygon" && o.points && o.points.length >= 3) {
      const buf = o.buffer ?? 0;
      if (pointInPolygon(p, o.points)) return true;
      if (buf > 0) {
        const n = o.points.length;
        for (let i = 0; i < n; i++) {
          if (pointToSegment(p, o.points[i], o.points[(i + 1) % n]) <= buf)
            return true;
        }
      }
    }
  }
  return false;
}

/**
 * 用障碍缓冲区切分一条航带，返回缓冲区之外的子航带。
 * 采用采样法，统一处理点 / 线 / 多边形障碍。
 */
export function splitStripByObstacles(
  seg: StripSegment,
  obstacles: Obstacle[]
): SplitSegment[] {
  if (obstacles.length === 0) return [{ ...seg, split: false }];

  const len = Math.hypot(seg.end.x - seg.start.x, seg.end.y - seg.start.y);
  const steps = Math.max(2, Math.ceil(len / SAMPLE_STEP));
  const pointAt = (t: number): Point2D => ({
    x: seg.start.x + (seg.end.x - seg.start.x) * t,
    y: seg.start.y + (seg.end.y - seg.start.y) * t,
  });

  // 标记每个采样点是否被阻挡
  const blocked: boolean[] = [];
  let anyBlocked = false;
  for (let i = 0; i <= steps; i++) {
    const b = isPointBlocked(pointAt(i / steps), obstacles);
    blocked.push(b);
    if (b) anyBlocked = true;
  }

  if (!anyBlocked) return [{ ...seg, split: false }];

  // 把连续的未阻挡区间提取为子航带
  const out: SplitSegment[] = [];
  let runStart = -1;
  for (let i = 0; i <= steps; i++) {
    if (!blocked[i]) {
      if (runStart < 0) runStart = i;
    } else if (runStart >= 0) {
      pushSub(out, pointAt, runStart / steps, (i - 1) / steps, len);
      runStart = -1;
    }
  }
  if (runStart >= 0) pushSub(out, pointAt, runStart / steps, 1, len);

  return out;
}

function pushSub(
  out: SplitSegment[],
  pointAt: (t: number) => Point2D,
  t0: number,
  t1: number,
  totalLen: number
) {
  if ((t1 - t0) * totalLen < MIN_SUB_LEN) return;
  out.push({ start: pointAt(t0), end: pointAt(t1), split: true });
}

/** 批量切分 */
export function splitStrips(
  segments: StripSegment[],
  obstacles: Obstacle[]
): SplitSegment[] {
  return segments.flatMap((s) => splitStripByObstacles(s, obstacles));
}
