import type { Obstacle, Point2D } from "../types/domain";
import { closestPointOnSegment } from "../geometry/distance";
import { pointInPolygon } from "../geometry/polygon";

const DEFAULT_BUFFER = 1.5;
/** CBF 安全裕度：在障碍缓冲外再留出的避让距离 */
const MARGIN = 2.2;
/** CBF 增益 α：约 1/影响距离，越小避让启动越早 */
const ALPHA = 0.3;

interface Barrier {
  /** 安全函数值 h = 到障碍距离 − 安全半径（≥0 安全） */
  h: number;
  /** 远离障碍的单位梯度 ∇h */
  grad: Point2D;
}

function norm(v: Point2D): Point2D {
  const m = Math.hypot(v.x, v.y);
  return m < 1e-9 ? { x: 0, y: 0 } : { x: v.x / m, y: v.y / m };
}

/** 计算某障碍对点 p 的安全函数与梯度 */
function barrier(p: Point2D, o: Obstacle): Barrier | null {
  if (o.type === "point" && o.position) {
    const R = (o.radius ?? 0) + (o.buffer ?? 0) + MARGIN;
    const dx = p.x - o.position.x;
    const dy = p.y - o.position.y;
    const d = Math.hypot(dx, dy) || 1e-6;
    return { h: d - R, grad: { x: dx / d, y: dy / d } };
  }
  if (o.type === "line" && o.points && o.points.length >= 2) {
    const R = (o.buffer ?? DEFAULT_BUFFER) + MARGIN;
    let best: Point2D | null = null;
    let bestD = Infinity;
    for (let i = 0; i + 1 < o.points.length; i++) {
      const q = closestPointOnSegment(p, o.points[i], o.points[i + 1]);
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < bestD) {
        bestD = d;
        best = q;
      }
    }
    if (!best) return null;
    const d = bestD || 1e-6;
    return { h: d - R, grad: { x: (p.x - best.x) / d, y: (p.y - best.y) / d } };
  }
  if (o.type === "polygon" && o.points && o.points.length >= 3) {
    const R = (o.buffer ?? 0) + MARGIN;
    const n = o.points.length;
    let best: Point2D | null = null;
    let bestD = Infinity;
    for (let i = 0; i < n; i++) {
      const q = closestPointOnSegment(p, o.points[i], o.points[(i + 1) % n]);
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < bestD) {
        bestD = d;
        best = q;
      }
    }
    if (!best) return null;
    const d = bestD || 1e-6;
    const inside = pointInPolygon(p, o.points);
    if (inside) {
      // 在多边形内：强烈推出，梯度朝最近边界
      return { h: -d - R, grad: { x: (best.x - p.x) / d, y: (best.y - p.y) / d } };
    }
    return { h: d - R, grad: { x: (p.x - best.x) / d, y: (p.y - best.y) / d } };
  }
  return null;
}

/**
 * 控制障碍函数（CBF）转向：在朝目标的标称速度上，
 * 对每个障碍施加约束 ∇h·u ≥ −α·h，取最小修正使无人机绕行而不穿模。
 * 返回单位方向向量。
 */
export function cbfSteer(p: Point2D, goal: Point2D, obstacles: Obstacle[]): Point2D {
  let u = norm({ x: goal.x - p.x, y: goal.y - p.y });
  if (u.x === 0 && u.y === 0) return u;

  for (let pass = 0; pass < 2; pass++) {
    for (const o of obstacles) {
      const b = barrier(p, o);
      if (!b) continue;
      const lhs = b.grad.x * u.x + b.grad.y * u.y;
      const rhs = -ALPHA * b.h;
      if (lhs < rhs) {
        const add = rhs - lhs;
        u = { x: u.x + add * b.grad.x, y: u.y + add * b.grad.y };
      }
    }
    u = norm(u);
  }
  return u;
}
