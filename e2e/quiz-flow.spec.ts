import { expect, test } from "@playwright/test";

test.describe("麻雀点数トレーニング - 一連の学習フロー", () => {
  test("ホーム→出題→回答→解説→次の問題→成績、の一連が動作する", async ({ page }) => {
    await page.goto("");
    await expect(page.getByRole("heading", { name: "麻雀点数トレーニング" })).toBeVisible();

    await page.getByRole("link", { name: "点数計算" }).click();
    await expect(page).toHaveURL(/\/quiz$/);
    await expect(page.getByRole("heading", { name: "出題" })).toBeVisible();

    // 手牌（牌画像）が表示されている
    await expect(page.getByRole("img").first()).toBeVisible();

    // 4つの選択肢ボタンのうち1つを押すと即座に解説へ遷移する
    const choiceButtons = page.locator(".quiz-choice-btn");
    await expect(choiceButtons).toHaveCount(4);
    await choiceButtons.first().click();

    await expect(page).toHaveURL(/\/result$/);
    await expect(page.getByRole("heading", { name: "解説" })).toBeVisible();
    await expect(page.getByText(/^正解:/)).toBeVisible();
    // 点数計算カードは見出しテキストを持たず aria-label で識別する（region ロール）。
    await expect(page.getByRole("region", { name: "点数計算" })).toBeVisible();

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
    await page.goto("quiz");

    // allTextContents() は自動待機しないため、描画完了を待ってから読み取る。
    await expect(page.locator(".quiz-choice-btn")).toHaveCount(4);

    const badgeTexts = await page.locator(".badge").allTextContents();
    const isDealer = badgeTexts.includes("親");
    // ツモ/ロンは局条件バッジではなく上がり牌のラベル(.mj-winning-label)に表示される。
    const winLabel = (await page.locator(".mj-winning-label").first().textContent())?.trim();
    const isTsumo = winLabel === "ツモ";

    const realOptions = await page.locator(".quiz-choice-btn").allTextContents();
    expect(realOptions.length).toBe(4);

    for (const opt of realOptions) {
      if (!isTsumo) {
        expect(opt).toMatch(/^\d+$/); // ロン: 単一値
      } else if (isDealer) {
        expect(opt).toMatch(/^\d+オール$/); // 親ツモ: Xオール
      } else {
        expect(opt).toMatch(/^子\d+ \/ 親\d+$/); // 子ツモ: 子X/親Y
      }
    }
  });

  test("解説画面へ直接遷移した場合はフォールバック導線を表示する", async ({ page }) => {
    await page.goto("result");
    await expect(page.getByText(/問題データがありません/)).toBeVisible();
    await page.getByRole("link", { name: "出題画面" }).click();
    await expect(page).toHaveURL(/\/quiz$/);
  });

  test("成績が無い状態では練習を促す導線を表示する", async ({ page }) => {
    await page.goto("stats");
    await expect(page.getByText(/まだ回答履歴がありません/)).toBeVisible();
    await expect(page.getByText("0%")).toBeVisible();
  });

  test("ページ遷移中に致命的なコンソールエラーが発生しない", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("");
    await page.getByRole("link", { name: "点数計算" }).click();
    await page.locator(".quiz-choice-btn").first().click();
    await page.getByRole("link", { name: "次の問題へ" }).click();

    expect(errors).toEqual([]);
  });

  test("フッターのプライバシーポリシーへどの画面からも遷移できる", async ({ page }) => {
    const footer = page.getByRole("contentinfo");

    // ホーム画面にフッターとリンクが出る
    await page.goto("");
    const privacyLink = footer.getByRole("link", { name: "プライバシーポリシー" });
    await expect(privacyLink).toBeVisible();

    // 出題画面にもフッターが出る（全画面共通）
    await page.goto("quiz");
    await expect(footer.getByRole("link", { name: "プライバシーポリシー" })).toBeVisible();

    // クリックでプライバシーポリシーページへ遷移する
    await footer.getByRole("link", { name: "プライバシーポリシー" }).click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(
      page.getByRole("heading", { name: "プライバシーポリシー", exact: true, level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /広告の配信について/ })).toBeVisible();
  });
});
