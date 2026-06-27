import * as THREE from "three";
import type { Point2D, Scenario } from "../types/domain";

/**
 * 世界 2D 坐标 → Three.js 3D 坐标。
 * 映射 (x, y) → (x, height, -y)，使俯视时世界 +y 朝屏幕上方。
 */
export function to3(p: Point2D, height = 0): THREE.Vector3 {
  return new THREE.Vector3(p.x, height, -p.y);
}

export interface SceneBounds {
  center: Point2D;
  width: number;
  height: number;
  /** 较大边长，用于相机高度估算 */
  size: number;
}

/** 计算场景包围范围（含农田、障碍物、补给点） */
export function computeSceneBounds(scenario: Scenario): SceneBounds {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  const acc = (p: Point2D) => {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  };

  scenario.fields.forEach((f) => f.polygon.forEach(acc));
  scenario.obstacles.forEach((o) => {
    if (o.position) acc(o.position);
    o.points?.forEach(acc);
  });
  acc(scenario.depot);

  if (!isFinite(minX)) {
    return { center: { x: 0, y: 0 }, width: 10, height: 10, size: 10 };
  }

  const pad = 6;
  minX -= pad;
  minY -= pad;
  maxX += pad;
  maxY += pad;

  const width = maxX - minX;
  const height = maxY - minY;
  return {
    center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
    width,
    height,
    size: Math.max(width, height),
  };
}

export interface SegmentTransform {
  position: [number, number, number];
  rotationY: number;
  length: number;
}

/** 把世界 2D 线段 [a,b] 转为 three 中条状几何的位置/朝向/长度（条沿局部 X 轴） */
export function segmentTransform(a: Point2D, b: Point2D, y = 0): SegmentTransform {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  return {
    position: [(a.x + b.x) / 2, y, -(a.y + b.y) / 2],
    rotationY: Math.atan2(dy, dx),
    length,
  };
}

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
  minDistance: number;
  maxDistance: number;
}

/** 由场景包围盒计算斜俯视相机位姿（比例参考 farmland (-78,52,86)@size120） */
export function computeCameraPose(bounds: SceneBounds): CameraPose {
  const { center, size } = bounds;
  const cx = center.x;
  const cz = -center.y;
  // 6 点钟方向（场景正南）斜俯视，俯角 85°
  const d = size * 1.2;
  const zOffset = d / Math.tan((85 * Math.PI) / 180);
  return {
    position: [cx, d, cz + zOffset],
    target: [cx, 1.5, cz],
    minDistance: size * 0.28,
    maxDistance: size * 2.8,
  };
}
