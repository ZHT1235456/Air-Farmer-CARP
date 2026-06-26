import { dist } from "../geometry/distance";
import type {
  AlgoRoute,
  AlgoScenario,
  AlgoStrip,
  Orientation,
  Point2D,
  ServiceSegment,
  Solution,
} from "./types";

const EPS = 1e-9;

/** 全部航带 id（场景默认顺序） */
export function allStripIds(scenario: AlgoScenario): number[] {
  return scenario.strips.map((s) => s.id);
}

/** id → strip 映射缓存（避免线性查找） */
const stripMapCache = new WeakMap<AlgoScenario, Map<number, AlgoStrip>>();
export function stripById(scenario: AlgoScenario): Map<number, AlgoStrip> {
  let m = stripMapCache.get(scenario);
  if (!m) {
    m = new Map(scenario.strips.map((s) => [s.id, s]));
    stripMapCache.set(scenario, m);
  }
  return m;
}

/** 排列修复：删除非法/重复 id，按默认顺序补回缺失航带 */
export function repairOrder(order: Iterable<number>, scenario: AlgoScenario): number[] {
  const expected = allStripIds(scenario);
  const expectedSet = new Set(expected);
  const seen = new Set<number>();
  const repaired: number[] = [];
  for (const item of order) {
    const id = item | 0;
    if (expectedSet.has(id) && !seen.has(id)) {
      repaired.push(id);
      seen.add(id);
    }
  }
  for (const id of expected) if (!seen.has(id)) repaired.push(id);
  return repaired;
}

function orientedPoints(strip: AlgoStrip, orientation: Orientation): [Point2D, Point2D] {
  return orientation === 0 ? [strip.start, strip.end] : [strip.end, strip.start];
}

export interface RouteGeometry {
  distance: number;
  path: Point2D[];
  serviceSegments: ServiceSegment[];
}

/**
 * 单趟路线最短方向选择：两状态 DP，为每条航带选更短的进入/退出端。
 * dp[i][0/1] = 第 i 条航带以正/反向服务后的最小累计距离。
 */
export function bestRouteGeometry(
  stripIds: number[],
  scenario: AlgoScenario
): RouteGeometry {
  const depot = scenario.depot;
  if (stripIds.length === 0) return { distance: 0, path: [depot], serviceSegments: [] };

  const strips = stripById(scenario);
  const n = stripIds.length;
  const dp: number[][] = Array.from({ length: n }, () => [Infinity, Infinity]);
  const parent: number[][] = Array.from({ length: n }, () => [-1, -1]);

  const first = strips.get(stripIds[0])!;
  for (const o of [0, 1] as Orientation[]) {
    const [entry] = orientedPoints(first, o);
    dp[0][o] = dist(depot, entry) + first.length;
  }

  for (let idx = 1; idx < n; idx++) {
    const current = strips.get(stripIds[idx])!;
    for (const o of [0, 1] as Orientation[]) {
      const [entry] = orientedPoints(current, o);
      let bestCost = Infinity;
      let bestPrev = -1;
      for (const po of [0, 1] as Orientation[]) {
        const prev = strips.get(stripIds[idx - 1])!;
        const [, prevExit] = orientedPoints(prev, po);
        const cost = dp[idx - 1][po] + dist(prevExit, entry) + current.length;
        if (cost < bestCost) {
          bestCost = cost;
          bestPrev = po;
        }
      }
      dp[idx][o] = bestCost;
      parent[idx][o] = bestPrev;
    }
  }

  const last = strips.get(stripIds[n - 1])!;
  const finalCosts: number[] = [];
  for (const o of [0, 1] as Orientation[]) {
    const [, exit] = orientedPoints(last, o);
    finalCosts.push(dp[n - 1][o] + dist(exit, depot));
  }
  const lastOrientation: Orientation = finalCosts[0] <= finalCosts[1] ? 0 : 1;
  const totalDistance = finalCosts[lastOrientation];

  const orientations: Orientation[] = new Array(n).fill(0);
  orientations[n - 1] = lastOrientation;
  for (let idx = n - 1; idx > 0; idx--) {
    orientations[idx - 1] = parent[idx][orientations[idx]] as Orientation;
  }

  const path: Point2D[] = [depot];
  const serviceSegments: ServiceSegment[] = [];
  for (let i = 0; i < n; i++) {
    const strip = strips.get(stripIds[i])!;
    const [entry, exit] = orientedPoints(strip, orientations[i]);
    path.push(entry, exit);
    serviceSegments.push({ stripId: stripIds[i], entry, exit, orientation: orientations[i] });
  }
  path.push(depot);
  return { distance: totalDistance, path, serviceSegments };
}

