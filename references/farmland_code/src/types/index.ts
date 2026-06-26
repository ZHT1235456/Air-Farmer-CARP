// 领域数据类型。字段对齐 docs/main.tex 中的 Strip / Route 结构,
// 便于后续将 CARP 算法输出直接接入渲染层。

/** 田块平面坐标 (x, y);渲染时映射为世界坐标 (x, height, y)。 */
export interface Vec2 {
  x: number;
  y: number;
}

/** 无人机参数:种箱容量 Q、单趟航程预算 B、速度、播种密度、巡航高度。 */
export interface DroneParams {
  seedCapacity: number; // 种箱容量 Q (粒/单位)
  batteryRange: number; // 单趟最大航程预算 B (m)
  speed: number; // 飞行速度 (m/s)
  seedRate: number; // 播种密度 (需求量 / 米)
  cruiseHeight: number; // 巡航高度 (m)
}

/** 播种航带 = CARP 中的必服务边 e_i。 */
export interface Strip {
  id: number;
  start: Vec2;
  end: Vec2;
  length: number; // l_i
  demand: number; // q_i 所需种子量
  cost: number; // c_i 服务飞行成本 (≈ 长度)
}

/** 障碍物 / 禁飞区。 */
export interface Obstacle {
  kind: 'pond' | 'rock' | 'noflyzone';
  center: Vec2;
  radius: number;
}

/** 一趟飞行路线 P_k:从 depot 出发、服务若干航带后返回 depot。 */
export interface Route {
  strips: number[]; // 有序航带 id
  totalDistance: number;
  totalDemand: number;
  energyCost: number;
}

/** 完整的农田/任务数据。 */
export interface FieldData {
  boundary: Vec2[]; // 地块边界多边形 (逆时针)
  depot: Vec2; // 起降补给点 v0
  obstacles: Obstacle[];
  stripWidth: number; // 播种幅宽
  stripAngleDeg: number; // 航带方向角
  drone: DroneParams;
  strips: Strip[]; // 生成的必服务航带集合 R
}
