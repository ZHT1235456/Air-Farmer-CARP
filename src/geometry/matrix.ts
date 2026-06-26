import type { Point2D, Strip } from "../types/domain";
import { dist } from "./distance";

/** 通用：一组点之间的欧氏距离矩阵 */
export function buildDistanceMatrix(points: Point2D[]): number[][] {
  const n = points.length;
  const m: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = dist(points[i], points[j]);
      m[i][j] = d;
      m[j][i] = d;
    }
  }
  return m;
}

export interface StripEndpointIndex {
  /** 节点坐标列表：索引 0 为 depot，其后每条航带占两个端点 */
  points: Point2D[];
  /** 距离矩阵 */
  matrix: number[][];
  /** depot 节点索引 */
  depotIndex: number;
  /** 第 i 条航带的起点 / 终点在 points 中的索引 */
  stripStart: number[];
  stripEnd: number[];
}

/**
 * 为航带端点 + depot 构建距离矩阵，供 CARP 算法计算空飞转移成本。
 * 节点布局：[depot, s0.start, s0.end, s1.start, s1.end, ...]
 */
export function buildStripEndpointMatrix(
  depot: Point2D,
  strips: Strip[]
): StripEndpointIndex {
  const points: Point2D[] = [depot];
  const stripStart: number[] = [];
  const stripEnd: number[] = [];

  for (const s of strips) {
    stripStart.push(points.length);
    points.push(s.start);
    stripEnd.push(points.length);
    points.push(s.end);
  }

  return {
    points,
    matrix: buildDistanceMatrix(points),
    depotIndex: 0,
    stripStart,
    stripEnd,
  };
}
