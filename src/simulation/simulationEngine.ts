import type {
  DroneParams,
  Obstacle,
  PlanResult,
  Point2D,
  SimulationStatus,
  Strip,
} from "../types/domain";
import { cbfSteer } from "./avoidance";

const REFILL_SEC = 3.0;
const SUB_STEP = 0.6;
/** 同一空飞段绕行超时则放行（防止凹形障碍卡死） */
const STUCK_LIMIT = 5.0;

type Playback = "idle" | "running" | "paused" | "completed";

interface Seg {
  from: Point2D;
  to: Point2D;
  type: "service" | "transfer" | "return";
  stripId?: string;
  routeId: string;
  len: number;
}

export interface SimSnapshot {
  status: SimulationStatus;
  pos: Point2D;
  heading: number;
  tripIndex: number;
  totalTrips: number;
  currentStripId: string | null;
  batteryPct: number;
  seedPct: number;
  distanceFlown: number;
  totalDistance: number;
  coveredArea: number;
  coverageRate: number;
  returns: number;
  etaSec: number;
  seededStripIds: Set<string>;
  isSeeding: boolean;
  /** 当前正在执行的趟（0-based，对应 plan.routes 索引） */
  currentRouteIndex: number;
}

function dist(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** 仿真引擎：把 PlanResult 展开为飞行时间线，连续推进无人机位置，空飞段用 CBF 避障 */
export class SimulationEngine {
  private segs: Seg[];
  private stripMap = new Map<string, Strip>();
  readonly totalDistance: number;
  readonly totalStrips: number;
  readonly totalTrips: number;

  private playback: Playback = "idle";
  private segIndex = 0;
  private segDist = 0;
  private segTime = 0;
  private distanceFlown = 0;
  private tripDist = 0;
  private consumedDemand = 0;
  private refillTimer = 0;
  private returns = 0;
  private seeded = new Set<string>();
  private dronePos: Point2D;
  private heading = 0;
  private avoidDir: Point2D | null = null;
  private avoidSide = 1;
  private avoidSegIndex = -1;
  private routeOrder: string[];

  constructor(plan: PlanResult, private drone: DroneParams, private obstacles: Obstacle[] = []) {
    for (const r of plan.routes) for (const s of r.strips) this.stripMap.set(s.id, s);
    this.routeOrder = plan.routes.map((r) => r.id);
    this.segs = plan.routeSegments.map((rs) => ({
      from: rs.from,
      to: rs.to,
      type: rs.type,
      stripId: rs.stripId,
      routeId: rs.routeId,
      len: dist(rs.from, rs.to),
    }));
    this.totalDistance = this.segs.reduce((s, x) => s + x.len, 0);
    this.totalStrips = this.stripMap.size;
    this.totalTrips = Math.max(1, plan.routes.length);
    this.dronePos = this.segs[0] ? { ...this.segs[0].from } : { x: 0, y: 0 };
    if (this.segs.length === 0) this.playback = "completed";
  }

  get state(): Playback {
    return this.playback;
  }

  toggle(): void {
    if (this.playback === "running") this.playback = "paused";
    else if (this.playback === "completed") {
      this.reset();
      this.playback = "running";
    } else this.playback = "running";
  }

  reset(): void {
    this.segIndex = 0;
    this.segDist = 0;
    this.segTime = 0;
    this.distanceFlown = 0;
    this.tripDist = 0;
    this.consumedDemand = 0;
    this.refillTimer = 0;
    this.returns = 0;
    this.seeded.clear();
    this.dronePos = this.segs[0] ? { ...this.segs[0].from } : { x: 0, y: 0 };
    this.heading = 0;
    this.avoidDir = null;
    this.avoidSide = 1;
    this.avoidSegIndex = -1;
    this.playback = this.segs.length === 0 ? "completed" : "idle";
  }

  private completeSeg(seg: Seg): void {
    const isLast = this.segIndex === this.segs.length - 1;
    if (seg.type === "service" && seg.stripId) {
      this.seeded.add(seg.stripId);
      this.consumedDemand += this.stripMap.get(seg.stripId)?.demand ?? 0;
    }
    this.dronePos = { ...seg.to };
    this.segDist = 0;
    this.segTime = 0;
    this.avoidDir = null;
    this.avoidSegIndex = -1;
    this.segIndex += 1;
    if (seg.type === "return") {
      if (isLast) this.playback = "completed";
      else this.refillTimer = REFILL_SEC;
    } else if (isLast) {
      this.playback = "completed";
    }
  }

  private prepareAvoidance(seg: Seg): void {
    if (this.avoidSegIndex === this.segIndex) return;
    this.avoidSegIndex = this.segIndex;
    this.avoidDir = null;

    const dx = seg.to.x - seg.from.x;
    const dy = seg.to.y - seg.from.y;
    this.avoidSide = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 1 : -1) : dy >= 0 ? -1 : 1;
  }

  advance(dt: number, speedMultiplier: number): void {
    if (this.playback !== "running") return;

    if (this.refillTimer > 0) {
      this.refillTimer -= dt;
      if (this.refillTimer <= 0) {
        this.refillTimer = 0;
        this.returns += 1;
        this.tripDist = 0;
        this.consumedDemand = 0;
      }
      return;
    }

    let move = this.drone.speed * speedMultiplier * dt;
    let guard = 0;
    while (move > 1e-6 && this.segIndex < this.segs.length && this.playback === "running") {
      if (++guard > 1000) break;
      const seg = this.segs[this.segIndex];

      if (seg.type === "service") {
        const remain = seg.len - this.segDist;
        const adv = Math.min(move, remain);
        this.segDist += adv;
        this.distanceFlown += adv;
        this.tripDist += adv;
        move -= adv;
        const t = seg.len > 0 ? this.segDist / seg.len : 1;
        this.dronePos = {
          x: seg.from.x + (seg.to.x - seg.from.x) * t,
          y: seg.from.y + (seg.to.y - seg.from.y) * t,
        };
        this.heading = Math.atan2(seg.to.y - seg.from.y, seg.to.x - seg.from.x);
        if (this.segDist >= seg.len - 1e-9) this.completeSeg(seg);
      } else {
        // 空飞 / 返航：CBF 避障朝目标，超时则直飞放行
        const step = Math.min(move, SUB_STEP);
        this.prepareAvoidance(seg);
        const d2 = dist(this.dronePos, seg.to);
        if (d2 <= step) {
          this.distanceFlown += d2;
          this.tripDist += d2;
          move -= d2;
          this.completeSeg(seg);
        } else {
          let dir: Point2D;
          if (this.segTime > STUCK_LIMIT) {
            const dx = seg.to.x - this.dronePos.x;
            const dy = seg.to.y - this.dronePos.y;
            const m = Math.hypot(dx, dy) || 1;
            dir = { x: dx / m, y: dy / m };
          } else {
            dir = cbfSteer(this.dronePos, seg.to, this.obstacles, {
              previousDir: this.avoidDir,
              sideBias: this.avoidSide,
            });
          }
          this.avoidDir = dir;
          this.dronePos = { x: this.dronePos.x + dir.x * step, y: this.dronePos.y + dir.y * step };
          this.distanceFlown += step;
          this.tripDist += step;
          this.segTime += step / Math.max(0.1, this.drone.speed);
          move -= step;
          this.heading = Math.atan2(dir.y, dir.x);
        }
      }
    }
  }

  getSnapshot(): SimSnapshot {
    const seg = this.segs[Math.min(this.segIndex, this.segs.length - 1)];
    const battery = clamp01(1 - this.tripDist / Math.max(1, this.drone.batteryDistance));
    const seedPct = clamp01(1 - this.consumedDemand / Math.max(1, this.drone.seedCapacity));

    let coveredArea = 0;
    for (const id of this.seeded) coveredArea += this.stripMap.get(id)?.coveredArea ?? 0;

    const isSeeding = this.playback === "running" && this.refillTimer <= 0 && seg?.type === "service";

    let status: SimulationStatus;
    if (this.playback === "idle") status = "idle";
    else if (this.playback === "paused") status = "paused";
    else if (this.playback === "completed") status = "completed";
    else if (this.refillTimer > 0) status = "refilling";
    else if (seg?.type === "service") status = "seeding";
    else if (seg?.type === "return") status = "returning";
    else status = "running";

    const etaSec =
      this.playback === "completed"
        ? 0
        : (this.totalDistance - this.distanceFlown) / Math.max(0.1, this.drone.speed);

    return {
      status,
      pos: { ...this.dronePos },
      heading: this.heading,
      tripIndex: Math.min(this.returns + 1, this.totalTrips),
      totalTrips: this.totalTrips,
      currentStripId: seg?.type === "service" ? seg.stripId ?? null : null,
      batteryPct: battery,
      seedPct,
      distanceFlown: this.distanceFlown,
      totalDistance: this.totalDistance,
      coveredArea,
      coverageRate: this.totalStrips ? this.seeded.size / this.totalStrips : 1,
      returns: this.returns,
      etaSec,
      seededStripIds: new Set(this.seeded),
      isSeeding,
      currentRouteIndex: seg
        ? Math.max(0, this.routeOrder.indexOf(seg.routeId))
        : this.routeOrder.length - 1,
    };
  }
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
