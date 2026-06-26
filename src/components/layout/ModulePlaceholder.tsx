import "./ModulePlaceholder.css";

interface ModulePlaceholderProps {
  eyebrow: string;
  title: string;
  goal: string;
  /** 该模块计划包含的能力点 */
  points: string[];
}

/** 占位页统一空状态：本轮未实现的模块共用 */
export default function ModulePlaceholder({
  eyebrow,
  title,
  goal,
  points,
}: ModulePlaceholderProps) {
  return (
    <div className="module-ph container">
      <div className="module-ph__card card reveal">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="module-ph__title">{title}</h1>
        <p className="module-ph__goal">{goal}</p>

        <ul className="module-ph__list">
          {points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>

        <div className="module-ph__badge mono">该模块将在后续轮次实现</div>
      </div>
    </div>
  );
}
