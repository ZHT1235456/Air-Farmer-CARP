import { useMemo } from "react";
import { useAppStore, useCurrentScenario } from "../store/appStore";
import { computeScenarioStats } from "../scenarios/scenarioFactory";
import SceneCanvas from "../three/SceneCanvas";
import "./ScenePreview.css";

const fmt = (n: number, d = 1) =>
  n.toLocaleString("zh-CN", { maximumFractionDigits: d });

export default function ScenePreviewPage() {
  const scenarios = useAppStore((s) => s.scenarios);
  const currentId = useAppStore((s) => s.currentScenarioId);
  const setScenario = useAppStore((s) => s.setScenario);
  const selectedStripId = useAppStore((s) => s.selectedStripId);
  const selectStrip = useAppStore((s) => s.selectStrip);

  const scenario = useCurrentScenario();
  const stats = useMemo(() => computeScenarioStats(scenario), [scenario]);

  const selected = useMemo(() => {
    if (!selectedStripId) return null;
    for (const f of scenario.fields) {
      const strip = f.strips.find((s) => s.id === selectedStripId);
      if (strip) return { strip, fieldName: f.name };
    }
    return null;
  }, [scenario, selectedStripId]);

  return (
    <div className="scene-page">
      <SceneCanvas scenario={scenario} />

      {/* 左侧控制面板 */}
      <aside className="scene-panel">
        <span className="eyebrow">Scene Preview · 场景预览</span>
        <h1 className="scene-panel__title">{scenario.name}</h1>
        <p className="scene-panel__desc">{scenario.description}</p>

        <div className="scene-panel__group">
          <span className="scene-panel__label">内置场景</span>
          <div className="scene-list">
            {scenarios.map((s) => (
              <button
                key={s.id}
                className={"scene-list__item" + (s.id === currentId ? " is-active" : "")}
                onClick={() => setScenario(s.id)}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="scene-panel__group">
          <span className="scene-panel__label">场景统计</span>
          <dl className="scene-stats">
            <Stat k="农田片数" v={`${stats.fieldCount}`} />
            <Stat k="航带数量" v={`${stats.stripCount}`} />
            <Stat k="障碍物" v={`${stats.obstacleCount}`} />
            <Stat k="被切分航带" v={`${stats.blockedStripCount}`} />
            <Stat k="农田面积" v={`${fmt(stats.totalArea)} ㎡`} />
            <Stat k="预计播种面积" v={`${fmt(stats.coveredArea)} ㎡`} />
            <Stat k="总需求种子量" v={`${fmt(stats.totalDemand)}`} />
          </dl>
        </div>

        <p className="scene-panel__hint mono">点击航带查看详情 · 拖拽平移 · 滚轮缩放</p>
      </aside>

      {/* 航带信息卡 */}
      {selected && (
        <aside className="strip-card">
          <header className="strip-card__head">
            <h3 className="strip-card__title mono">{selected.strip.id}</h3>
            <button
              className="strip-card__close"
              onClick={() => selectStrip(null)}
              aria-label="关闭"
            >
              ×
            </button>
          </header>
          <dl className="strip-card__body">
            <Stat k="所属农田" v={selected.fieldName} />
            <Stat k="长度" v={`${fmt(selected.strip.length)} m`} />
            <Stat k="需求种子量" v={`${fmt(selected.strip.demand)}`} />
            <Stat k="覆盖面积" v={`${fmt(selected.strip.coveredArea)} ㎡`} />
            <Stat
              k="起点"
              v={`(${fmt(selected.strip.start.x)}, ${fmt(selected.strip.start.y)})`}
            />
            <Stat
              k="终点"
              v={`(${fmt(selected.strip.end.x)}, ${fmt(selected.strip.end.y)})`}
            />
            <Stat k="障碍切分" v={selected.strip.blockedByObstacle ? "是" : "否"} />
          </dl>
        </aside>
      )}
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="stat-row">
      <dt>{k}</dt>
      <dd className="mono">{v}</dd>
    </div>
  );
}
