import type { FuBreakdown } from "@/engine/score";

function formatFuItem(fu: number, isBase: boolean): string {
  // 先頭の基本値（副底・固定符）と0符は素の値、それ以外の加符には「+」を付ける。
  return isBase || fu === 0 ? `${fu}符` : `+${fu}符`;
}

// 面子の符ラベル（明刻/暗刻/明槓/暗槓）は漢字が似て見分けにくいため、
// 文字自体は他の行と同じ表示のまま、先頭に色ドットのアクセントを添えて識別する
// （刻=緑系/槓=琥珀系の色相、暗=塗り●/明=枠○）。
const MELD_MARK_CLASS: Record<string, string> = {
  暗刻: "meld-mark--ankou",
  明刻: "meld-mark--minkou",
  暗槓: "meld-mark--ankan",
  明槓: "meld-mark--minkan",
};

/** 面子ラベルなら色ドット用のクラスを返す。それ以外は空文字（素の行）。 */
function meldMarkClass(label: string): string {
  const meld = /^(暗刻|明刻|暗槓|明槓)/.exec(label)?.[1];
  return meld ? `meld-mark ${MELD_MARK_CLASS[meld]}` : "";
}

/** 符の内訳（基本符・面子符・待ち・ツモ等）を1行ずつ表示する（SPEC.md §4.4）。 */
export function FuBreakdownContent({ detail }: { detail: FuBreakdown }) {
  return (
    <>
      <ul className="fu-list">
        {detail.items.map((item, i) => {
          const text = item.count && item.count > 1 ? `${item.label} × ${item.count}` : item.label;
          return (
            <li key={i}>
              <span className={meldMarkClass(item.label)}>{text}</span>
              <span>{formatFuItem(item.fu, i === 0)}</span>
            </li>
          );
        })}
      </ul>
      {detail.note ? <p className="fu-note">{detail.note}</p> : null}
    </>
  );
}
