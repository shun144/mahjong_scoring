import { expect, test } from "@playwright/test";

test.describe("麻雀点数計算ドリル - 一連の学習フロー", () => {
  test("ホーム→出題→回答→解説→次の問題→成績、の一連が動作する", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "麻雀 点数計算ドリル" })).toBeVisible();

    await page.getByRole("link", { name: "練習を始める" }).click();
    await expect(page).toHaveURL(/\/quiz$/);
    await expect(page.getByRole("heading", { name: "出題" })).toBeVisible();

    // 手牌（牌画像）が表示されている
    await expect(page.getByRole("img").first()).toBeVisible();

    const select = page.getByLabel("点数を選択してください");
    const submit = page.getByRole("button", { name: "回答する" });
    await expect(submit).toBeDisabled();

    await select.selectOption({ index: 1 });
    await expect(submit).toBeEnabled();
    await submit.click();

    await expect(page).toHaveURL(/\/result$/);
    await expect(page.getByRole("heading", { name: "解説" })).toBeVisible();
    await expect(page.getByText(/^正解:/)).toBeVisible();
    await expect(page.getByText("成立役")).toBeVisible();

    await page.getByRole("link", { name: "次の問題へ" }).click();
    await expect(page).toHaveURL(/\/quiz$/);
    await expect(page.getByRole("heading", { name: "出題" })).toBeVisible();

    await page.getByRole("link", { name: "成績を見る" }).click();
    await expect(page).toHaveURL(/\/stats$/);
    await expect(page.getByRole("heading", { name: "成績" })).toBeVisible();
    // 選択肢はシャッフルされるため正誤は問わず、1問だけ回答が記録されたことを確認する
    await expect(page.getByText(/^\d\/1問$/)).toBeVisible();
  });

  test("選択肢の形式が親子・ツモ/ロンの表示規則と一致する", async ({ page }) => {
    await page.goto("/quiz");

    const badgeTexts = await page.locator(".badge").allTextContents();
    const isDealer = badgeTexts.includes("親");
    const isTsumo = badgeTexts.includes("ツモ");

    const options = await page
      .getByLabel("点数を選択してください")
      .locator("option")
      .allTextContents();
    const realOptions = options.filter((o) => o !== "選択してください");
    expect(realOptions.length).toBeGreaterThanOrEqual(2);

    for (const opt of realOptions) {
      if (!isTsumo) {
        expect(opt).toMatch(/^\d+点$/); // ロン: 単一値
      } else if (isDealer) {
        expect(opt).toMatch(/^\d+点オール$/); // 親ツモ: Xオール
      } else {
        expect(opt).toMatch(/^子\d+点 \/ 親\d+点$/); // 子ツモ: 子X/親Y
      }
    }
  });

  test("解説画面へ直接遷移した場合はフォールバック導線を表示する", async ({ page }) => {
    await page.goto("/result");
    await expect(page.getByText(/問題データがありません/)).toBeVisible();
    await page.getByRole("link", { name: "出題画面" }).click();
    await expect(page).toHaveURL(/\/quiz$/);
  });

  test("成績が無い状態では練習を促す導線を表示する", async ({ page }) => {
    await page.goto("/stats");
    await expect(page.getByText(/まだ回答履歴がありません/)).toBeVisible();
    await expect(page.getByText("0%")).toBeVisible();
  });

  test("ページ遷移中に致命的なコンソールエラーが発生しない", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.getByRole("link", { name: "練習を始める" }).click();
    await page.getByLabel("点数を選択してください").selectOption({ index: 1 });
    await page.getByRole("button", { name: "回答する" }).click();
    await page.getByRole("link", { name: "次の問題へ" }).click();

    expect(errors).toEqual([]);
  });
});
