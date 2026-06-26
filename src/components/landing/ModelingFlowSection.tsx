interface FlowStep {
  label: string;
  note: string;
}

const STEPS: FlowStep[] = [
  { label: "现实问题", note: "无人机播种任务" },
  { label: "航带划分", note: "按播种幅宽切分" },
  { label: "图模型抽象", note: "端点为节点、航带为边" },
  { label: "CARP 建模", note: "必服务边 + 容量约束" },
  { label: "NP-hard", note: "无多项式精确解" },
  { label: "近似算法", note: "启发式 / 元启发式" },
];

interface AlgoItem {
  tag: string;
  name: string;
  en: string;
  desc: string;
}

/** 系统采用的四类近似 / 启发式 / 元启发式算法（对应论文算法设计章节） */
const ALGORITHMS: AlgoItem[] = [
  {
    tag: "快速构造",
    name: "Path Scanning",
    en: "扫描构造启发式",
    desc: "弧路径问题的经典构造式启发式。用多条扫描规则生成候选解，按评分 score(e)=ΔA(e)/(ΔC(e)+ε) 逐步选边，取综合成本最低者，适合交互式快速预览。",
  },
  {
    tag: "全局优化",
    name: "遗传算法 GA",
    en: "Genetic Algorithm",
    desc: "将航带访问顺序编码为排列，经路线分割器插入返航点；通过 OX 顺序交叉、swap / inversion / insertion 变异与修复机制，迭代搜索更短的总航线。",
  },
  {
    tag: "高质量",
    name: "MemeticGA",
    en: "记忆遗传算法",
    desc: "遗传算法与局部搜索结合的混合元启发式。对精英个体执行轻量 VNS，使其在进入下一代前完成局部细化，在中小规模实例上解质量更稳定。",
  },
  {
    tag: "局部改进",
    name: "变邻域搜索 VNS",
    en: "Variable Neighborhood Search",
    desc: "围绕当前解定义 swap、insertion、inversion、relocate、exchange 等多个邻域，在邻域间系统性切换搜索方向，降低陷入单一局部最优的风险。",
  },
];

export default function ModelingFlowSection() {
  return (
    <section className="section section--tint" id="modeling">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow">Modeling · 建模逻辑</span>
          <h2 className="section__title">为什么选择 CARP 建模</h2>
          <p className="section__sub">
            播种的作业对象是「需要被服务的航带（边）」，作业目标是边的全覆盖，
            因此适合建模为带容量约束弧路径问题（CARP）。
          </p>
        </div>

        <ol className="flow">
          {STEPS.map((s, i) => (
            <li
              key={s.label}
              className="flow__step reveal"
              style={{ animationDelay: `${0.05 + i * 0.08}s` }}
            >
              <div className="flow__node">
                <span className="flow__idx mono">{String(i + 1).padStart(2, "0")}</span>
                <span className="flow__label">{s.label}</span>
                <span className="flow__note">{s.note}</span>
              </div>
              {i < STEPS.length - 1 && (
                <span className="flow__arrow" aria-hidden="true">
                  →
                </span>
              )}
            </li>
          ))}
        </ol>

        <div className="algo-block">
          <div className="algo-block__lead">
            <span className="eyebrow">Algorithms · 近似算法</span>
            <p className="algo-block__intro">
              CARP 属 NP-hard，系统提供分层求解策略：从快速构造到全局优化，再到混合元启发式与局部改进。
            </p>
          </div>

          <div className="algo-grid">
            {ALGORITHMS.map((a, i) => (
              <article
                key={a.name}
                className="algo-card reveal"
                style={{ animationDelay: `${0.1 + i * 0.07}s` }}
              >
                <span className="algo-card__tag mono">{a.tag}</span>
                <h3 className="algo-card__name">{a.name}</h3>
                <span className="algo-card__en mono">{a.en}</span>
                <p className="algo-card__desc">{a.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
