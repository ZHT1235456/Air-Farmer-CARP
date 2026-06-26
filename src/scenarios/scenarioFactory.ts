import type {
  DroneParams,
  Field,
  Obstacle,
  Point2D,
  Scenario,
  Strip,
} from "../types/domain";
import { generateStrips, suggestStripDirection } from "../geometry/stripGenerator";
import { splitStrips } from "../geometry/obstacleSplitter";
import { dist } from "../geometry/distance";
import { polygonArea } from "../geometry/polygon";

/** 单片农田的定义输入（航带由工厂自动生成） */
export interface FieldDef {
  id: string;
  name: string;
  polygon: Point2D[];
  /** 航带方向（弧度）；省略时取最长边方向 */
  stripDirection?: number;
}

export interface ScenarioDef {
  id: string;
  name: string;
  description: string;
  fields: FieldDef[];
  obstacles: Obstacle[];
  depot: Point2D;
  droneParams: DroneParams;
}

/** 由场景定义生成完整 Scenario：自动生成、切分并赋属性给航带 */
export function buildScenario(def: ScenarioDef): Scenario {
  const { droneParams } = def;
  const spacing = droneParams.seedWidth;
  let counter = 0;

  const fields: Field[] = def.fields.map((fd) => {
    const direction = fd.stripDirection ?? suggestStripDirection(fd.polygon);
    const rawSegments = generateStrips(fd.polygon, direction, spacing);
    const splitSegments = splitStrips(rawSegments, def.obstacles);

    const strips: Strip[] = splitSegments.map((seg) => {
      const length = dist(seg.start, seg.end);
      counter += 1;
      return {
        id: `S-${counter}`,
        fieldId: fd.id,
        start: seg.start,
        end: seg.end,
        length,
        demand: length * droneParams.seedRate,
        cost: length,
        coveredArea: length * droneParams.seedWidth,
        direction,
        blockedByObstacle: seg.split,
      };
    });

    return {
      id: fd.id,
      name: fd.name,
      polygon: fd.polygon,
      stripDirection: direction,
      strips,
    };
  });

  return {
    id: def.id,
    name: def.name,
    description: def.description,
    fields,
    obstacles: def.obstacles,
    depot: def.depot,
    defaultDroneParams: droneParams,
  };
}

/** 场景统计信息 */
export interface ScenarioStats {
  fieldCount: number;
  stripCount: number;
  obstacleCount: number;
  totalArea: number;
  coveredArea: number;
  totalDemand: number;
  blockedStripCount: number;
}

/** 用新的无人机参数重算某场景的航带（保留田块多边形/方向/障碍/depot） */
export function rebuildScenario(scenario: Scenario, drone: DroneParams): Scenario {
  return buildScenario({
    id: scenario.id,
    name: scenario.name,
    description: scenario.description,
    depot: scenario.depot,
    obstacles: scenario.obstacles,
    droneParams: drone,
    fields: scenario.fields.map((f) => ({
      id: f.id,
      name: f.name,
      polygon: f.polygon,
      stripDirection: f.stripDirection,
    })),
  });
}

export function computeScenarioStats(scenario: Scenario): ScenarioStats {
  const strips = scenario.fields.flatMap((f) => f.strips);
  return {
    fieldCount: scenario.fields.length,
    stripCount: strips.length,
    obstacleCount: scenario.obstacles.length,
    totalArea: scenario.fields.reduce((s, f) => s + polygonArea(f.polygon), 0),
    coveredArea: strips.reduce((s, st) => s + st.coveredArea, 0),
    totalDemand: strips.reduce((s, st) => s + st.demand, 0),
    blockedStripCount: strips.filter((s) => s.blockedByObstacle).length,
  };
}
