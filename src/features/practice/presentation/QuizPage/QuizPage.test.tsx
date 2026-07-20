import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Problem } from "../../domain/problem";
import { scoreHand } from "@/engine/scoreHand";
import { parseTileNotation } from "@/engine/tiles";
import { DEFAULT_SETTINGS, type AppSettings } from "@/features/settings/domain/appSettings";
import { SettingsProvider } from "@/features/settings/presentation/SettingsContext";
import type { SettingsRepository } from "@/features/settings/application/settingsRepository";
import { loadStats } from "../../application/statsStore";
import { QuizPage } from "./QuizPage";
import { ResultPage } from "../ResultPage/ResultPage";
import { StatsPage } from "../StatsPage/StatsPage";

function tiles(compact: string) {
  const parts = compact.match(/\d+[mpsz]/g) ?? [];
  const out: ReturnType<typeof parseTileNotation>[] = [];
  for (const part of parts) {
    const suit = part[part.length - 1];
    for (const digit of part.slice(0, -1)) out.push(parseTileNotation(`${digit}${suit}`));
  }
  return out;
}

// リーチ+平和+ドラ2 = 4翻30符（基本点1920）の境界手。roundUpMangan有無で正解点数が変わる。
function boundaryProblem(): Problem {
  const hand = {
    concealed: tiles("234m567p33z345s789m"),
    melds: [],
    winningTile: parseTileNotation("9m"),
    winType: "ron" as const,
  };
  const conditions = {
    seatWind: "east" as const,
    roundWind: "east" as const,
    isDealer: false,
    riichi: true,
  };
  const doraIndicators = [parseTileNotation("2s"), parseTileNotation("6p")];
  const answer = scoreHand({
    ...hand,
    doraIndicators,
    uraDoraIndicators: [],
    ...conditions,
  });
  if (!answer) throw new Error("テスト用の境界手が不正です");

  return {
    id: "test-boundary",
    source: "generated",
    hand,
    doraIndicators,
    uraDoraIndicators: [],
    conditions,
    answer,
    tags: { fuType: 30, yakuCategories: ["リーチ", "平和"] },
  };
}

// boundaryProblem() のリーチを外した手。ピンフのみで1役成立するため、依然として正当な和了形。
function nonRiichiProblem(): Problem {
  const base = boundaryProblem();
  const conditions = { ...base.conditions, riichi: false };
  const answer = scoreHand({
    ...base.hand,
    doraIndicators: base.doraIndicators,
    uraDoraIndicators: [],
    ...conditions,
  });
  if (!answer) throw new Error("テスト用の非リーチ手が不正です");
  return { ...base, id: "test-non-riichi", conditions, answer };
}

function createInMemoryRepository(initial: AppSettings = DEFAULT_SETTINGS): SettingsRepository {
  let stored = initial;
  return {
    async load() {
      return stored;
    },
    async save(next) {
      stored = next;
    },
  };
}

function renderQuiz(repository: SettingsRepository = createInMemoryRepository()) {
  return render(
    <MemoryRouter initialEntries={["/quiz"]}>
      <SettingsProvider repository={repository}>
        <Routes>
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </SettingsProvider>
    </MemoryRouter>,
  );
}

function renderQuizWithProblem(problem: Problem, repository: SettingsRepository) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/quiz", state: { problem, review: true } }]}>
      <SettingsProvider repository={repository}>
        <Routes>
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/result" element={<ResultPage />} />
        </Routes>
      </SettingsProvider>
    </MemoryRouter>,
  );
}

