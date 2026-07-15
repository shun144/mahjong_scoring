import { useCallback, useEffect, useRef, useState } from "react";
import { calculatePayment } from "../engine/score";
import { RANK_LABELS } from "./format";
import "./scoreTable.css";

/**
 * 点数計算 早見表ダイアログ（SPEC.md §5.3 の点数テーブルの反復学習用）。
 *
 * セルの数値は静的に持たず、エンジンの `calculatePayment` から生成する。
 * こうすることでクイズの採点結果と早見表が食い違わない（誤答提示の防止）。
 * 表示は標準ルール（切り上げ満貫なし）で、添付の一般的な早見表と一致する。
 */

const FU_ROWS: ReadonlyArray<{ fu: number; note?: string }> = [
  { fu: 20, note: "平和ツモ" },
  { fu: 25, note: "七対子" },
  { fu: 30 },
  { fu: 40 },
  { fu: 50 },
  { fu: 60 },
  { fu: 70 },
];

const HANS: readonly number[] = [1, 2, 3, 4];

/** 3桁区切りで整形（例: 11600 → "11,600"）。 */
const fmt = (n: number) => n.toLocaleString("en-US");

interface Cell {
  /** 上段: ロンの点数（満貫以上は区分名）。 */
  main: string;
  /** 下段: ツモの点数（親=各家のオール額／子=「子払い / 親払い」）。 */
  sub: string;
  /** 満貫以上のセル（強調表示用）。 */
  mangan: boolean;
}

/**
 * 符・翻・親子から早見表の1セルを生成する。
 * 20符・25符の1翻は実在しない（平和ツモ／七対子は最低2翻）ため空セルにする。
 */
function buildCell(fu: number, han: number, isDealer: boolean): Cell | null {
  if ((fu === 20 || fu === 25) && han === 1) return null;

  const ron = calculatePayment(han, fu, isDealer, "ron");
  const tsumo = calculatePayment(han, fu, isDealer, "tsumo");

  let main = "";
  if (ron.rank) main = RANK_LABELS[ron.rank];
  else if (ron.payment.kind === "ron") main = fmt(ron.payment.total);

  let sub = "";
  if (tsumo.payment.kind === "tsumo-oya") sub = `${fmt(tsumo.payment.each)}オール`;
  else if (tsumo.payment.kind === "tsumo-ko")
    sub = `${fmt(tsumo.payment.nonDealer)}/${fmt(tsumo.payment.dealer)}`;

  return { main, sub, mangan: ron.rank !== null };
}

interface TableRow {
  fu: number;
  note?: string;
  cells: (Cell | null)[];
}

function buildRows(isDealer: boolean): TableRow[] {
  return FU_ROWS.map((row) => ({
    ...row,
    cells: HANS.map((han) => buildCell(row.fu, han, isDealer)),
  }));
}

/**
 * 跳満以上（符に依存しない区分）の代表翻数。
 * rank が確定すれば calculatePayment は符を無視するため、区分の翻数レンジ内なら
 * どの値で計算しても結果は同じ（各区分の下限を代表値に使う）。
 */
const RANK_ROW_SPECS: ReadonlyArray<{ han: number; note: string }> = [
  { han: 5, note: "5翻" },
  { han: 6, note: "6-7翻" },
  { han: 8, note: "8-10翻" },
  { han: 11, note: "11-12翻" },
  { han: 13, note: "13翻~" },
];

interface RankRow {
  label: string;
  note: string;
  main: string;
  sub: string;
}

function buildRankRows(isDealer: boolean): RankRow[] {
  return RANK_ROW_SPECS.map(({ han, note }) => {
    const ron = calculatePayment(han, 30, isDealer, "ron");
    const tsumo = calculatePayment(han, 30, isDealer, "tsumo");
    const main = ron.rank && ron.payment.kind === "ron" ? fmt(ron.payment.total) : "";
    const sub =
      tsumo.payment.kind === "tsumo-oya"
        ? `${fmt(tsumo.payment.each)}オール`
        : tsumo.payment.kind === "tsumo-ko"
          ? `${fmt(tsumo.payment.nonDealer)}/${fmt(tsumo.payment.dealer)}`
          : "";
    return { label: ron.rank ? RANK_LABELS[ron.rank] : "", note, main, sub };
  });
}

// モジュール読込時に一度だけ生成（再レンダーで作り直さない）。
const DEALER_ROWS = buildRows(true);
const NON_DEALER_ROWS = buildRows(false);
const DEALER_RANK_ROWS = buildRankRows(true);
const NON_DEALER_RANK_ROWS = buildRankRows(false);

