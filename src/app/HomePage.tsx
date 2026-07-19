import { Link } from "react-router-dom";
import { MODES } from "../shared/modes";
import type { Tile } from "../engine/model";
import { TileFace } from "../shared/components/tiles/TileFace";
import "./home.css";

// モードカード・ファンカードの共通見た目トークンはTailwindユーティリティで実装する
// （T-015／SPEC.md §8.3.2）。.home-page スコープの --fl-r-*・--fl-glow-*・--fl-bounce・
// --fl-dur は home.css に残るCSSカスタムプロパティを任意値記法で参照する。

// 各モードカードの色バリアント（左アクセントバー・グロー影・アイコンリング・矢印色・
// 登場アニメーションの遅延）。モード固有のホバー影はDESIGN.mdのグロー影トークンより
// 強い一回限りの値のためトークン化せずリテラルのまま埋め込む。
interface ModeVariant {
  accentBar: string;
  glow: string;
  hoverGlow: string;
  ring: string;
  arrowColor: string;
  delay: string;
}

const MODE_VARIANTS: Record<string, ModeVariant> = {
  score: {
    accentBar: "bg-fl-teal",
    glow: "shadow-[var(--fl-glow-teal)]",
    hoverGlow: "hover:shadow-[0_14px_30px_rgba(43,168,162,0.4)]",
    ring: "shadow-[0_0_0_2px_var(--color-fl-teal)]",
    arrowColor: "text-fl-teal",
    delay: "[animation-delay:60ms]",
  },
  fu: {
    accentBar: "bg-fl-coral",
    glow: "shadow-[var(--fl-glow-coral)]",
    hoverGlow: "hover:shadow-[0_14px_30px_rgba(239,108,74,0.42)]",
    ring: "shadow-[0_0_0_2px_var(--color-fl-coral)]",
    arrowColor: "text-fl-coral",
    delay: "[animation-delay:120ms]",
  },
  "fu-parts": {
    accentBar: "bg-fl-violet",
    glow: "shadow-[var(--fl-glow-violet)]",
    hoverGlow: "hover:shadow-[0_14px_30px_rgba(155,109,214,0.42)]",
    ring: "shadow-[0_0_0_2px_var(--color-fl-violet)]",
    arrowColor: "text-fl-violet",
    delay: "[animation-delay:140ms]",
  },
  convert: {
    accentBar: "bg-fl-sky",
    glow: "shadow-[var(--fl-glow-sky)]",
    hoverGlow: "hover:shadow-[0_14px_30px_rgba(93,173,226,0.42)]",
    ring: "shadow-[0_0_0_2px_var(--color-fl-sky)]",
    arrowColor: "text-fl-sky",
    delay: "[animation-delay:150ms]",
  },
  stats: {
    accentBar: "bg-fl-gold-dark",
    glow: "shadow-[var(--fl-glow-gold)]",
    hoverGlow: "hover:shadow-[0_14px_30px_rgba(255,210,63,0.5)]",
    ring: "shadow-[0_0_0_2px_var(--color-fl-gold-dark)]",
    arrowColor: "text-fl-gold-dark",
    delay: "[animation-delay:180ms]",
  },
};

// 各モードカードの装飾に使う代表牌（見た目のみ。採点ロジックには無関係）。
// ラベル・遷移先パスは ../shared/modes.ts（サイドバーのモード切替と共有）から取得し、
// ここでは HomePage 固有の見た目情報（装飾牌・説明文・色バリアント）のみを保持する。
const MODE_CARD_INFO: Record<string, { tile: Tile; desc: string }> = {
  score: { tile: { suit: "z", rank: 7 }, desc: "最終点数を当てる" }, // 中
  fu: { tile: { suit: "p", rank: 5, red: true }, desc: "符を答える" }, // 赤5筒
  "fu-parts": {
    tile: { suit: "m", rank: 8 }, // 8萬
    desc: "符を要素ごとに組み立てる",
  },
  convert: {
    tile: { suit: "s", rank: 5, red: true }, // 赤5索
    desc: "符・翻から点数を早見",
  },
};
const STATS_TILE: Tile = { suit: "z", rank: 6 }; // 發
// ヘッダーのブランドマークに使う代表牌（見た目のみ）。
const BRAND_TILE: Tile = { suit: "z", rank: 1 }; // 東

