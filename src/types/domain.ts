/* ============================================================
   领域模型 —— CARP 无人机播种航线规划
   后续 geometry / algorithms / three / simulation 模块均复用本契约
   对应规格《air_farmer_prompt.md》第十节
   ============================================================ */

export interface Point2D {
  x: number;
  y: number;
}

/** 田间障碍物：点状（电线杆/树干）、线状（架空线/沟渠）、多边形（禁飞区） */
export interface Obstacle {
  id: string;
  type: "point" | "line" | "polygon";
  /** point 类型使用 */
  position?: Point2D;
  /** line / polygon 类型使用 */
  points?: Point2D[];
  /** point 类型的影响半径 */
  radius?: number;
  /** 安全缓冲距离 */
  buffer?: number;
  label: string;
}

/** 播种航带 —— CARP 中的必服务边 */
export interface Strip {
  id: string;
  fieldId: string;
  start: Point2D;
  end: Point2D;
  /** 航带长度 */
  length: number;
  /** 服务该航带所需种子量（边需求量 q_e） */
  demand: number;
  /** 服务成本 */
  cost: number;
  /** 覆盖播种面积 */
  coveredArea: number;
  /** 航带方向（弧度） */
  direction: number;
  /** 是否由障碍物切分产生 */
  blockedByObstacle: boolean;
}

/** 单片农田 */
export interface Field {
  id: string;
  name: string;
  polygon: Point2D[];
  /** 航带生成方向（弧度） */
  stripDirection: number;
  strips: Strip[];
}

/** 完整场景：可含多片农田 */
export interface Scenario {
  id: string;
  name: string;
  description: string;
  fields: Field[];
  obstacles: Obstacle[];
  /** 起降点 / 补给点 v0 */
  depot: Point2D;
  defaultDroneParams: DroneParams;
}

/** 无人机参数 */
export interface DroneParams {
  /** 飞行速度 */
  speed: number;
  /** 种箱容量 Q */
  seedCapacity: number;
  /** 最大航程 / 电池预算 B */
  batteryDistance: number;
  /** 单位长度种子消耗量 */
  seedRate: number;
  /** 播种幅宽 */
  seedWidth: number;
}

/** 一趟路线：从 depot 出发并返回 depot */
export interface Route {
  id: string;
  strips: Strip[];
  pathPoints: Point2D[];
  distance: number;
  demand: number;
  feasible: boolean;
}

/** 约束违反信息 */
export interface ConstraintViolation {
  type: "capacity" | "battery" | "coverage" | "obstacle";
  message: string;
  routeId?: string;
  stripId?: string;
}

/** 用于 Three.js 渲染的路线线段 */
export interface RouteSegment {
  id: string;
  routeId: string;
  from: Point2D;
  to: Point2D;
  /** service: 播种服务段 / transfer: 空飞转移段 / return: 返航段 */
  type: "service" | "transfer" | "return";
  stripId?: string;
}

/** 算法统一输出 */
export interface PlanResult {
  algorithm: AlgorithmMode;
  routes: Route[];
  totalDistance: number;
  returnCount: number;
  coverageRate: number;
  runtimeMs: number;
  feasible: boolean;
  violations: ConstraintViolation[];
  routeSegments: RouteSegment[];
}

/** 算法统一输入 */
export interface PlanInput {
  scenario: Scenario;
  strips: Strip[];
  depot: Point2D;
  droneParams: DroneParams;
  /** 航带端点与补给点之间的转移距离矩阵 */
  distanceMatrix: number[][];
  algorithmOptions: AlgorithmOptions;
}

/** 算法参数 */
export interface AlgorithmOptions {
  populationSize?: number;
  maxIterations?: number;
  mutationRate?: number;
  /** 适应度权重：距离 / 返航 / 约束违反 / 未服务 */
  weights?: {
    distance: number;
    returns: number;
    violation: number;
    uncovered: number;
  };
  seed?: number;
}

export type AlgorithmMode =
  | "pathScanning"
  | "genetic"
  | "memetic"
  | "vns"
  | "compare";

/** 仿真任务状态（规格第 8.3 节） */
export type SimulationStatus =
  | "idle"
  | "running"
  | "paused"
  | "seeding"
  | "returning"
  | "refilling"
  | "completed";

/** 主播放控制状态（规格第 8.6 节） */
export type SimulationPlaybackState = "idle" | "running" | "paused" | "completed";

/** 相机交互模式（规格第 8.8 节） */
export type InteractionMode = "rotate" | "pan";