describe("QuizPage", () => {
  it("renders the hand, conditions, 4 answer choices, and a skip button", () => {
    const { container } = renderQuiz();
    expect(screen.getByRole("heading", { name: "点数計算" })).toBeInTheDocument();
    expect(container.querySelectorAll(".quiz-choice-btn")).toHaveLength(4);
    expect(screen.getByRole("button", { name: "次の問題へ" })).toBeInTheDocument();
  });

  it("shows the result inline on the same screen when a choice is clicked (no navigation)", () => {
    const { container } = renderQuiz();
    const choiceButtons = container.querySelectorAll(".quiz-choice-btn");
    fireEvent.click(choiceButtons[0]);

    // 正誤に依らず常に表示される要素のみを検証する（正誤ごとの詳細はResultPage.test.tsxで検証）。
    // 遷移していないため、見出しは引き続き「点数計算」のまま（「解説」ページには行かない）。
    expect(screen.getByRole("heading", { name: "点数計算" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "解説" })).not.toBeInTheDocument();
    expect(screen.getByText(/答え:/)).toBeInTheDocument();
    // 回答後は選択肢が消え、「次の問題へ」ボタンのみが残る。
    expect(container.querySelectorAll(".quiz-choice-btn")).toHaveLength(0);
  });

  it("回答を記録し、「次の問題へ」を押すと遷移せずに新しい問題が出る", () => {
    localStorage.clear();
    const { container } = renderQuiz();
    const before = loadStats().totalAnswered;

    fireEvent.click(container.querySelectorAll(".quiz-choice-btn")[0]);
    expect(loadStats().totalAnswered).toBe(before + 1);

    fireEvent.click(screen.getByRole("button", { name: "次の問題へ" }));

    expect(screen.getByRole("heading", { name: "点数計算" })).toBeInTheDocument();
    expect(container.querySelectorAll(".quiz-choice-btn")).toHaveLength(4);
    expect(loadStats().totalAnswered).toBe(before + 1); // 「次へ」自体は記録しない
  });

  it("復習（同じ問題への再回答）は成績に記録しない", async () => {
    localStorage.clear();
    const repo = createInMemoryRepository({ schemaVersion: 1, roundUpMangan: false });
    const { container } = renderQuizWithProblem(boundaryProblem(), repo);
    await waitFor(() => expect(screen.getByRole("button", { name: "7700" })).toBeInTheDocument());
    const before = loadStats().totalAnswered;

    fireEvent.click(container.querySelectorAll(".quiz-choice-btn")[0]);

    expect(loadStats().totalAnswered).toBe(before);
  });

  it("skipping stays on the quiz page without recording an answer", () => {
    localStorage.clear();
    renderQuiz();
    const before = loadStats().totalAnswered;

    fireEvent.click(screen.getByRole("button", { name: "次の問題へ" }));

    expect(screen.getByRole("heading", { name: "点数計算" })).toBeInTheDocument();
    expect(loadStats().totalAnswered).toBe(before);
  });

  it("skipping loads a new problem (choice set is re-generated)", () => {
    const { container } = renderQuiz();
    // スキップを繰り返しても常に4択+スキップボタンの構成が保たれる（新しい問題に切り替わる）。
    fireEvent.click(screen.getByRole("button", { name: "次の問題へ" }));
    expect(container.querySelectorAll(".quiz-choice-btn")).toHaveLength(4);
  });

  it("切り上げ満貫OFF: 境界手は標準ルールの点数(7700)のまま、タグは非表示", async () => {
    const repo = createInMemoryRepository({ schemaVersion: 1, roundUpMangan: false });
    renderQuizWithProblem(boundaryProblem(), repo);

    await waitFor(() => expect(screen.getByRole("button", { name: "7700" })).toBeInTheDocument());
    expect(screen.queryByText("満貫切上")).not.toBeInTheDocument();
  });

  it("切り上げ満貫ON: 境界手が満貫(8000)に切り上がり、条件タグの先頭に表示される", async () => {
    const repo = createInMemoryRepository({ schemaVersion: 1, roundUpMangan: true });
    const { container } = renderQuizWithProblem(boundaryProblem(), repo);

    await waitFor(() => expect(screen.getByRole("button", { name: "8000" })).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "7700" })).not.toBeInTheDocument();

    const section = container.querySelector(".quiz-conditions");
    expect(section?.firstElementChild?.textContent).toBe("満貫切上");
  });

  it("切り上げ満貫ON: 選択後のインライン結果にも満貫(8000)の答えが表示される", async () => {
    const repo = createInMemoryRepository({ schemaVersion: 1, roundUpMangan: true });
    renderQuizWithProblem(boundaryProblem(), repo);

    const choice = await screen.findByRole("button", { name: "8000" });
    fireEvent.click(choice);

    expect(await screen.findByText(/答え: 8000/)).toBeInTheDocument();
  });

  it("正解時は解説がデフォルトで畳まれ、トグルで展開すると内訳が現れる（遷移なし）", async () => {
    const repo = createInMemoryRepository({ schemaVersion: 1, roundUpMangan: false });
    const { container } = renderQuizWithProblem(boundaryProblem(), repo);
    const correctChoice = await screen.findByRole("button", { name: "7700" });
    fireEvent.click(correctChoice);

    expect(await screen.findByText("○ 正解")).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: /解説はこちら/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    // 「内訳」見出し行（正誤・答え）は畳んでいても常に表示される。
    expect(container.querySelector(".result-breakdown")).toBeInTheDocument();
    expect(screen.queryByTestId("result-breakdown-body")).not.toBeInTheDocument();
    expect(screen.queryByText("平和")).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("result-breakdown-body")).toBeInTheDocument();
    expect(screen.getByText("平和")).toBeInTheDocument();
    // ページ遷移は発生していない
    expect(screen.getByRole("heading", { name: "点数計算" })).toBeInTheDocument();
  });

  it("不正解時は解説がデフォルトで展開されている（非懲罰: 罰的な演出はしない）", async () => {
    const repo = createInMemoryRepository({ schemaVersion: 1, roundUpMangan: false });
    const { container } = renderQuizWithProblem(boundaryProblem(), repo);
    await waitFor(() => expect(screen.getByRole("button", { name: "7700" })).toBeInTheDocument());
    const wrongChoice = Array.from(container.querySelectorAll(".quiz-choice-btn")).find(
      (b) => b.textContent !== "7700",
    )!;
    fireEvent.click(wrongChoice);

    expect(await screen.findByText("✕ 不正解")).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: /解説はこちら/ });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("result-breakdown-body")).toBeInTheDocument();
    expect(screen.getByText("平和")).toBeInTheDocument();

    // ユーザーは手動で畳める（畳んでも「内訳」見出し行の正誤・答えは表示されたまま）
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(container.querySelector(".result-breakdown")).toBeInTheDocument();
    expect(screen.queryByTestId("result-breakdown-body")).not.toBeInTheDocument();
    expect(screen.getByText("✕ 不正解")).toBeInTheDocument();
  });

  it("リーチ表示は上段の条件バッジではなく、アガリ牌の右隣（リーチ枠内）に出る", async () => {
    const repo = createInMemoryRepository({ schemaVersion: 1, roundUpMangan: false });
    const { container } = renderQuizWithProblem(boundaryProblem(), repo);

    await waitFor(() => expect(screen.getByRole("button", { name: "7700" })).toBeInTheDocument());

    const conditionsSection = container.querySelector(".quiz-conditions");
    expect(conditionsSection?.textContent).not.toContain("リーチ");

    const riichiSection = container.querySelector(".riichi-indicator-section");
    expect(riichiSection).not.toHaveClass("riichi-indicator-spacer");
    expect(riichiSection).not.toHaveAttribute("aria-hidden");
    expect(riichiSection?.textContent).toBe("リーチ");
    expect(riichiSection?.querySelector(".riichi-indicator-stick")).toBeInTheDocument();
  });

  it("非リーチの問題では、リーチ枠（「リーチ」ラベル＋点棒画像）は確保されるが非表示になる（ドラ表示牌の位置を動かさないため）", async () => {
    const repo = createInMemoryRepository();
    const { container } = renderQuizWithProblem(nonRiichiProblem(), repo);

    await waitFor(() => expect(container.querySelectorAll(".quiz-choice-btn")).toHaveLength(4));

    const riichiSection = container.querySelector(".riichi-indicator-section");
    expect(riichiSection).toHaveClass("riichi-indicator-spacer");
    expect(riichiSection).toHaveAttribute("aria-hidden", "true");
    expect(riichiSection?.querySelector(".riichi-indicator-stick")).toBeInTheDocument();
  });

  it("returns to the score quiz page (not the fu quiz page) after viewing stats", () => {
    renderQuiz();
    // 「成績」はサイドバー内にあるため、まずハンバーガーボタンでサイドバーを開く。
    fireEvent.click(screen.getByRole("button", { name: "メニューを開く" }));
    fireEvent.click(screen.getByRole("link", { name: "成績" }));
    expect(screen.getByRole("heading", { name: "成績" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "練習に戻る" })).toHaveAttribute("href", "/quiz");
  });

  it("keeps the same problem and the same choice order after a stats round trip", () => {
    renderQuiz();
    const choicesBefore = screen
      .getAllByRole("button")
      .filter((b) => b !== screen.getByRole("button", { name: "次の問題へ" }))
      .filter((b) => b.getAttribute("aria-label") !== "メニューを開く")
      .map((b) => b.textContent);

    fireEvent.click(screen.getByRole("button", { name: "メニューを開く" }));
    fireEvent.click(screen.getByRole("link", { name: "成績" }));
    fireEvent.click(screen.getByRole("link", { name: "練習に戻る" }));

    const choicesAfter = screen
      .getAllByRole("button")
      .filter((b) => b !== screen.getByRole("button", { name: "次の問題へ" }))
      .filter((b) => b.getAttribute("aria-label") !== "メニューを開く")
      .map((b) => b.textContent);
    expect(choicesAfter).toEqual(choicesBefore);
  });

  it("サイドバーはオーバーレイタップ・×ボタン・ESCキーで閉じる", () => {
    renderQuiz();
    const opener = screen.getByRole("button", { name: "メニューを開く" });

    fireEvent.click(opener);
    expect(screen.getByRole("dialog", { name: "メニュー" })).toBeInTheDocument();
    fireEvent.click(document.querySelector(".sidebar-overlay")!);
    expect(screen.queryByRole("dialog", { name: "メニュー" })).not.toBeInTheDocument();

    fireEvent.click(opener);
    fireEvent.click(screen.getByRole("button", { name: "閉じる" }));
    expect(screen.queryByRole("dialog", { name: "メニュー" })).not.toBeInTheDocument();

    fireEvent.click(opener);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "メニュー" })).not.toBeInTheDocument();
  });

  it("未回答時は「もう一度」ボタンが存在しない", () => {
    renderQuiz();
    expect(screen.queryByRole("button", { name: /もう一度/ })).not.toBeInTheDocument();
  });

  it("「もう一度」を押すと同じ問題が未回答状態（4択・同じ選択肢）で再表示される", () => {
    const { container } = renderQuiz();
    const choicesBefore = Array.from(container.querySelectorAll(".quiz-choice-btn")).map(
      (b) => b.textContent,
    );
    fireEvent.click(container.querySelectorAll(".quiz-choice-btn")[0]);
    expect(screen.getByText(/答え:/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /もう一度/ }));

    expect(screen.queryByText(/答え:/)).not.toBeInTheDocument();
    const choicesAfter = Array.from(container.querySelectorAll(".quiz-choice-btn")).map(
      (b) => b.textContent,
    );
    expect(choicesAfter).toEqual(choicesBefore);
  });

  it("「もう一度」後の再回答は成績に記録しない", () => {
    localStorage.clear();
    const { container } = renderQuiz();
    const before = loadStats().totalAnswered;

    fireEvent.click(container.querySelectorAll(".quiz-choice-btn")[0]);
    expect(loadStats().totalAnswered).toBe(before + 1);

    fireEvent.click(screen.getByRole("button", { name: /もう一度/ }));
    fireEvent.click(container.querySelectorAll(".quiz-choice-btn")[0]);

    expect(loadStats().totalAnswered).toBe(before + 1); // もう一度後の再回答は計上しない
  });

  it("「もう一度」後に「次の問題へ」を押すと、以降の新しい問題は通常どおり成績に記録される", () => {
    localStorage.clear();
    const { container } = renderQuiz();
    const before = loadStats().totalAnswered;

    fireEvent.click(container.querySelectorAll(".quiz-choice-btn")[0]);
    fireEvent.click(screen.getByRole("button", { name: /もう一度/ }));
    fireEvent.click(container.querySelectorAll(".quiz-choice-btn")[0]);
    fireEvent.click(screen.getByRole("button", { name: "次の問題へ" }));

    expect(container.querySelectorAll(".quiz-choice-btn")).toHaveLength(4);
    fireEvent.click(container.querySelectorAll(".quiz-choice-btn")[0]);

    expect(loadStats().totalAnswered).toBe(before + 2); // 元の1回 + 「次の問題へ」後の新しい問題1回
  });

  it("モメンタムカウンタ（今日の回答数・連続正解）が出題中・結果時ともに表示される", () => {
    localStorage.clear();
    const { container } = renderQuiz();
    expect(screen.getByTestId("momentum-today").textContent).toBe("0");
    expect(screen.getByTestId("momentum-streak").textContent).toBe("0");

    fireEvent.click(container.querySelectorAll(".quiz-choice-btn")[0]);

    // 結果表示中も同じ要素で表示され続ける（別ページに切り替わらない）。
    expect(screen.getByTestId("momentum-today").textContent).toBe("1");
  });

  it("回答結果に応じてモメンタムカウンタが正しく更新される（正解=両方加算／不正解=連続正解のみ0・回答数は減らない）", () => {
    // 正誤は問題ごとに変わる（generateChoices はランダム）ため、実際に表示された判定
    // （○正解／✕不正解）に応じて期待値を分岐させる。加算・非懲罰のルール自体は
    // statsStore.test.ts の recordAnswer テストで正誤を固定して網羅済み。
    localStorage.clear();
    const { container } = renderQuiz();

    fireEvent.click(container.querySelectorAll(".quiz-choice-btn")[0]);

    const isCorrect = !!screen.queryByText("○ 正解");
    expect(screen.getByTestId("momentum-today").textContent).toBe("1"); // 正誤によらず加算
    expect(screen.getByTestId("momentum-streak").textContent).toBe(isCorrect ? "1" : "0");
  });

  it("点数早見表ボタンはヘッダー（ハンバーガーの隣）にある", () => {
    const { container } = renderQuiz();
    const tableBtn = screen.getByRole("button", { name: "点数早見表を開く" });
    const hamburger = screen.getByRole("button", { name: "メニューを開く" });

    // ヘッダー内の同じアクション群（ハンバーガーの隣）にあり、旧ツールバー配置ではない。
    const actions = container.querySelector(".page-header-actions");
    expect(actions?.contains(tableBtn)).toBe(true);
    expect(actions?.contains(hamburger)).toBe(true);
    expect(container.querySelector(".qp-toolbar")).not.toBeInTheDocument();
  });
});
