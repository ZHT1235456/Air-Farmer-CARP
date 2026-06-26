import { useAppStore } from "../../store/appStore";
import type { DroneParams } from "../../types/domain";

interface Row {
  key: keyof DroneParams;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

const ROWS: Row[] = [
  { key: "speed", label: "飞行速度", unit: "m/s", min: 1, max: 30, step: 1 },
  { key: "seedCapacity", label: "种箱容量", unit: "", min: 50, max: 400, step: 10 },
  { key: "batteryDistance", label: "电池航程", unit: "m", min: 200, max: 1500, step: 20 },
  { key: "seedWidth", label: "播种幅宽", unit: "m", min: 2, max: 10, step: 0.5 },
  { key: "seedRate", label: "单位种子量", unit: "/m", min: 0.5, max: 3, step: 0.1 },
];

/** 无人机参数配置（改幅宽/种子量会重算航带） */
export default function DroneParamPanel() {
  const drone = useAppStore((s) => s.droneParams);
  const setDroneParams = useAppStore((s) => s.setDroneParams);

  return (
    <div className="param-panel">
      {ROWS.map((r) => (
        <label key={r.key} className="param-row">
          <span className="param-row__label">
            {r.label}
            <span className="param-row__val mono">
              {drone[r.key]}
              {r.unit}
            </span>
          </span>
          <input
            type="range"
            min={r.min}
            max={r.max}
            step={r.step}
            value={drone[r.key]}
            onChange={(e) => setDroneParams({ [r.key]: Number(e.target.value) } as Partial<DroneParams>)}
          />
        </label>
      ))}
    </div>
  );
}
