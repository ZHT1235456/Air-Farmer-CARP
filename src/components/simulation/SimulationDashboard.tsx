import { useSyncExternalStore } from "react";
import type { SimSnapshot } from "../../simulation/simulationEngine";
import { simStore } from "../../simulation/simStore";
import type { DroneParams, SimulationStatus } from "../../types/domain";

const EMPTY: SimSnapshot = {
  status: "idle",
  pos: { x: 0, y: 0 },
  heading: 0,
  tripIndex: 1,
  totalTrips: 1,
  currentStripId: null,
  batteryPct: 1,
  seedPct: 1,
  distanceFlown: 0,
  totalDistance: 0,
  coveredArea: 0,
  coverageRate: 0,
  returns: 0,
  etaSec: 0,
  seededStripIds: new Set(),
  isSeeding: false,
  currentRouteIndex: 0,
};

const STATUS_CN: Record<SimulationStatus, string> = {
  idle: "待开始",
  running: "飞行中",
  paused: "已暂停",
  seeding: "播种中",
  returning: "返航中",
  refilling: "补给中",
  completed: "已完成",
};

const fmt = (n: number, d = 1) => n.toLocaleString("zh-CN", { maximumFractionDigits: d });

interface Props {
  drone: DroneParams;
  algorithmLabel: string;
}

export default function SimulationDashboard({ drone, algorithmLabel }: Props) {
  const s = useSyncExternalStore(simStore.subscribe, simStore.get, simStore.get) ?? EMPTY;
  return (
    <div className="dash">
      <div className={"dash__status dash__status--" + s.status}>
        {STATUS_CN[s.status]}
      </div>

      {/* 电池 / 种箱 条 */}
      <Gauge label="电池" pct={s.batteryPct} color="#5a7d4f" />
      <Gauge label="种箱" pct={s.seedPct} color="#d9a441" />

      <dl className="dash__metrics">
        <Row k="当前算法" v={algorithmLabel} />
        <Row k="当前路线" v={`${s.tripIndex} / ${s.totalTrips}`} />
        <Row k="当前航带" v={s.currentStripId ?? "—"} />
        <Row k="飞行速度" v={`${drone.speed} m/s`} />
        <Row k="已飞距离" v={`${fmt(s.distanceFlown)} m`} />
        <Row k="已播面积" v={`${fmt(s.coveredArea)} ㎡`} />
        <Row k="覆盖率" v={`${fmt(s.coverageRate * 100)}%`} />
        <Row k="返航次数" v={`${s.returns}`} />
        <Row k="预计剩余" v={`${fmt(s.etaSec)} s`} />
      </dl>
    </div>
  );
}

function Gauge({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="gauge">
      <div className="gauge__head">
        <span>{label}</span>
        <span className="mono">{Math.round(pct * 100)}%</span>
      </div>
      <div className="gauge__track">
        <div className="gauge__fill" style={{ width: `${pct * 100}%`, background: color }} />
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="dash__row">
      <dt>{k}</dt>
      <dd className="mono">{v}</dd>
    </div>
  );
}
