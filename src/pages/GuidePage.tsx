import { useNavigate } from "react-router-dom";
import "./Guide.css";

interface FlowStep {
  label: string;
  note: string;
}
const FLOW: FlowStep[] = [
  { label: "选择场景", note: "在场景预览页挑选农田" },
  { label: "查看航带", note: "俯视确认航带与障碍" },
  { label: "配置参数", note: "设置无人机速度 / 容量 / 航程" },
  { label: "选择算法", note: "Path Scanning / GA / MemeticGA / VNS" },
  { label: "生成航线", note: "求解并对比各算法指标" },
  { label: "播种模拟", note: "三维演示飞行与播种" },
];

interface PageCard {
  no: string;
  name: string;
  to: string;
  desc: string;
  tip: string;
}
const PAGES: PageCard[] = [
  {
    no: "01",
    name: "首页",
    to: "/",
    desc: "介绍系统背景、CARP 建模思路与核心数学表达，是了解项目逻辑链条的入口。",
    tip: "点击「进入系统」从场景预览开始。",
  },
  {
    no: "02",
    name: "场景预览",
    to: "/scene",
    desc: "切换多种内置农田与障碍物场景，三维俯视查看航带划分、补给点位置与场景统计。",
    tip: "右侧栏可直接跳转到航线规划。",
  },
  {
    no: "03",
    name: "航线规划",
    to: "/planning",
    desc: "配置无人机参数，选择求解算法生成播种航线，查看收敛曲线与多算法指标对比表。",
    tip: "生成结果后点「进入播种模拟」携带航线进入仿真。",
  },
  {
    no: "04",
    name: "播种模拟",
    to: "/simulation",
    desc: "Three.js 三维演示无人机沿规划航线飞行、逐条播种、电量与种箱耗尽后返航补给的完整过程。",
    tip: "未先规划时会自动用 Path Scanning 生成默认航线。",
  },
  {
    no: "05",
    name: "操作说明",
    to: "/guide",
    desc: "汇总使用流程、各页面功能、算法含义与评价指标，便于快速理解整体系统。",
    tip: "当前页面。",
  },
];

interface ConsoleKey {
  icon: string;
  name: string;
  desc: string;
}
const CONSOLE_KEYS: ConsoleKey[] = [
  { icon: "▶", name: "开始 / 继续", desc: "启动模拟，暂停后再次点击继续，完成后变为重新开始。" },
  { icon: "⏸", name: "暂停", desc: "运行中点击暂停飞行，无人机原地保持。" },
  { icon: "↻", name: "重置", desc: "回到初始状态，无人机返回补给点、清空已播种航带。" },
  { icon: "⏪", name: "减速", desc: "降低播放倍速（0.5× / 1× / 2× / 4×）。" },
  { icon: "⏩", name: "加速", desc: "提高播放倍速，便于快速浏览整段任务。" },
  { icon: "←", name: "返回规划", desc: "回到航线规划页，调整参数或重新求解。" },
];

interface AlgoItem {
  tag: string;
  name: string;
  en: string;
  desc: string;
  fit: string;
}
const ALGORITHMS: AlgoItem[] = [
  {
    tag: "快速构造",
    name: "Path Scanning",
    en: "扫描构造启发式",
    desc: "用多条扫描规则逐边构造候选解，取综合成本最低者。计算极快，结果稳定。",
    fit: "交互式快速预览、生成默认航线。",
  },
  {
    tag: "全局优化",
    name: "遗传算法 GA",
    en: "Genetic Algorithm",
    desc: "把航带访问顺序编码为排列，经 OX 交叉与多种变异迭代搜索更短的总航线。",
    fit: "在解空间中做全局搜索，跳出局部最优。",
  },
  {
    tag: "高质量",
    name: "MemeticGA",
    en: "记忆遗传算法",
    desc: "遗传算法叠加局部搜索的混合元启发式，对精英个体执行轻量 VNS 细化。",
    fit: "中小规模实例上追求更稳定的高质量解。",
  },
  {
    tag: "局部改进",
    name: "变邻域搜索 VNS",
    en: "Variable Neighborhood Search",
    desc: "围绕当前解定义 swap / insertion / inversion / relocate / exchange 等邻域系统切换。",
    fit: "对已有解做深度局部打磨。",
  },
];

interface Metric {
  name: string;
  desc: string;
}
const METRICS: Metric[] = [
  { name: "总航程", desc: "无人机完成全部播种所飞行的总距离，越短越优。" },
  { name: "返航次数", desc: "因电量或种箱耗尽返回补给点的次数，反映任务连续性。" },
  { name: "覆盖率", desc: "已服务航带占全部必服务航带的比例，目标为 100%。" },
  { name: "运行时间", desc: "算法求解耗时，衡量计算效率，用于同等质量下的取舍。" },
  { name: "约束违反", desc: "违反容量 / 航程约束的次数，可行解应为 0。" },
  { name: "综合成本", desc: "总航程与返航、违反等惩罚的加权合，是算法择优的统一口径。" },
];

