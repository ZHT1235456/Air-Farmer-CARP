import type { DroneParams, Scenario } from "../types/domain";
import { buildScenario, type ScenarioDef } from "./scenarioFactory";

/** 默认无人机参数（各场景可继承或覆盖） */
const DEFAULT_DRONE: DroneParams = {
  speed: 8,
  // 容量与航程需容纳单条最长航带（demand≈长度），并让一趟服务数条后触发返航补给
  seedCapacity: 180,
  batteryDistance: 700,
  seedRate: 1,
  seedWidth: 4,
};

const HALF_PI = Math.PI / 2;

const DEFS: ScenarioDef[] = [
  {
    id: "rectangle",
    name: "矩形农田",
    description: "长矩形地块，沿长边方向布设航带以减少返航转移。",
    depot: { x: 35, y: -8 },
    droneParams: DEFAULT_DRONE,
    obstacles: [],
    fields: [
      {
        id: "F1",
        name: "长条田",
        stripDirection: 0,
        polygon: [
          { x: 0, y: 0 },
          { x: 72, y: 0 },
          { x: 72, y: 38 },
          { x: 0, y: 38 },
        ],
      },
    ],
  },
  {
    id: "trapezoid",
    name: "梯形农田",
    description: "梯形地块，航带按边界自动裁剪为不等长航带。",
    depot: { x: 30, y: -8 },
    droneParams: DEFAULT_DRONE,
    obstacles: [],
    fields: [
      {
        id: "F1",
        name: "梯形田",
        stripDirection: 0,
        polygon: [
          { x: 8, y: 0 },
          { x: 56, y: 0 },
          { x: 64, y: 46 },
          { x: 0, y: 46 },
        ],
      },
    ],
  },
  {
    id: "polygon",
    name: "不规则多边形农田",
    description: "不规则边界地块，航带长度随边界变化，体现裁剪能力。",
    depot: { x: 30, y: -8 },
    droneParams: DEFAULT_DRONE,
    obstacles: [],
    fields: [
      {
        id: "F1",
        name: "不规则田",
        stripDirection: 0,
        polygon: [
          { x: 6, y: 2 },
          { x: 34, y: 0 },
          { x: 60, y: 12 },
          { x: 58, y: 40 },
          { x: 30, y: 52 },
          { x: 4, y: 36 },
          { x: 0, y: 16 },
        ],
      },
    ],
  },
  {
    id: "multi",
    name: "多片农田组合",
    description:
      "多片相邻拼接的不规则地块铺满区域，每片航带方向各异（含斜向），模拟真实农田航拍中的马赛克作物纹理。",
    depot: { x: 45, y: -8 },
    droneParams: DEFAULT_DRONE,
    obstacles: [],
    // 共享顶点拼接：6 片四边形完整覆盖 0..90 × 0..60，相邻边吻合
    fields: [
      {
        id: "F1",
        name: "西南地块",
        stripDirection: 0,
        polygon: [
          { x: 0, y: 0 },
          { x: 34, y: 0 },
          { x: 30, y: 32 },
          { x: 0, y: 28 },
        ],
      },
      {
        id: "F2",
        name: "中南地块",
        stripDirection: HALF_PI,
        polygon: [
          { x: 34, y: 0 },
          { x: 64, y: 0 },
          { x: 60, y: 26 },
          { x: 30, y: 32 },
        ],
      },
      {
        id: "F3",
        name: "东南地块",
        stripDirection: Math.PI / 4,
        polygon: [
          { x: 64, y: 0 },
          { x: 90, y: 0 },
          { x: 90, y: 30 },
          { x: 60, y: 26 },
        ],
      },
      {
        id: "F4",
        name: "西北地块",
        stripDirection: Math.PI / 3,
        polygon: [
          { x: 0, y: 28 },
          { x: 30, y: 32 },
          { x: 32, y: 60 },
          { x: 0, y: 60 },
        ],
      },
      {
        id: "F5",
        name: "中北地块",
        stripDirection: 0,
        polygon: [
          { x: 30, y: 32 },
          { x: 60, y: 26 },
          { x: 62, y: 60 },
          { x: 32, y: 60 },
        ],
      },
      {
        id: "F6",
        name: "东北地块",
        stripDirection: -Math.PI / 4,
        polygon: [
          { x: 60, y: 26 },
          { x: 90, y: 30 },
          { x: 90, y: 60 },
          { x: 62, y: 60 },
        ],
      },
    ],
  },
  {
    id: "obstacle-area",
    name: "含障碍物农田",
    description: "地块内含矩形禁飞区与点状障碍，相交航带被切分为多条必服务子航带。",
    depot: { x: 28, y: -8 },
    droneParams: DEFAULT_DRONE,
    obstacles: [
      {
        id: "O1",
        type: "polygon",
        label: "禁飞区",
        buffer: 1.5,
        points: [
          { x: 18, y: 20 },
          { x: 34, y: 20 },
          { x: 34, y: 34 },
          { x: 18, y: 34 },
        ],
      },
      {
        id: "O2",
        type: "point",
        label: "孤立树丛",
        position: { x: 44, y: 14 },
        radius: 3,
        buffer: 2,
      },
    ],
    fields: [
      {
        id: "F1",
        name: "障碍田",
        stripDirection: 0,
        polygon: [
          { x: 0, y: 0 },
          { x: 56, y: 0 },
          { x: 56, y: 50 },
          { x: 0, y: 50 },
        ],
      },
    ],
  },
  {
    id: "linear-obstacle",
    name: "含杆线障碍农田",
    description:
      "高压电塔向多个方向放射出架空线，多根电线杆散布田中，左下角水塘形成禁飞区，杆线与水域把农田切割为多条必服务子航带。",
    depot: { x: 40, y: -8 },
    droneParams: DEFAULT_DRONE,
    obstacles: [
      // 主枢纽：高压电塔
      {
        id: "T1",
        type: "point",
        label: "高压电塔",
        position: { x: 38, y: 30 },
        radius: 2.2,
        buffer: 2.5,
      },
      // 沿架空线分布的电线杆
      { id: "P1", type: "point", label: "电线杆", position: { x: 16, y: 36 }, radius: 1, buffer: 1.8 },
      { id: "P2", type: "point", label: "电线杆", position: { x: 60, y: 24 }, radius: 1, buffer: 1.8 },
      // 一条架空线横穿农田，串起电塔与电线杆
      {
        id: "L1",
        type: "line",
        label: "架空电力线",
        buffer: 2.2,
        points: [
          { x: -4, y: 42 },
          { x: 16, y: 36 },
          { x: 38, y: 30 },
          { x: 60, y: 24 },
          { x: 84, y: 18 },
        ],
      },
      // 水塘 / 沟渠禁飞区
      {
        id: "W1",
        type: "polygon",
        label: "水塘",
        buffer: 1,
        points: [
          { x: 0, y: 0 },
          { x: 20, y: 0 },
          { x: 15, y: 15 },
          { x: 0, y: 18 },
        ],
      },
    ],
    fields: [
      {
        id: "F1",
        name: "杆线田",
        stripDirection: 0,
        polygon: [
          { x: 0, y: 0 },
          { x: 80, y: 0 },
          { x: 80, y: 50 },
          { x: 0, y: 50 },
        ],
      },
    ],
  },
];

/** 全部内置场景（构建一次，模块级缓存） */
export const BUILT_IN_SCENARIOS: Scenario[] = DEFS.map(buildScenario);

export function getScenarioById(id: string): Scenario | undefined {
  return BUILT_IN_SCENARIOS.find((s) => s.id === id);
}
