import type { Meld, Tile } from "../../engine/model";
import { HandDisplay } from "../tiles/HandDisplay";
import { TileFace } from "../tiles/TileFace";
import { TileRow } from "../tiles/TileRow";

const suits: Array<"m" | "p" | "s"> = ["m", "p", "s"];
const honors: Tile[] = Array.from({ length: 7 }, (_, i) => ({ suit: "z", rank: i + 1 }));

const sampleConcealed: Tile[] = [
  { suit: "m", rank: 2 },
  { suit: "m", rank: 3 },
  { suit: "m", rank: 4 },
  { suit: "p", rank: 5, red: true },
  { suit: "p", rank: 6 },
  { suit: "p", rank: 7 },
  { suit: "z", rank: 5 },
  { suit: "z", rank: 5 },
];
const sampleWinningTile: Tile = { suit: "z", rank: 5 };

const samplePon: Meld = {
  type: "pon",
  tiles: [
    { suit: "s", rank: 9 },
    { suit: "s", rank: 9 },
    { suit: "s", rank: 9 },
  ],
  calledTile: { suit: "s", rank: 9 },
};

const sampleAnkan: Meld = {
  type: "ankan",
  tiles: [
    { suit: "m", rank: 1 },
    { suit: "m", rank: 1 },
    { suit: "m", rank: 1 },
    { suit: "m", rank: 1 },
  ],
};

/**
 * 牌表示コンポーネントの開発用確認ページ（本番導線には含めない）。
 * P1「牌1枚・牌列・副露を描画する表示コンポーネントの土台」の目視確認用。
 */
export function TileGalleryPage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>牌表示コンポーネント ギャラリー（開発用）</h1>

      <h2>数牌（1-9 × 萬/筒/索、赤5含む）</h2>
      {suits.map((suit) => (
        <div key={suit} style={{ marginBottom: 8 }}>
          <TileRow
            tiles={Array.from({ length: 9 }, (_, i) => ({
              suit,
              rank: i + 1,
              red: i + 1 === 5,
            }))}
            keyPrefix={suit}
          />
        </div>
      ))}

      <h2>字牌（東南西北白發中）</h2>
      <TileRow tiles={honors} keyPrefix="honor" />

      <h2>サイズ違い</h2>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
        <TileFace tile={{ suit: "m", rank: 5, red: true }} size="sm" />
        <TileFace tile={{ suit: "m", rank: 5, red: true }} size="md" />
        <TileFace tile={{ suit: "m", rank: 5, red: true }} size="lg" />
      </div>

      <h2>手牌表示（純手牌＋上がり牌＋副露）</h2>
      <HandDisplay
        concealed={sampleConcealed}
        winningTile={sampleWinningTile}
        melds={[samplePon, sampleAnkan]}
      />
    </main>
  );
}
