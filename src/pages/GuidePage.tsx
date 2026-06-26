import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, type IconName } from "../components/common/icons";
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
    desc: "介绍系统背景、CARP 建模思路与核心数学表达。",
    tip: "点击「进入系统」从场景预览开始。",
  },
  {
    no: "02",
    name: "场景预览",
    to: "/scene",
    desc: "切换内置农田与障碍物场景，三维俯视查看航带划分与统计。",
    tip: "右侧栏可直接跳转到航线规划。",
  },
  {
    no: "03",
    name: "航线规划",
    to: "/planning",
    desc: "配置参数、选择算法生成航线，查看收敛曲线与算法对比表。",
    tip: "结果后点「进入播种模拟」携带航线进入仿真。",
  },
  {
    no: "04",
    name: "播种模拟",
    to: "/simulation",
    desc: "三维演示无人机沿航线飞行、播种、返航补给的完整过程。",
    tip: "未先规划时会自动用 Path Scanning 生成默认航线。",
  },
  {
    no: "05",
    name: "操作说明",
    to: "/guide",
    desc: "本页：使用流程、页面导览、算法含义与评价指标汇总。",
    tip: "当前页。",
  },
];

interface ConsoleKey {
  icon: IconName;
  name: string;
  desc: string;
}
const CONSOLE_KEYS: ConsoleKey[] = [
  { icon: "play", name: "开始 / 继续", desc: "启动模拟，暂停后再点继续，完成后变为重新开始。" },
  { icon: "pause", name: "暂停", desc: "运行中点击暂停，无人机原地保持。" },
  { icon: "reset", name: "重置", desc: "回到初始状态，返回补给点、清空已播种航带。" },
  { icon: "slower", name: "减速", desc: "降低播放倍速（0.5× / 1× / 2× / 4×）。" },
  { icon: "faster", name: "加速", desc: "提高播放倍速，便于快速浏览整段任务。" },
  { icon: "back", name: "返回规划", desc: "回到航线规划页，调整参数或重新求解。" },
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
    desc: "用多条扫描规则逐边构造候选解，取综合成本最低者。计算极快、结果稳定。",
    fit: "交互式快速预览、生成默认航线。",
  },
  {
    tag: "全局优化",
    name: "遗传算法 GA",
    en: "Genetic Algorithm",
    desc: "把航带访问顺序编码为排列，经 OX 交叉与多种变异迭代搜索更短总航线。",
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
    desc: "围绕当前解定义 swap / insertion / inversion / relocate / exchange 邻域切换。",
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
  { name: "综合成本", desc: "总航程与返航、违反等惩罚的加权合，算法择优的统一口径。" },
];

interface Spread {
  chap: string; // 章号
  title: string; // 左页大标题
  en: string; // 英文小字
  hint: string; // 左页引言
  render: () => ReactNode;
}

