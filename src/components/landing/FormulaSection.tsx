import { BlockMath } from "react-katex";
import { FORMULAS, type FormulaItem } from "../../data/formulas";

export default function FormulaSection() {
  return (
    <section className="section" id="formulas">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow">Formulation · 数学建模</span>
          <h2 className="section__title">CARP 的核心数学表达</h2>
          <p className="section__sub">
            目标函数与约束共同刻画了「最小成本、全覆盖、不超容、不超航程」的播种规划问题。
          </p>
        </div>

        <div className="formula-grid">
          {FORMULAS.map((f, i) => (
            <FormulaCard key={f.id} item={f} delay={0.05 + i * 0.06} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FormulaCard({ item, delay }: { item: FormulaItem; delay: number }) {
  return (
    <article className="formula-card card reveal" style={{ animationDelay: `${delay}s` }}>
      <header className="formula-card__head">
        <h3 className="formula-card__title">{item.title}</h3>
      </header>

      <div className="formula-card__math">
        <BlockMath
          math={item.latex}
          renderError={() => <code className="formula-card__fallback mono">{item.plain}</code>}
        />
      </div>

      <p className="formula-card__explain">{item.explanation}</p>

      <div className="formula-card__map">
        <span className="formula-card__map-tag mono">场景对应</span>
        <span>{item.mapping}</span>
      </div>
    </article>
  );
}
