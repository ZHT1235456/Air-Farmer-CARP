import { dist } from "../geometry/distance";
import { allStripIds, stripById } from "./decoder";
import type { AlgoScenario } from "./types";

/** 扫描线顺序：按行 y、再按起点 x，模拟规则农田逐行作业 */
export function scanlineOrder(scenario: AlgoScenario): number[] {
  return [...scenario.strips]
    .sort((a, b) => a.rowY - b.rowY || a.start.x - b.start.x)
    .map((s) => s.id);
}

/** 最近邻顺序：从 depot 起，每次选离当前位置最近的航带端点 */
export function nearestNeighborOrder(scenario: AlgoScenario): number[] {
  const strips = stripById(scenario);
  const remaining = new Set(allStripIds(scenario));
  let current = scenario.depot;
  const order: number[] = [];
  while (remaining.size > 0) {
    let bestId = -1;
    let bestDist = Infinity;
    for (const id of remaining) {
      const s = strips.get(id)!;
      const d = Math.min(dist(current, s.start), dist(current, s.end));
      if (d < bestDist) {
        bestDist = d;
        bestId = id;
      }
    }
    const strip = strips.get(bestId)!;
    current = dist(current, strip.start) <= dist(current, strip.end) ? strip.end : strip.start;
    order.push(bestId);
    remaining.delete(bestId);
  }
  return order;
}

/** 贪心顺序：按航带中点到 depot 的距离升序（构造对照种子） */
export function greedyOrder(scenario: AlgoScenario): number[] {
  const depot = scenario.depot;
  return [...scenario.strips]
    .map((s) => ({
      id: s.id,
      d: dist({ x: (s.start.x + s.end.x) / 2, y: (s.start.y + s.end.y) / 2 }, depot),
    }))
    .sort((a, b) => a.d - b.d)
    .map((x) => x.id);
}
