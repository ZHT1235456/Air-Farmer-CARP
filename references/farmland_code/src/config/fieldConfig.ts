import type { FieldData, Strip, Vec2 } from '../types';

// 田块尺寸 (米):x 为航带长度方向,y 为航带堆叠方向。
export const FIELD_WIDTH = 120; // 沿 x
export const FIELD_DEPTH = 84; // 沿 y
const HEADLAND = 5; // 地头留白,航带不贴边界

export const STRIP_WIDTH = 4; // 播种幅宽
export const STRIP_ANGLE_DEG = 0; // 航带方向 (v1 与 x 轴平行)

const DRONE = {
  seedCapacity: 1200,
  batteryRange: 900,
  speed: 8,
  seedRate: 1.0,
  cruiseHeight: 12,
};

/**
 * 由矩形田块、幅宽与方向生成平行播种航带。
 * 对应论文"航带生成"步骤;v1 针对轴对齐矩形,后续可替换为算法输出。
 */
export function generateStrips(
  width: number,
  depth: number,
  stripWidth: number,
  seedRate: number,
): Strip[] {
  const strips: Strip[] = [];
  const usableDepth = depth - 2 * HEADLAND;
  const count = Math.floor(usableDepth / stripWidth);
  const x0 = -width / 2 + HEADLAND;
  const x1 = width / 2 - HEADLAND;
  const length = x1 - x0;

  for (let i = 0; i < count; i++) {
    const y = -usableDepth / 2 + (i + 0.5) * stripWidth;
    const start: Vec2 = { x: x0, y };
    const end: Vec2 = { x: x1, y };
    strips.push({
      id: i,
      start,
      end,
      length,
      demand: length * seedRate,
      cost: length,
    });
  }
  return strips;
}

export function createFieldData(): FieldData {
  const strips = generateStrips(FIELD_WIDTH, FIELD_DEPTH, STRIP_WIDTH, DRONE.seedRate);

  const boundary: Vec2[] = [
    { x: -FIELD_WIDTH / 2, y: -FIELD_DEPTH / 2 },
    { x: FIELD_WIDTH / 2, y: -FIELD_DEPTH / 2 },
    { x: FIELD_WIDTH / 2, y: FIELD_DEPTH / 2 },
    { x: -FIELD_WIDTH / 2, y: FIELD_DEPTH / 2 },
  ];

  return {
    boundary,
    depot: { x: -FIELD_WIDTH / 2 + 2, y: -FIELD_DEPTH / 2 - 8 },
    obstacles: [
      { kind: 'pond', center: { x: 30, y: 14 }, radius: 9 },
      { kind: 'rock', center: { x: -22, y: 20 }, radius: 4 },
      { kind: 'noflyzone', center: { x: 42, y: -22 }, radius: 7 },
    ],
    stripWidth: STRIP_WIDTH,
    stripAngleDeg: STRIP_ANGLE_DEG,
    drone: DRONE,
    strips,
  };
}