const SPREADS: Spread[] = [
  {
    chap: "序",
    title: "从农田到航线，再到三维播种",
    en: "User Guide",
    hint: "空中农夫把无人机播种建模为带容量约束弧路径问题（CARP），通过场景预览、航线规划与播种模拟三个环节，呈现从建模到求解再到仿真的逻辑链条。",
    render: () => null,
  },
  {
    chap: "第一章",
    title: "使用流程",
    en: "Workflow",
    hint: "六步走完一次完整规划。",
    render: () => (
      <ol className="bk-list">
        {FLOW.map((s, i) => (
          <li key={s.label} className="bk-flow">
            <span className="bk-flow__idx mono">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <span className="bk-flow__label">{s.label}</span>
              <span className="bk-flow__note">{s.note}</span>
            </div>
          </li>
        ))}
      </ol>
    ),
  },
  {
    chap: "第二章",
    title: "页面导览",
    en: "Pages",
    hint: "每个页面在做什么。",
    render: () => (
      <div className="bk-pagegrid">
        {PAGES.map((p) => (
          <button
            key={p.name}
            className="bk-pagecard"
            onClick={() => navigateTo(p.to)}
          >
            <span className="bk-pagecard__no mono">{p.no}</span>
            <span className="bk-pagecard__name">{p.name}</span>
            <span className="bk-pagecard__desc">{p.desc}</span>
            <span className="bk-pagecard__tip mono">{p.tip}</span>
          </button>
        ))}
      </div>
    ),
  },
  {
    chap: "第三章",
    title: "仿真控制台",
    en: "Console",
    hint: "播种模拟的按键说明。",
    render: () => (
      <div className="bk-keygrid">
        {CONSOLE_KEYS.map((k) => (
          <div key={k.name} className="bk-key">
            <span className="bk-key__icon" aria-hidden="true">
              <Icon name={k.icon} size={18} />
            </span>
            <div className="bk-key__text">
              <span className="bk-key__name">{k.name}</span>
              <span className="bk-key__desc">{k.desc}</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    chap: "第四章",
    title: "求解算法",
    en: "Algorithms",
    hint: "CARP 属 NP-hard，系统提供分层求解策略。",
    render: () => (
      <div className="bk-algogrid">
        {ALGORITHMS.map((a) => (
          <article key={a.name} className="bk-algocard">
            <span className="bk-algocard__tag mono">{a.tag}</span>
            <h3 className="bk-algocard__name">{a.name}</h3>
            <span className="bk-algocard__en mono">{a.en}</span>
            <p className="bk-algocard__desc">{a.desc}</p>
            <p className="bk-algocard__fit">
              <span className="bk-algocard__fit-tag">适用</span>
              {a.fit}
            </p>
          </article>
        ))}
      </div>
    ),
  },
  {
    chap: "第五章",
    title: "评价指标",
    en: "Metrics",
    hint: "如何读懂指标对比。",
    render: () => (
      <dl className="bk-metricgrid">
        {METRICS.map((m) => (
          <div key={m.name} className="bk-metric">
            <dt className="bk-metric__name">{m.name}</dt>
            <dd className="bk-metric__desc">{m.desc}</dd>
          </div>
        ))}
      </dl>
    ),
  },
];

// 翻页时让 navigate 生效：用模块级变量绕过 hook 限制
let navigateTo: (to: string) => void = () => {};

export default function GuidePage() {
  const navigate = useNavigate();
  navigateTo = navigate;

  const [page, setPage] = useState(0);
  const total = SPREADS.length;
  const [dir, setDir] = useState<1 | -1>(1);

  const go = (delta: number) => {
    setDir(delta > 0 ? 1 : -1);
    setPage((p) => Math.max(0, Math.min(total - 1, p + delta)));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  const spread = SPREADS[page];

  return (
    <div className="guide">
      <div className="guide__topbar">
        <span className="eyebrow">User Guide · 操作说明</span>
      </div>

      <div className="book" role="region" aria-label="操作说明书">
        <button
          type="button"
          className="book__corner book__corner--prev"
          aria-label="上一页"
          disabled={page === 0}
          onClick={() => go(-1)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6 L9 12 L15 18" /></svg>
        </button>
        <div className="book__spine" aria-hidden="true" />
        <div
          key={page}
          className={"book__spread" + (dir === 1 ? " book__spread--in-r" : " book__spread--in-l")}
        >
          {/* 左页：标题/引言/插画 */}
          <div className="book__page book__page--l">
            <span className="book__chap mono">{spread.chap}</span>
            <h2 className="book__title">{spread.title}</h2>
            <span className="book__en mono">{spread.en}</span>
            <p className="book__hint">{spread.hint}</p>
          </div>
          {/* 右页：正文 */}
          <div className="book__page book__page--r">
            <div className="book__content">{spread.render()}</div>
            <span className="book__folio mono">{page + 1}</span>
          </div>
        </div>
        <button
          type="button"
          className="book__corner book__corner--next"
          aria-label="下一页"
          disabled={page === total - 1}
          onClick={() => go(1)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6 L15 12 L9 18" /></svg>
        </button>
      </div>

      <p className="guide__hint mono">← / → 翻阅 · 点击两侧书角翻页</p>
    </div>
  );
}