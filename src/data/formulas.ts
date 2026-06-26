export interface FormulaItem {
  id: string;
  title: string;
  latex: string;
  /** 渲染失败时的纯文本 fallback */
  plain: string;
  explanation: string;
  /** 与无人机播种场景的对应关系 */
  mapping: string;
}

/** 首页公式区：完整刻画 CARP 的图模型、目标函数与约束体系，
 *  服务「现实问题 → CARP 建模 → NP-hard → 近似算法」叙事 */
export const FORMULAS: FormulaItem[] = [
  {
    id: "graph",
    title: "图模型与必服务边",
    latex: "G=(V,E),\\quad R \\subseteq E",
    plain: "G=(V,E), R ⊆ E",
    explanation:
      "V 为航带端点、补给点 v₀ 与辅助路径节点的集合，E 为可飞行边集合，R⊆E 为必须服务的播种航带集合。每条必服务边 eᵢ 关联服务成本 cᵢ、种子需求 qᵢ 与长度 lᵢ。",
    mapping: "航带端点→节点，播种航带→必服务边，起降点→仓库节点 v₀。",
  },
  {
    id: "objective",
    title: "CARP 目标函数",
    latex: "\\min \\sum_{k=1}^{m} C(P_k)",
    plain: "min Σ_{k=1..m} C(P_k)",
    explanation:
      "系统生成 m 趟路线 P₁,…,Pₘ，每趟均从补给点 v₀ 出发并返回 v₀。C(Pₖ) 为路线总代价，含服务航带成本与航带间空飞转移（deadheading）成本。",
    mapping: "最小化无人机完成全部播种任务的总飞行成本。",
  },
  {
    id: "coverage",
    title: "服务完整性约束",
    latex: "\\bigcup_{k=1}^{m} (P_k \\cap R) = R",
    plain: "∪_{k=1..m} (P_k ∩ R) = R",
    explanation:
      "所有必服务航带都必须被至少一条路线覆盖。若要求每条航带恰好服务一次，还需满足 (Pₐ∩R)∩(P_b∩R)=∅ (a≠b)，以避免重复播种造成种子浪费。",
    mapping: "农田每条航带都不漏播，并尽量不重播。",
  },
  {
    id: "capacity",
    title: "种箱容量约束",
    latex: "\\sum_{e_i \\in P_k \\cap R} q_i \\le Q,\\quad k=1,\\dots,m",
    plain: "Σ_{eᵢ∈P_k∩R} qᵢ ≤ Q, k=1..m",
    explanation:
      "每趟路线所服务航带的种子需求量之和不超过种箱容量 Q。qᵢ 为航带 eᵢ 的播种需求量。",
    mapping: "种箱装满后必须返航补种。",
  },
  {
    id: "battery",
    title: "电池航程约束",
    latex: "C(P_k) \\le B,\\quad k=1,\\dots,m",
    plain: "C(P_k) ≤ B, k=1..m",
    explanation:
      "每趟路线代价不超过单趟航程预算 B；返航次数 R=m−1。超出预算时无人机必须返回补给点换电或补种。",
    mapping: "电量不足必须返航换电。",
  },
  {
    id: "energy",
    title: "能耗模型（航程细化）",
    latex:
      "E(P_k)=E_{\\text{fly}}+E_{\\text{seed}}+E_{\\text{turn}} \\le B_E",
    plain: "E(P_k)=E_fly+E_seed+E_turn ≤ B_E",
    explanation:
      "更精细的能耗模型将单趟能耗分解为飞行、播种与转向能耗之和，并约束于电池能量预算 B_E，使航程约束更贴近真实作业。",
    mapping: "把「航程」升级为真实「能耗」预算。",
  },
  {
    id: "fitness",
    title: "综合成本（适应度）函数",
    latex:
      "F(X)=\\alpha D(X)+\\beta R(X)+\\gamma V(X)+\\eta U(X)",
    plain: "F(X)=αD(X)+βR(X)+γV(X)+ηU(X)",
    explanation:
      "评价个体 X 的综合成本。D(X) 为总飞行距离，R(X) 为返航次数，V(X) 为容量/航程约束违反惩罚，U(X) 为未服务航带数；α,β,γ,η 为权重。要求全覆盖时 U 取较大惩罚权重。",
    mapping: "遗传算法与 MemeticGA 的优化目标。",
  },
  {
    id: "ratio",
    title: "算法相对成本指标",
    latex: "\\rho = \\dfrac{C_{\\text{alg}}}{C_{\\text{best}}}",
    plain: "ρ = C_alg / C_best",
    explanation:
      "用相对成本指标评价不同算法的求解质量。C_alg 为当前算法路线成本，C_best 为该场景已知最好结果或对比基准；ρ 越接近 1，解越接近基准最优。",
    mapping: "衡量近似/启发式算法离最优解有多近。",
  },
];
