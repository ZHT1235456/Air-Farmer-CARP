import type { Point2D } from "../types/domain";

/**
 * 算法核心内部类型（自包含）。
 * 所有优化算法只操作「航带 id 排列」number[]，约束/分趟/评价统一交给 decoder。
 * 通过 adapter.ts 与 domain 模型互转。
 */

export type { Point2D };

/** 算法内部航带：数字 id（扁平索引），保留几何与需求 */
export interface AlgoStrip {
  id: number;
  start: Point2D;
  end: Point2D;
  length: number;
  demand: number;
  /** 行坐标，用于 scanline 排序（取航带中点 y） */
  rowY: number;
}

/** 算法内部场景：扁平化航带 + 容量/航程约束 */
export interface AlgoScenario {
  depot: Point2D;
  strips: AlgoStrip[];
  /** 种箱容量 Q */
  capacity: number;
  /** 单趟最大航程 / 电池预算 B */
  maxRouteDistance: number;
  seed: number;
}

/** 航带的服务方向：0 正向(start→end)，1 反向(end→start) */
export type Orientation = 0 | 1;

export interface ServiceSegment {
  stripId: number;
  entry: Point2D;
  exit: Point2D;
  orientation: Orientation;
}

/** 一趟路线（从 depot 出发并返回 depot） */
export interface AlgoRoute {
  stripIds: number[];
  distance: number;
  demand: number;
  path: Point2D[];
  serviceSegments: ServiceSegment[];
}

export interface Solution {
  algorithm: string;
  routes: AlgoRoute[];
  totalDistance: number;
  returns: number;
  coverage: number;
  runtimeSec: number;
  violations: number;
  objective: number;
  order: number[];
}

export interface ConvergencePoint {
  algorithm: string;
  iteration: number;
  objective: number;
  totalDistance: number;
}

export interface AlgorithmResult {
  solution: Solution;
  convergence: ConvergencePoint[];
  bestOrder: number[];
}
