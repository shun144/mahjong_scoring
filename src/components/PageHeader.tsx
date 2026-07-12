import { Link } from "react-router-dom";
import type { Problem } from "../data/problem";

interface Props {
  title: string;
  /** 成績画面の「練習に戻る」が戻ってくるべき出題パス（例: "/quiz" | "/fu/quiz"）。 */
  backTo?: string;
  /**
   * 現在表示中の問題。渡しておくと、成績画面の「練習に戻る」で同じ問題（同じ4択・
   * 同じ並び順）にそのまま戻れる（出題中の画面のみ渡す。解説画面は次の問題に進む
   * 導線が別にあるため任意）。
   */
  problem?: Problem;
  /** 「成績」リンクを表示するか（既定 true）。成績に連携しないモード（符分解など）は false を渡す。 */
  showStats?: boolean;
}

export function PageHeader({ title, backTo, problem, showStats = true }: Props) {
  return (
    <div className="page-header">
      <h1>{title}</h1>
      <div className="page-header-link">
        <Link to="/" className="page-header-link-item">
          ホーム
        </Link>
        {showStats ? (
          <Link
            to="/stats"
            state={backTo ? { backTo, problem } : undefined}
            className="page-header-link-item"
          >
            成績
          </Link>
        ) : null}
      </div>
    </div>
  );
}
