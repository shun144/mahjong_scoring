import { Link } from "react-router-dom";

interface Props {
  title: string;
}

export function PageHeader({ title }: Props) {
  return (
    <div className="page-header">
      <h1>{title}</h1>
      <div className="page-header-link">
        <Link to="/" className="page-header-link-item">
          ホームに戻る
        </Link>
        <Link to="/stats" className="page-header-link-item">
          成績を見る
        </Link>
      </div>
    </div>
  );
}
