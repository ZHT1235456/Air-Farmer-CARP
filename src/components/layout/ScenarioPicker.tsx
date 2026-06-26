import { useAppStore } from "../../store/appStore";

/** 场景选择器（场景预览与航线规划共用） */
export default function ScenarioPicker() {
  const scenarios = useAppStore((s) => s.scenarios);
  const currentId = useAppStore((s) => s.currentScenarioId);
  const setScenario = useAppStore((s) => s.setScenario);

  return (
    <div className="scenario-picker">
      {scenarios.map((s) => (
        <button
          key={s.id}
          className={"scenario-picker__item" + (s.id === currentId ? " is-active" : "")}
          onClick={() => setScenario(s.id)}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}