function ScoreTableBlock({ rows, rankRows }: { rows: TableRow[]; rankRows: RankRow[] }) {
  return (
    <section className="st-block">
      <table className="score-table">
        <thead>
          <tr>
            <th scope="col" className="st-corner">
              符
            </th>
            {HANS.map((han) => (
              <th scope="col" key={han}>
                {han}翻
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.fu}>
              <th scope="row" className="st-fu-head">
                <span className="st-fu">{row.fu}符</span>
                {row.note && <span className="st-fu-note">{row.note}</span>}
              </th>
              {row.cells.map((cell, i) => (
                <td key={HANS[i]} className={cell?.mangan ? "st-cell st-cell--mangan" : "st-cell"}>
                  {cell ? (
                    <>
                      <span className="st-main">{cell.main}</span>
                      <span className="st-sub">{cell.sub}</span>
                    </>
                  ) : (
                    <span className="st-empty" aria-hidden="true">
                      –
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tbody>
          {rankRows.map((row, i) => (
            <tr key={row.label} className={i === 0 ? "st-rank-row-first" : undefined}>
              <th scope="row" className="st-fu-head">
                <span className="st-rank-name">{row.label}</span>
                <span className="st-rank-note">{row.note}</span>
              </th>
              <td className="st-cell st-cell--mangan" colSpan={HANS.length}>
                <span className="st-main">{row.main}</span>
                <span className="st-sub">{row.sub}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

type Side = "dealer" | "nonDealer";

/** IntersectionObserver でパネルの可視判定に使う閾値。半分を超えて見えている側をアクティブとする。 */
const VISIBILITY_THRESHOLD = 0.55;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ScoreTableDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const dealerPanelRef = useRef<HTMLDivElement>(null);
  const nonDealerPanelRef = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState<Side>("dealer");
  // 開いた瞬間の位置合わせ（アニメーションなし）に使う、常に最新の side を指すref。
  const sideRef = useRef<Side>(side);
  sideRef.current = side;

  // open の変化に応じてネイティブ <dialog> を開閉する（フォーカストラップ・Esc は標準機能）。
  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    else if (!open && dlg.open) dlg.close();
  }, [open]);

  // Esc・× ・背景クリックいずれで閉じても親の state を同期する。
  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    dlg.addEventListener("close", onClose);
    return () => dlg.removeEventListener("close", onClose);
  }, [onClose]);

  // 開いた直後は現在の side にアニメーションなしで位置合わせする（open のみを契機にし、
  // トグル操作由来のスムーズスクロールとは干渉させない）。
  useEffect(() => {
    if (!open) return;
    const container = carouselRef.current;
    const panel = sideRef.current === "dealer" ? dealerPanelRef.current : nonDealerPanelRef.current;
    if (!container || !panel) return;
    container.scrollTo({ left: panel.offsetLeft, behavior: "auto" });
  }, [open]);

  // スワイプでどちらのパネルが見えているかを監視し、トグルの選択状態（aria-pressed）に反映する
  // （位置→state同期）。
  useEffect(() => {
    const container = carouselRef.current;
    const dealerPanel = dealerPanelRef.current;
    const nonDealerPanel = nonDealerPanelRef.current;
    if (!container || !dealerPanel || !nonDealerPanel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setSide(entry.target === dealerPanel ? "dealer" : "nonDealer");
        }
      },
      { root: container, threshold: VISIBILITY_THRESHOLD },
    );
    observer.observe(dealerPanel);
    observer.observe(nonDealerPanel);
    return () => observer.disconnect();
  }, []);

  // トグル押下→対象パネルへスクロール（state→位置同期）。reduced-motion時は即時ジャンプ。
  const scrollToSide = useCallback((target: Side) => {
    const container = carouselRef.current;
    const panel = target === "dealer" ? dealerPanelRef.current : nonDealerPanelRef.current;
    if (!container || !panel) return;
    container.scrollTo({
      left: panel.offsetLeft,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, []);

  const handleToggle = useCallback(
    (target: Side) => {
      setSide(target);
      scrollToSide(target);
    },
    [scrollToSide],
  );

  // 背景（::backdrop）クリックで閉じる。クリック対象が <dialog> 自身なら枠外。
  const handleClick = useCallback((e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === ref.current) ref.current?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className="score-table-dialog"
      aria-labelledby="score-table-title"
      onClick={handleClick}
    >
      <div className="st-inner">
        <header className="st-header">
          <div className="st-header-left">
            <h2 id="score-table-title">点数早見表</h2>
            <div className="st-toggle" role="group" aria-label="親子切替">
              <button
                type="button"
                className={
                  side === "dealer" ? "st-toggle-btn st-toggle-btn--active" : "st-toggle-btn"
                }
                aria-pressed={side === "dealer"}
                onClick={() => handleToggle("dealer")}
              >
                親
              </button>
              <button
                type="button"
                className={
                  side === "nonDealer" ? "st-toggle-btn st-toggle-btn--active" : "st-toggle-btn"
                }
                aria-pressed={side === "nonDealer"}
                onClick={() => handleToggle("nonDealer")}
              >
                子
              </button>
            </div>
          </div>
          <button
            type="button"
            className="st-close"
            aria-label="閉じる"
            onClick={() => ref.current?.close()}
          >
            ×
          </button>
        </header>
        <div
          className="st-carousel"
          ref={carouselRef}
          aria-label="親子の点数早見表（スワイプで切替）"
        >
          <div className="st-panel" ref={dealerPanelRef}>
            <ScoreTableBlock rows={DEALER_ROWS} rankRows={DEALER_RANK_ROWS} />
          </div>
          <div className="st-panel" ref={nonDealerPanelRef}>
            <ScoreTableBlock rows={NON_DEALER_ROWS} rankRows={NON_DEALER_RANK_ROWS} />
          </div>
        </div>
      </div>
    </dialog>
  );
}
