import { dist } from "../geometry/distance";
import type {
  AlgorithmMode,
  ConstraintViolation,
  DroneParams,
  Point2D,
  PlanResult,
  Route as DomainRoute,
  RouteSegment,
  Scenario as DomainScenario,
  Strip as DomainStrip,
} from "../types/domain";
import type { AlgoScenario, Solution } from "./types";

export interface AlgoBundle {
  algo: AlgoScenario;
  /** 算法数字 id → domain 航带对象 */
  indexToStrip: Map<number, DomainStrip>;
}

/** domain 场景 + 无人机参数 → 算法内部场景（扁平化航带，数字 id） */
export function toAlgoScenario(
  scenario: DomainScenario,
  drone: DroneParams,
  seed = 42
): AlgoBundle {
  const indexToStrip = new Map<number, DomainStrip>();
  const strips = scenario.fields
    .flatMap((f) => f.strips)
    .map((s, i) => {
      indexToStrip.set(i, s);
      return {
        id: i,
        start: s.start,
        end: s.end,
        length: s.length,
        demand: s.demand,
        rowY: (s.start.y + s.end.y) / 2,
      };
    });

  return {
    algo: {
      depot: scenario.depot,
      strips,
      capacity: drone.seedCapacity,
      maxRouteDistance: drone.batteryDistance,
      seed,
    },
    indexToStrip,
  };
}

let routeCounter = 0;
let segCounter = 0;

/** 算法 Solution → domain PlanResult（含渲染用 routeSegments 与约束违反详情） */
export function solutionToPlanResult(
  solution: Solution,
  mode: AlgorithmMode,
  bundle: AlgoBundle
): PlanResult {
  const { algo, indexToStrip } = bundle;
  const depot = algo.depot;
  const cap = algo.capacity;
  const maxDist = algo.maxRouteDistance;

  const routes: DomainRoute[] = [];
  const routeSegments: RouteSegment[] = [];
  const violations: ConstraintViolation[] = [];

  solution.routes.forEach((r) => {
    const routeId = `R-${++routeCounter}`;
    const domainStrips = r.stripIds.map((id) => indexToStrip.get(id)!);
    const feasible = r.demand <= cap + 1e-9 && r.distance <= maxDist + 1e-9;
    routes.push({
      id: routeId,
      strips: domainStrips,
      pathPoints: r.path,
      distance: r.distance,
      demand: r.demand,
      feasible,
    });

    // 渲染线段：depot→首航带(transfer)，服务段(service)，段间(transfer)，末段返航(return)
    const segs = r.serviceSegments;
    if (segs.length > 0) {
      pushSeg(routeSegments, routeId, depot, segs[0].entry, "transfer");
      segs.forEach((s, i) => {
        const strip = indexToStrip.get(s.stripId);
        pushSeg(routeSegments, routeId, s.entry, s.exit, "service", strip?.id);
        if (i < segs.length - 1) {
          pushSeg(routeSegments, routeId, s.exit, segs[i + 1].entry, "transfer");
        }
      });
      pushSeg(routeSegments, routeId, segs[segs.length - 1].exit, depot, "return");
    }

    if (r.demand > cap + 1e-9) {
      violations.push({ type: "capacity", message: `路线 ${routeId} 种子需求 ${r.demand.toFixed(1)} 超过种箱容量 ${cap}`, routeId });
    }
    if (r.distance > maxDist + 1e-9) {
      violations.push({ type: "battery", message: `路线 ${routeId} 飞行距离 ${r.distance.toFixed(1)} 超过电池航程 ${maxDist}`, routeId });
    }
  });

  // 单条航带自身不可行（规格第十四节）
  for (const [, strip] of indexToStrip) {
    if (strip.demand > cap + 1e-9) {
      violations.push({ type: "capacity", message: `航带 ${strip.id} 种子需求 ${strip.demand.toFixed(1)} 超过种箱容量 ${cap}`, stripId: strip.id });
    }
    const single = singleRouteDistance(depot, strip.start, strip.end, strip.length);
    if (single > maxDist + 1e-9) {
      violations.push({ type: "battery", message: `航带 ${strip.id} 单趟往返 ${single.toFixed(1)} 超过电池航程 ${maxDist}`, stripId: strip.id });
    }
  }

  return {
    algorithm: mode,
    routes,
    totalDistance: solution.totalDistance,
    returnCount: solution.returns,
    coverageRate: solution.coverage,
    runtimeMs: solution.runtimeSec * 1000,
    feasible: solution.violations === 0 && solution.coverage >= 1 - 1e-9,
    violations,
    routeSegments,
  };
}

function singleRouteDistance(depot: Point2D, a: Point2D, b: Point2D, length: number): number {
  const fwd = dist(depot, a) + length + dist(b, depot);
  const rev = dist(depot, b) + length + dist(a, depot);
  return Math.min(fwd, rev);
}

function pushSeg(
  out: RouteSegment[],
  routeId: string,
  from: Point2D,
  to: Point2D,
  type: RouteSegment["type"],
  stripId?: string
) {
  out.push({ id: `SEG-${++segCounter}`, routeId, from, to, type, stripId });
}
