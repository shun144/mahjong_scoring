import { generateRandomHand } from "@/features/practice/application/randomHand";

const N = 20000;
const counts: Record<string, number> = {
  none: 0,
  mangan: 0,
  haneman: 0,
  baiman: 0,
  sanbaiman: 0,
  yakuman: 0,
};

let generated = 0;
let i = 0;
while (generated < N && i < N * 3) {
  i++;
  const hand = generateRandomHand(Math.random);
  if (!hand) continue;
  generated++;
  const rank = hand.answer.rank ?? "none";
  counts[rank] = (counts[rank] ?? 0) + 1;
}

console.log(`generated: ${generated} (attempts: ${i})`);
for (const [k, v] of Object.entries(counts)) {
  console.log(`${k}: ${v} (${((v / generated) * 100).toFixed(2)}%)`);
}
const manganPlus = counts.mangan + counts.haneman + counts.baiman + counts.sanbaiman + counts.yakuman;
console.log(`mangan+ total: ${manganPlus} (${((manganPlus / generated) * 100).toFixed(2)}%)`);
