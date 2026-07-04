import type { FuBreakdown } from "../engine/score";

function formatFuItem(fu: number, isBase: boolean): string {
  // 先頭の基本値（副底・固定符）は素の値、それ以外は加符として「+」を付ける。
  return isBase ? `${fu}符` : `+${fu}符`;
}

/** 符の内訳（基本符・面子符・待ち・ツモ等）を1行ずつ表示する（SPEC.md §4.4）。 */
export function FuBreakdownContent({ detail }: { detail: FuBreakdown }) {
  return (
    <>
      <ul className="fu-list">
        {detail.items.map((item, i) => (
          <li key={i}>
            <span>
              {item.count && item.count > 1 ? `${item.label} × ${item.count}` : item.label}
            </span>
            <span>{formatFuItem(item.fu, i === 0)}</span>
          </li>
        ))}
      </ul>
      {detail.note ? <p className="fu-note">{detail.note}</p> : null}
    </>
  );
}
