import type { Scenario } from "../types/domain";
import { useAppStore } from "../store/appStore";
import WorldCanvas from "./WorldCanvas";

/** 场景预览画布：写实世界 + 航带点击清除 */
export default function SceneCanvas({ scenario }: { scenario: Scenario }) {
  const selectStrip = useAppStore((s) => s.selectStrip);
  return <WorldCanvas scenario={scenario} onPointerMissed={() => selectStrip(null)} />;
}
