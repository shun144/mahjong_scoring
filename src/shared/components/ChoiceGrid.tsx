/**
 * 汎用の4択グリッド。最終点数モード（Payment）・符計算モード（number）で共有する。
 * 見た目は quiz.css の .quiz-choices / .quiz-choice-btn を流用する。
 */
export interface ChoiceGridProps<T> {
  items: readonly T[];
  keyOf: (item: T) => string;
  renderLabel: (item: T) => string;
  onSelect: (item: T) => void;
}

export function ChoiceGrid<T>({ items, keyOf, renderLabel, onSelect }: ChoiceGridProps<T>) {
  return (
    <div className="quiz-choices">
      {items.map((item) => (
        <button
          key={keyOf(item)}
          type="button"
          className="quiz-choice-btn"
          onClick={() => onSelect(item)}
        >
          {renderLabel(item)}
        </button>
      ))}
    </div>
  );
}
