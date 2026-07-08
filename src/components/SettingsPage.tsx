import { Link } from "react-router-dom";
import { useSettings } from "../settings/SettingsContext";
import "./settings.css";

export function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings();

  return (
    <main className="page-shell settings-page">
      <div className="page-header">
        <h1>設定</h1>
        <div className="page-header-link">
          <Link to="/" className="page-header-link-item">
            ホーム
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="settings-loading">読み込み中…</p>
      ) : (
        <section className="card settings-item" aria-label="切り上げ満貫">
          <label className="settings-toggle-row" htmlFor="round-up-mangan">
            <span className="settings-toggle-text">
              <span className="settings-toggle-title">切り上げ満貫</span>
              <span className="settings-toggle-desc">
                子7700→8000／親11600→12000／子ツモ2000-3900→2000-4000／親ツモ3900オール→4000オール
                に切り上げます（既定ON）。
              </span>
            </span>
            <input
              id="round-up-mangan"
              type="checkbox"
              role="switch"
              checked={settings.roundUpMangan}
              onChange={(e) => updateSettings({ roundUpMangan: e.target.checked })}
            />
          </label>
        </section>
      )}
    </main>
  );
}
