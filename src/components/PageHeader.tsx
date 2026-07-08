import { Link } from "react-router-dom";

interface Props {
  title: string;
  /** 成績画面の「練習に戻る」が戻ってくるべき出題パス（例: "/quiz" | "/fu/quiz"）。 */
  backTo?: string;
}

export function PageHeader({ title, backTo }: Props) {
  return (
    <div className="page-header">
      <h1>{title}</h1>
      <div className="page-header-link">
        <Link to="/" className="page-header-link-item">
          ホームに戻る
        </Link>
        <Link
          to="/stats"
          state={backTo ? { backTo } : undefined}
          className="page-header-link-item"
        >
          成績を見る
        </Link>
      </div>
    </div>
  );
}
