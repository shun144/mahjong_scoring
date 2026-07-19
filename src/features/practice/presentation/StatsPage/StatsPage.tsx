import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { Problem } from "../../domain/problem";
import { clearStats, loadStats, type TagStat } from "../../application/statsStore";
import "./stats.css";

interface StatsNavState {
  /** 戻り先の出題パス。 */
  backTo: string;
  /** 出題中に「成績」で来た場合の、表示していた問題（あれば同じ問題・同じ4択に戻す）。 */
  problem?: Problem;
}

/** PageHeader の「成績」から渡される遷移stateを解決する。 */
function resolveStatsNavState(state: unknown): StatsNavState {
  const fallback = "/quiz";
  if (!state || typeof state !== "object") return { backTo: fallback };
  const s = state as { backTo?: unknown; problem?: unknown };
  const backTo = s.backTo === "/quiz" || s.backTo === "/fu/quiz" ? s.backTo : fallback;
  const problem =
    s.problem && typeof s.problem === "object" && "id" in s.problem
      ? (s.problem as Problem)
      : undefined;
  return { backTo, problem };
}

interface TagRow {
  label: string;
  correct: number;
  total: number;
  accuracy: number;
}

function toTagRows(map: Record<string, TagStat>): TagRow[] {
  return Object.entries(map)
    .map(([label, s]) => ({
      label,
      correct: s.correct,
      total: s.total,
      accuracy: s.total > 0 ? s.correct / s.total : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);
}

function TagBar({ row }: { row: TagRow }) {
  const pct = Math.round(row.accuracy * 100);
  return (
    <li>
      <div className="tag-row-label">
        <span>{row.label}</span>
        <span>
          {row.correct}/{row.total}（{pct}%）
        </span>
      </div>
      <div className="tag-row-bar-track">
        <div className="tag-row-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}

export function StatsPage() {
  const location = useLocation();
  const { backTo, problem } = resolveStatsNavState(location.state);
  const [stats, setStats] = useState(() => loadStats());
  const accuracyPct =
    stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;

  function handleReset() {
    setStats(clearStats());
  }

  const fuRows = toTagRows(stats.byFuType).map((r) => ({ ...r, label: `${r.label}符` }));
  const yakuRows = toTagRows(stats.byYakuCategory);

  return (
    <main className="page-shell stats-page">
      <div className="page-header">
        <h1>成績</h1>
        <div className="page-header-link">
          <Link
            to={backTo}
            state={problem ? { problem, review: true } : undefined}
            className="page-header-link-item"
          >
            練習に戻る
          </Link>
        </div>
      </div>

      <section className="stats-summary" aria-label="累計成績">
        <div className="card stat-card">
          <span className="stat-card-label">累計正答率</span>
          <strong className="stat-card-value">{accuracyPct}%</strong>
          <span className="stat-card-sub">
            {stats.totalCorrect}/{stats.totalAnswered}問
          </span>
        </div>
        <div className="card stat-card">
          <span className="stat-card-label">連続正解</span>
          <strong className="stat-card-value">{stats.currentStreak}</strong>
        </div>
        <div className="card stat-card">
          <span className="stat-card-label">最高連続正解</span>
          <strong className="stat-card-value">{stats.bestStreak}</strong>
        </div>
      </section>

      {stats.totalAnswered === 0 ? (
        <p>まだ回答履歴がありません。</p>
      ) : (
        <>
          <section aria-label="符の型別正答率">
            <h2>符の型 別正答率（苦手なものから表示）</h2>
            <ul className="tag-row-list">
              {fuRows.map((row) => (
                <TagBar key={row.label} row={row} />
              ))}
            </ul>
          </section>

          <section aria-label="役の種類別正答率">
            <h2>役の種類 別正答率（苦手なものから表示）</h2>
            <ul className="tag-row-list">
              {yakuRows.map((row) => (
                <TagBar key={row.label} row={row} />
              ))}
            </ul>
          </section>

          <section className="stats-reset" aria-label="成績のリセット">
            <button
              type="button"
              className="btn-secondary stats-reset-trigger"
              onClick={handleReset}
            >
              成績をリセット
            </button>
          </section>
        </>
      )}
    </main>
  );
}
