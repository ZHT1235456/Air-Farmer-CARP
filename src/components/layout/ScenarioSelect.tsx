import { useAppStore } from "../../store/appStore";

/** 场景选择下拉（航线规划页用，省空间） */
export default function ScenarioSelect() {
  const scenarios = useAppStore((s) => s.scenarios);
  const currentId = useAppStore((s) => s.currentScenarioId);
  const setScenario = useAppStore((s) => s.setScenario);

  return (
    <select
      className="dropdown"
      value={currentId}
      onChange={(e) => setScenario(e.target.value)}
    >
      {scenarios.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