export function routeDemand(stripIds: number[], scenario: AlgoScenario): number {
  const strips = stripById(scenario);
  let sum = 0;
  for (const id of stripIds) sum += strips.get(id)!.demand;
  return sum;
}

export function buildRoute(stripIds: number[], scenario: AlgoScenario): AlgoRoute {
  const geo = bestRouteGeometry(stripIds, scenario);
  return {
    stripIds: [...stripIds],
    distance: geo.distance,
    demand: routeDemand(stripIds, scenario),
    path: geo.path,
    serviceSegments: geo.serviceSegments,
  };
}

export interface DecodeResult {
  routes: AlgoRoute[];
  violations: number;
  repairedOrder: number[];
}

/** 把排列切分成多趟路线，并统计容量/航程违反次数 */
export function decodeOrder(order: Iterable<number>, scenario: AlgoScenario): DecodeResult {
  const repairedOrder = repairOrder(order, scenario);
  const routes: AlgoRoute[] = [];
  let violations = 0;
  let current: number[] = [];

  for (const stripId of repairedOrder) {
    const candidate = [...current, stripId];
    const candidateDemand = routeDemand(candidate, scenario);
    const candidateDistance = bestRouteGeometry(candidate, scenario).distance;
    if (
      current.length > 0 &&
      (candidateDemand > scenario.capacity + EPS ||
        candidateDistance > scenario.maxRouteDistance + EPS)
    ) {
      routes.push(buildRoute(current, scenario));
      current = [stripId];
      const singleDemand = routeDemand(current, scenario);
      const singleDistance = bestRouteGeometry(current, scenario).distance;
      if (
        singleDemand > scenario.capacity + EPS ||
        singleDistance > scenario.maxRouteDistance + EPS
      ) {
        violations += 1;
      }
    } else {
      current = candidate;
    }
  }

  if (current.length > 0) routes.push(buildRoute(current, scenario));

  for (const route of routes) {
    if (route.demand > scenario.capacity + EPS) violations += 1;
    if (route.distance > scenario.maxRouteDistance + EPS) violations += 1;
  }

  return { routes, violations, repairedOrder };
}

/** 目标函数（必须与 Python 一致） */
export function objectiveValue(
  totalDistance: number,
  returns: number,
  violations: number,
  missingCount = 0
): number {
  return totalDistance + 30.0 * returns + 5000.0 * violations + 5000.0 * missingCount;
}

export function makeSolution(
  algorithm: string,
  order: Iterable<number>,
  scenario: AlgoScenario,
  runtimeSec = 0
): Solution {
  const { routes, violations, repairedOrder } = decodeOrder(order, scenario);
  const totalDistance = routes.reduce((s, r) => s + r.distance, 0);
  const returns = Math.max(0, routes.length - 1);
  const served = new Set<number>();
  for (const r of routes) for (const id of r.stripIds) served.add(id);
  const total = scenario.strips.length;
  const coverage = total === 0 ? 1 : served.size / total;
  const missing = total - served.size;
  return {
    algorithm,
    routes,
    totalDistance,
    returns,
    coverage,
    runtimeSec,
    violations,
    objective: objectiveValue(totalDistance, returns, violations, missing),
    order: repairedOrder,
  };
}

export function evaluateOrder(order: Iterable<number>, scenario: AlgoScenario): number {
  return makeSolution("candidate", order, scenario).objective;
}
