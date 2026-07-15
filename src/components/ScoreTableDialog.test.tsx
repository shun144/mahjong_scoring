import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScoreTableDialog } from "./ScoreTableDialog";

type ObserverCallback = (
  entries: Pick<IntersectionObserverEntry, "target" | "isIntersecting">[],
) => void;

// jsdom は IntersectionObserver を実装していないため、パネルの可視判定をモックで代替する。
class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: ObserverCallback;
  observed: Element[] = [];

  constructor(callback: ObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  observe(el: Element) {
    this.observed.push(el);
  }

  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

function noop() {}

// jsdom は <dialog> の showModal/close を実装していないため、最小限の挙動をポリフィルする
// （open 属性の反映と close イベント発火のみ。フォーカストラップ等はブラウザ機能のため対象外）。
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
}
if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}
// jsdom はレイアウトを行わないため Element.scrollTo も未実装。呼び出しの発生自体を検証したい
// テストではないので no-op で構わない。
if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function () {};
}

beforeEach(() => {
  MockIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ScoreTableDialog", () => {
  it("トグル押下でアクティブ側（aria-pressed）が切り替わる", () => {
    render(<ScoreTableDialog open onClose={noop} />);
    const dealerBtn = screen.getByRole("button", { name: "親" });
    const nonDealerBtn = screen.getByRole("button", { name: "子" });

    expect(dealerBtn).toHaveAttribute("aria-pressed", "true");
    expect(nonDealerBtn).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(nonDealerBtn);

    expect(dealerBtn).toHaveAttribute("aria-pressed", "false");
    expect(nonDealerBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("スワイプ（IntersectionObserver発火）でトグルの選択状態が同期する", () => {
    render(<ScoreTableDialog open onClose={noop} />);
    const dealerBtn = screen.getByRole("button", { name: "親" });
    const nonDealerBtn = screen.getByRole("button", { name: "子" });

    const observer = MockIntersectionObserver.instances[0];
    expect(observer).toBeDefined();
    expect(observer.observed).toHaveLength(2);
    const [dealerPanel, nonDealerPanel] = observer.observed;

    // 子パネル側へスワイプして可視になった状況をシミュレートする。
    act(() => {
      observer.callback([{ target: nonDealerPanel, isIntersecting: true }]);
    });

    expect(dealerBtn).toHaveAttribute("aria-pressed", "false");
    expect(nonDealerBtn).toHaveAttribute("aria-pressed", "true");

    // 親パネル側へ戻った状況もシミュレートする。
    act(() => {
      observer.callback([{ target: dealerPanel, isIntersecting: true }]);
    });

    expect(dealerBtn).toHaveAttribute("aria-pressed", "true");
    expect(nonDealerBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("非交差のエントリでは選択状態を変えない", () => {
    render(<ScoreTableDialog open onClose={noop} />);
    const dealerBtn = screen.getByRole("button", { name: "親" });
    const nonDealerBtn = screen.getByRole("button", { name: "子" });
    const observer = MockIntersectionObserver.instances[0];
    const [, nonDealerPanel] = observer.observed;

    act(() => {
      observer.callback([{ target: nonDealerPanel, isIntersecting: false }]);
    });

    expect(dealerBtn).toHaveAttribute("aria-pressed", "true");
    expect(nonDealerBtn).toHaveAttribute("aria-pressed", "false");
  });
});
