import { Link } from "react-router-dom";
import { useSettings } from "./SettingsContext";
import "./settings.css";

const TOGGLE_CLASS =
  "appearance-none flex-none w-[60px] h-[34px] m-0 rounded-[var(--fl-r-pill)] border-2 border-[rgba(43,168,162,0.35)] bg-fl-cream bg-no-repeat [background-image:radial-gradient(circle,#fff_44%,rgba(0,0,0,0)_46%)] [background-position:left_3px_center] bg-[length:26px_26px] shadow-[inset_0_1px_3px_rgba(18,63,60,0.12)] cursor-pointer transition-[background-color,background-position,border-color,box-shadow] duration-[var(--fl-dur)] ease-[var(--fl-bounce)] checked:border-fl-teal checked:bg-fl-teal checked:[background-position:right_3px_center] checked:shadow-[var(--fl-glow-teal-soft)] focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-fl-teal)_30%,transparent)] motion-reduce:transition-none";

export function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings();

  return (
    <main className="page-shell settings-page">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 mx-[calc(50%-50vw)] mt-[calc(-1*var(--space-4))] sm:mt-[calc(-1*var(--space-6))] px-[max(16px,calc(50vw-320px))] py-[10px] bg-[rgba(255,248,231,0.86)] backdrop-blur-[10px] [-webkit-backdrop-filter:blur(10px)] border-b-2 border-[rgba(43,168,162,0.22)]">
        <h1 className="text-[1.15rem] font-extrabold tracking-[0.04em] text-fl-teal-dark">設定</h1>
        <div className="flex gap-2">
          <Link
            to="/"
            className="inline-flex items-center min-h-[36px] px-[14px] text-[0.8rem] font-bold text-fl-teal-dark no-underline bg-fl-cream border-2 border-fl-teal rounded-[var(--fl-r-pill)] transition-[transform,background,color] duration-[var(--fl-dur)] ease-[var(--fl-bounce)] hover:text-fl-cream hover:bg-fl-teal hover:no-underline hover:-translate-y-0.5 active:scale-95 motion-reduce:transition-none motion-reduce:transform-none"
          >
            ホーム
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-fl-muted font-semibold">読み込み中…</p>
      ) : (
        <section
          className="flex flex-col gap-2 py-[18px] px-5 bg-fl-card border-2 border-[rgba(43,168,162,0.3)] rounded-[var(--fl-r-lg)] shadow-[var(--fl-glow-teal-soft)] animate-[settings-rise_420ms_var(--fl-bounce)_both] motion-reduce:animate-none"
          aria-label="切り上げ満貫"
        >
          <label
            className="flex items-center justify-between gap-4 cursor-pointer"
            htmlFor="round-up-mangan"
          >
            <span className="flex flex-col gap-1">
              <span className="text-[1.05rem] font-extrabold text-fl-ink">切り上げ満貫</span>
              <span className="text-[0.85rem] leading-[1.6] text-fl-muted">
                子7700→8000／親11600→12000／子ツモ2000-3900→2000-4000／親ツモ3900オール→4000オール
                に切り上げます。
              </span>
            </span>
            <input
              id="round-up-mangan"
              type="checkbox"
              role="switch"
              className={TOGGLE_CLASS}
              checked={settings.roundUpMangan}
              onChange={(e) => updateSettings({ roundUpMangan: e.target.checked })}
            />
          </label>
        </section>
      )}
    </main>
  );
}
