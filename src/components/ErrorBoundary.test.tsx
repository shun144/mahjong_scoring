import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

function Bomb(): never {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  it("renders children normally when there is no error", () => {
    render(
      <ErrorBoundary>
        <p>hello</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("renders a fallback UI instead of a blank page when a child throws", () => {
    // Reactは開発モードでエラーをconsole.errorに出力するため、テスト出力を汚さないよう抑制する
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(screen.getByText("問題が発生しました")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ホームに戻る" })).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