export default function GuidePage() {
  const navigate = useNavigate();
  return (
    <div className="guide">
      {/* 头部 */}
      <header className="guide__hero container">
        <span className="eyebrow">User Guide · 操作说明</span>
        <h1 className="guide__title">从农田到航线，再到三维播种</h1>
        <p className="guide__lead">
          空中农夫把无人机播种问题建模为带容量约束的弧路径问题（CARP），
          通过场景预览、航线规划与播种模拟三个环节，完整呈现从建模到求解再到仿真的逻辑链条。
        </p>
        <div className="guide__cta">
          <button className="btn-primary" onClick={() => navigate("/scene")}>
            开始使用 <span className="arrow">→</span>
          </button>
          <button className="btn-ghost" onClick={() => navigate("/")}>
            返回首页
          </button>
        </div>
      </header>

      {/* 使用流程 */}
      <section className="guide__section container">
        <div className="guide__head">
          <span className="eyebrow">Workflow · 使用流程</span>
          <h2 className="guide__h2">六步走完一次完整规划</h2>
        </div>
        <ol className="g-flow">
          {FLOW.map((s, i) => (
            <li
              key={s.label}
              className="g-flow__step reveal"
              style={{ animationDelay: `${0.04 + i * 0.07}s` }}
            >
              <div className="g-flow__node">
                <span className="g-flow__idx mono">{String(i + 1).padStart(2, "0")}</span>
                <span className="g-flow__label">{s.label}</span>
                <span className="g-flow__note">{s.note}</span>
              </div>
              {i < FLOW.length - 1 && (
                <span className="g-flow__arrow" aria-hidden="true">
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* 页面导览 */}
      <section className="guide__section guide__section--tint">
        <div className="container">
          <div className="guide__head">
            <span className="eyebrow">Pages · 页面导览</span>
            <h2 className="guide__h2">每个页面在做什么</h2>
          </div>
          <div className="g-page-grid">
            {PAGES.map((p, i) => (
              <article
                key={p.name}
                className="g-page-card card reveal"
                style={{ animationDelay: `${0.05 + i * 0.06}s` }}
                onClick={() => navigate(p.to)}
                role="link"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(p.to);
                }}
              >
                <span className="g-page-card__no mono">{p.no}</span>
                <h3 className="g-page-card__name">{p.name}</h3>
                <p className="g-page-card__desc">{p.desc}</p>
                <p className="g-page-card__tip mono">{p.tip}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 控制台操作 */}
      <section className="guide__section container">
        <div className="guide__head">
          <span className="eyebrow">Console · 仿真控制台</span>
          <h2 className="guide__h2">播种模拟的按键说明</h2>
        </div>
        <div className="g-key-grid">
          {CONSOLE_KEYS.map((k, i) => (
            <div
              key={k.name}
              className="g-key reveal"
              style={{ animationDelay: `${0.04 + i * 0.05}s` }}
            >
              <span className="g-key__icon" aria-hidden="true">
                {k.icon}
              </span>
              <div className="g-key__text">
                <span className="g-key__name">{k.name}</span>
                <span className="g-key__desc">{k.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 算法说明 */}
      <section className="guide__section guide__section--tint">
        <div className="container">
          <div className="guide__head">
            <span className="eyebrow">Algorithms · 算法说明</span>
            <h2 className="guide__h2">四类求解算法</h2>
            <p className="guide__sub">
              CARP 属 NP-hard，系统提供分层求解策略：从快速构造到全局优化，再到混合元启发式与局部改进。
            </p>
          </div>
          <div className="g-algo-grid">
            {ALGORITHMS.map((a, i) => (
              <article
                key={a.name}
                className="g-algo-card reveal"
                style={{ animationDelay: `${0.05 + i * 0.06}s` }}
              >
                <span className="g-algo-card__tag mono">{a.tag}</span>
                <h3 className="g-algo-card__name">{a.name}</h3>
                <span className="g-algo-card__en mono">{a.en}</span>
                <p className="g-algo-card__desc">{a.desc}</p>
                <p className="g-algo-card__fit">
                  <span className="g-algo-card__fit-tag">适用</span>
                  {a.fit}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 评价指标 */}
      <section className="guide__section container">
        <div className="guide__head">
          <span className="eyebrow">Metrics · 评价指标</span>
          <h2 className="guide__h2">如何读懂指标对比</h2>
        </div>
        <dl className="g-metric-grid">
          {METRICS.map((m, i) => (
            <div
              key={m.name}
              className="g-metric reveal"
              style={{ animationDelay: `${0.04 + i * 0.05}s` }}
            >
              <dt className="g-metric__name">{m.name}</dt>
              <dd className="g-metric__desc">{m.desc}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="guide__foot container">
        <p className="mono">
          空中农夫 · 基于 CARP 的无人机播种航线规划仿真系统 · NP 复杂性与近似算法课程作业
        </p>
      </footer>
    </div>
  );
}
