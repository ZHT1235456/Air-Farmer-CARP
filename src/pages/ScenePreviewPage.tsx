import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore, useCurrentScenario } from "../store/appStore";
import { computeScenarioStats } from "../scenarios/scenarioFactory";
import Workspace, { SidebarSection, SidebarHeader } from "../components/layout/Workspace";
import ScenarioPicker from "../components/layout/ScenarioPicker";
import SceneCanvas from "../three/SceneCanvas";
import "./ScenePreview.css";

const fmt = (n: number, d = 1) =>
  n.toLocaleString("zh-CN", { maximumFractionDigits: d });

export default function ScenePreviewPage() {
  const navigate = useNavigate();
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

  const left = (
    <>
      <SidebarHeader eyebrow="Scene Preview · 场景预览" title={scenario.name} />
      <p className="side-desc">{scenario.description}</p>

      <SidebarSection title="内置场景">
        <ScenarioPicker />
      </SidebarSection>

      <SidebarSection title="场景统计">
        <dl className="stat-list">
          <Stat k="农田片数" v={`${stats.fieldCount}`} />
          <Stat k="航带数量" v={`${stats.stripCount}`} />
          <Stat k="障碍物" v={`${stats.obstacleCount}`} />
          <Stat k="被切分航带" v={`${stats.blockedStripCount}`} />
          <Stat k="农田面积" v={`${fmt(stats.totalArea)} ㎡`} />
          <Stat k="预计播种面积" v={`${fmt(stats.coveredArea)} ㎡`} />
          <Stat k="总需求种子量" v={`${fmt(stats.totalDemand)}`} />
        </dl>
      </SidebarSection>

      <p className="side-hint mono">点击航带查看详情 · 拖拽旋转 · 滚轮缩放</p>
    </>
  );

  const right = (
    <>
      <SidebarHeader eyebrow="Strip · 航带信息" title={selected ? selected.strip.id : "未选中"} />
      {selected ? (
        <SidebarSection>
          <dl className="stat-list">
            <Stat k="所属农田" v={selected.fieldName} />
            <Stat k="长度" v={`${fmt(selected.strip.length)} m`} />
            <Stat k="需求种子量" v={`${fmt(selected.strip.demand)}`} />
            <Stat k="覆盖面积" v={`${fmt(selected.strip.coveredArea)} ㎡`} />
            <Stat k="起点" v={`(${fmt(selected.strip.start.x)}, ${fmt(selected.strip.start.y)})`} />
            <Stat k="终点" v={`(${fmt(selected.strip.end.x)}, ${fmt(selected.strip.end.y)})`} />
            <Stat k="障碍切分" v={selected.strip.blockedByObstacle ? "是" : "否"} />
          </dl>
          <button className="btn-ghost side-clear" onClick={() => selectStrip(null)}>
            取消选中
          </button>
        </SidebarSection>
      ) : (
        <p className="side-desc">在三维场景中点击任意播种航带，查看其编号、长度、需求与坐标。</p>
      )}

      <div className="side-go">
        <button className="btn-primary" onClick={() => navigate("/planning")}>
          前往航线规划 <span className="arrow">→</span>
        </button>
      </div>
    </>
  );

  return (
    <Workspace left={left} right={right}>
      <SceneCanvas scenario={scenario} />
    </Workspace>
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