// ヒーロー背後に扇状に並ぶ装飾カード（Flip7 パッケージのファン配置。純装飾）。
const FAN_CARDS = [
  { key: "teal", className: "bg-fl-teal rotate-[-24deg] translate-y-[6px]" },
  { key: "coral", className: "bg-fl-coral rotate-[-12deg] -translate-y-px" },
  { key: "gold", className: "bg-fl-gold translate-y-[-5px]" },
  { key: "sky", className: "bg-fl-sky rotate-[12deg] -translate-y-px" },
  { key: "mint", className: "bg-fl-teal-light rotate-[24deg] translate-y-[6px]" },
] as const;

// モードカード共通の見た目（色バリアント以外）。
const MODE_CARD_BASE =
  "group relative flex items-center gap-[14px] min-h-[72px] pl-[22px] pr-[18px] py-4 bg-fl-card border-2 border-transparent rounded-[var(--fl-r-lg)] text-left no-underline text-fl-ink overflow-hidden transition-[transform,box-shadow] duration-[var(--fl-dur)] ease-[var(--fl-bounce)] animate-[home-pop_420ms_var(--fl-bounce)_both] hover:-translate-y-1 active:scale-[0.97] motion-reduce:animate-none motion-reduce:transition-none motion-reduce:transform-none";

function ModeCardIcon({ tile, ring }: { tile: Tile; ring: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex flex-none p-1.5 bg-fl-cream rounded-[var(--fl-r-md)] rotate-[-4deg] ${ring}`}
    >
      <TileFace tile={tile} size="sm" />
    </span>
  );
}

function ModeCardBody({ title, desc }: { title: string; desc: string }) {
  return (
    <span className="flex flex-col gap-0.5 flex-1 min-w-0">
      <span className="text-[1.05rem] font-extrabold leading-[1.2] text-fl-ink">{title}</span>
      <span className="text-[0.85rem] font-medium text-fl-muted">{desc}</span>
    </span>
  );
}

function ModeCardArrow({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex-none text-[1.6rem] font-extrabold leading-none transition-transform duration-[var(--fl-dur)] ease-[var(--fl-bounce)] group-hover:translate-x-[3px] ${color}`}
    >
      ›
    </span>
  );
}

