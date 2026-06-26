import type { Obstacle, Point2D } from "../types/domain";
import { closestPointOnSegment } from "../geometry/distance";
import { pointInPolygon } from "../geometry/polygon";

const DEFAULT_BUFFER = 1.5;
const MARGIN = 2.2;
const ALPHA = 0.3;
const INFLUENCE = 7.5;
const MIN_TANGENT = 0.48;
const TURN_INERTIA = 0.35;

interface Barrier {
  /** Safety value h = distance to obstacle - safety radius. */
  h: number;
  /** Unit gradient pointing away from the obstacle. */
  grad: Point2D;
}

export interface CbfSteerOptions {
  /** Previous steering direction for this flight segment. */
  previousDir?: Point2D | null;
  /** Stable side used when a head-on obstacle leaves no natural tangent. */
  sideBias?: number;
}

function norm(v: Point2D): Point2D {
  const m = Math.hypot(v.x, v.y);
  return m < 1e-9 ? { x: 0, y: 0 } : { x: v.x / m, y: v.y / m };
}

function dot(a: Point2D, b: Point2D): number {
  return a.x * b.x + a.y * b.y;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function mix(a: Point2D, b: Point2D, t: number): Point2D {
  return { x: a.x * (1 - t) + b.x * t, y: a.y * (1 - t) + b.y * t };
}

function tangentFor(grad: Point2D, reference: Point2D, sideBias: number): Point2D {
  const t = { x: -grad.y, y: grad.x };
  const natural = dot(reference, t);
  const side = Math.abs(natural) > 0.12 ? Math.sign(natural) : sideBias >= 0 ? 1 : -1;
  return side >= 0 ? t : { x: -t.x, y: -t.y };
}

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
      return { h: -d - R, grad: { x: (best.x - p.x) / d, y: (best.y - p.y) / d } };
    }
    return { h: d - R, grad: { x: (p.x - best.x) / d, y: (p.y - best.y) / d } };
  }

  return null;
}

/**
 * CBF steering with tangential sliding.
 *
 * A pure projection can collapse to a near-zero vector when the goal is straight
 * across a pole/line buffer. Normalizing that vector makes the drone move into
 * the obstacle on one frame and back out on the next. When the normal component
 * is blocked, keep a stable tangential component so the drone slides around the
 * obstacle instead of oscillating.
 */
export function cbfSteer(
  p: Point2D,
  goal: Point2D,
  obstacles: Obstacle[],
  options: CbfSteerOptions = {}
): Point2D {
  const goalDir = norm({ x: goal.x - p.x, y: goal.y - p.y });
  let u = goalDir;
  if (u.x === 0 && u.y === 0) return u;

  const sideBias = options.sideBias ?? 1;
  const previousDir = options.previousDir ? norm(options.previousDir) : null;
  const barriers = obstacles
    .map((o) => barrier(p, o))
    .filter((b): b is Barrier => Boolean(b))
    .sort((a, b) => a.h - b.h);

  for (const b of barriers) {
    if (b.h > INFLUENCE) continue;

    const normalSpeed = dot(u, b.grad);
    const requiredOutward = b.h < 0 ? clamp(-ALPHA * b.h + 0.08, 0.12, 0.88) : 0;
    const blocksGoal = dot(goalDir, b.grad) < 0.15;

    if (normalSpeed < requiredOutward || blocksGoal) {
      const reference = previousDir ?? u;
      const tangent = tangentFor(b.grad, reference, sideBias);
      const tangentSpeed = dot(u, tangent);
      const urgency = clamp((INFLUENCE - b.h) / INFLUENCE, 0, 1);
      const tangentMag = Math.max(Math.abs(tangentSpeed), MIN_TANGENT + 0.28 * urgency);

      u = norm({
        x: tangent.x * tangentMag + b.grad.x * requiredOutward,
        y: tangent.y * tangentMag + b.grad.y * requiredOutward,
      });
    }
  }

  if (previousDir && barriers.some((b) => b.h <= INFLUENCE) && dot(previousDir, u) > -0.25) {
    u = norm(mix(u, previousDir, TURN_INERTIA));
  }

  return u;
}
