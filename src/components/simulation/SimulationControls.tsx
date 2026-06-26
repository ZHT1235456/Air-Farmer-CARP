import { useSyncExternalStore } from "react";
import { simStore } from "../../simulation/simStore";
import type { SimulationPlaybackState, SimulationStatus } from "../../types/domain";
import { Icon, type IconName } from "../common/icons";

interface Props {
  speed: number;
  onToggle: () => void;
  onSpeedDown: () => void;
  onSpeedUp: () => void;
  onReset: () => void;
  onBack: () => void;
}

function toPlayback(status: SimulationStatus | undefined): SimulationPlaybackState {
  if (status === "paused") return "paused";
  if (status === "completed") return "completed";
  if (status === undefined || status === "idle") return "idle";
  return "running";
}

function primaryIcon(state: SimulationPlaybackState): IconName {
  if (state === "running") return "pause";
  if (state === "completed") return "reset";
  return "play";
}
function primaryLabel(state: SimulationPlaybackState): string {
  if (state === "idle") return "开始模拟";
  if (state === "running") return "暂停模拟";
  if (state === "paused") return "继续模拟";
  return "重新开始";
}

/** 地面站式图标控制台（规格 8.5–8.8） */
export default function SimulationControls({
  speed,
  onToggle,
  onSpeedDown,
  onSpeedUp,
  onReset,
  onBack,
}: Props) {
  const snap = useSyncExternalStore(simStore.subscribe, simStore.get, simStore.get);
  const state = toPlayback(snap?.status);
  return (
    <div className="sim-console" role="toolbar" aria-label="仿真控制台">
      <button className="sim-btn sim-btn--ghost" title="返回航线规划" aria-label="返回航线规划" onClick={onBack}>
        <Icon name="back" size={18} />
      </button>
      <span className="sim-sep" />

      <button className="sim-btn" title="减速" aria-label="减速" onClick={onSpeedDown}>
        <Icon name="slower" size={18} />
      </button>
      <button
        className="sim-btn sim-btn--primary"
        title={primaryLabel(state)}
        aria-label={primaryLabel(state)}
        onClick={onToggle}
      >
        <Icon name={primaryIcon(state)} size={22} />
      </button>
      <button className="sim-btn" title="加速" aria-label="加速" onClick={onSpeedUp}>
        <Icon name="faster" size={18} />
      </button>
      <span className="sim-speed mono" title="当前倍速">
        {speed}×
      </span>

      <span className="sim-sep" />
      <button className="sim-btn" title="重置" aria-label="重置" onClick={onReset}>
        <Icon name="reset" size={18} />
      </button>
    </div>
  );
}