export function HomePage() {
  return (
    // ルートは <main>（.app-layout > main の flex でフッターを下端へ押し出す前提）。
    <main className="home-page">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-[10px] bg-[rgba(255,248,231,0.86)] backdrop-blur-[10px] [-webkit-backdrop-filter:blur(10px)] border-b-2 border-[rgba(43,168,162,0.22)]">
        <Link
          to="/"
          className="group inline-flex items-center gap-3 no-underline"
          aria-label="麻雀点数トレーニング ホーム"
        >
          <span
            aria-hidden="true"
            className="inline-flex p-[5px] bg-fl-cream border-2 border-fl-ink rounded-[var(--fl-r-md)] shadow-[var(--fl-glow-teal)] rotate-[-5deg] transition-transform duration-[var(--fl-dur)] ease-[var(--fl-bounce)] group-hover:rotate-[-5deg] group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:transform-none"
          >
            <TileFace tile={BRAND_TILE} size="sm" />
          </span>
          <span className="text-[1.05rem] font-extrabold tracking-[0.01em] text-fl-teal-dark">
            麻雀点数トレーニング
          </span>
        </Link>
        <nav className="flex items-center" aria-label="ヘッダー">
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-[18px] text-[0.9rem] font-bold text-fl-teal-dark no-underline whitespace-nowrap bg-fl-cream border-2 border-fl-teal rounded-[var(--fl-r-pill)] transition-[transform,background,color,box-shadow] duration-[var(--fl-dur)] ease-[var(--fl-bounce)] hover:bg-fl-teal hover:text-fl-cream hover:shadow-[var(--fl-glow-teal)] hover:-translate-y-0.5 active:scale-95 motion-reduce:transition-none motion-reduce:transform-none"
          >
            <span className="text-[1.05em] leading-none" aria-hidden="true">
              ⚙
            </span>
            設定
          </Link>
        </nav>
      </header>

      <div className="flex-[1_0_auto] flex flex-col items-center justify-center gap-6 w-full max-w-[560px] mx-auto px-5 pt-10 pb-14 text-center">
        <section className="flex flex-col items-center gap-4 animate-[home-rise_460ms_var(--fl-bounce)_both] motion-reduce:animate-none">
          <span aria-hidden="true" className="inline-flex items-end justify-center h-[52px] mb-1">
            {FAN_CARDS.map((c) => (
              <span
                key={c.key}
                className={`w-[30px] h-[44px] mx-[-7px] rounded-[8px] border-2 border-fl-ink shadow-[0_4px_10px_rgba(18,63,60,0.16)] origin-bottom ${c.className}`}
              />
            ))}
          </span>
          <span className="relative z-[1] inline-block px-5 py-[7px] text-[0.85rem] font-extrabold tracking-[0.14em] text-fl-teal-dark bg-fl-cream border-[3px] border-fl-ink rounded-[6px]">
            <span
              aria-hidden="true"
              className="absolute z-[-1] top-2 left-[-12px] w-[18px] h-full bg-fl-gold-light border-[3px] border-fl-ink rounded-l-[4px]"
            />
            4択ドリル
            <span
              aria-hidden="true"
              className="absolute z-[-1] top-2 right-[-12px] w-[18px] h-full bg-fl-gold-light border-[3px] border-fl-ink rounded-r-[4px]"
            />
          </span>
          <h1 className="m-0 text-[clamp(1.9rem,8vw,2.6rem)] font-extrabold leading-[1.2] tracking-[0.005em] text-fl-ink">
            和了形から
            <span className="relative whitespace-nowrap px-1 text-fl-ink">
              <span
                aria-hidden="true"
                className="absolute z-[-1] left-[-2px] right-[-2px] bottom-0.5 h-[42%] bg-fl-gold rounded-[6px] rotate-[-1.5deg]"
              />
              点数
            </span>
            を当てる
          </h1>
          <p className="max-w-[30em] m-0 text-base font-medium text-fl-muted">
            選択肢から答える反復トレーニング
          </p>
        </section>

        <nav className="w-full flex flex-col gap-[18px]" aria-label="練習モード">
          <h2 className="inline-flex self-center items-center gap-2 m-0 pb-2 text-[0.95rem] font-extrabold tracking-[0.08em] text-fl-teal-dark border-b-[3px] border-dashed border-[rgba(43,168,162,0.5)]">
            <span className="text-[1.2em] leading-none" aria-hidden="true">
              🀄
            </span>
            練習メニュー
          </h2>

          <div className="grid grid-cols-1 gap-[14px] w-full min-[480px]:grid-cols-2">
            {MODES.map((mode) => {
              const info = MODE_CARD_INFO[mode.id];
              const variant = MODE_VARIANTS[mode.id];
              return (
                <Link
                  key={mode.id}
                  to={mode.path}
                  className={`${MODE_CARD_BASE} ${variant.glow} ${variant.hoverGlow} ${variant.delay}`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${variant.accentBar}`}
                  />
                  <ModeCardIcon tile={info.tile} ring={variant.ring} />
                  <ModeCardBody title={mode.label} desc={info.desc} />
                  <ModeCardArrow color={variant.arrowColor} />
                </Link>
              );
            })}

            <Link
              to="/stats"
              className={`${MODE_CARD_BASE} ${MODE_VARIANTS.stats.glow} ${MODE_VARIANTS.stats.hoverGlow} ${MODE_VARIANTS.stats.delay} min-[480px]:col-span-2`}
            >
              <span
                aria-hidden="true"
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${MODE_VARIANTS.stats.accentBar}`}
              />
              <ModeCardIcon tile={STATS_TILE} ring={MODE_VARIANTS.stats.ring} />
              <ModeCardBody title="成績" desc="正答率・苦手分野を確認" />
              <ModeCardArrow color={MODE_VARIANTS.stats.arrowColor} />
            </Link>
          </div>
        </nav>

        <p className="m-0 leading-none">
          <Link
            to="/articles"
            className="inline-flex items-center gap-2 min-h-[44px] px-5 text-[0.9rem] font-bold text-fl-teal-dark no-underline bg-transparent border-2 border-dashed border-fl-teal rounded-[var(--fl-r-pill)] transition-[background,transform] duration-[var(--fl-dur)] ease-[var(--fl-bounce)] hover:bg-fl-teal-bg hover:-translate-y-0.5 active:scale-[0.96] motion-reduce:transition-none motion-reduce:transform-none"
          >
            <span className="text-[1.05em] leading-none" aria-hidden="true">
              📖
            </span>
            点数計算の学習ガイドを読む
          </Link>
        </p>
      </div>
    </main>
  );
}
