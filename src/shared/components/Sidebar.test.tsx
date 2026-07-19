import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { HamburgerButton } from "../../components/HamburgerButton";
import { Sidebar } from "./Sidebar";

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <HamburgerButton open={open} onClick={() => setOpen((o) => !o)} />
      <Sidebar open={open} onClose={() => setOpen(false)} label="メニュー">
        <a href="/" className="sidebar-nav-item">
          ホーム
        </a>
        <a href="/stats" className="sidebar-nav-item">
          成績
        </a>
      </Sidebar>
    </div>
  );
}

describe("HamburgerButton + Sidebar", () => {
  it("closed by default with aria-expanded=false, and opens on click", () => {
    render(<Harness />);
    const button = screen.getByRole("button", { name: "メニューを開く" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog", { name: "メニュー" })).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.getByRole("dialog", { name: "メニュー" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "メニューを閉じる" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("moves focus to the close button when opened", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "メニューを開く" }));
    expect(screen.getByRole("button", { name: "閉じる" })).toHaveFocus();
  });

  it("closes via the overlay, the close button, and Escape", () => {
    render(<Harness />);
    const opener = () => screen.getByRole("button", { name: "メニューを開く" });

    // サイドバーは document.body へ portal されるため、render() の container ではなく
    // document から探す（Sidebar.tsx: backdrop-filter を持つヘッダー配下だと
    // position:fixed の包含ブロックがビューポートでなくなるため portal が必須）。
    fireEvent.click(opener());
    fireEvent.click(document.querySelector(".sidebar-overlay")!);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(opener());
    fireEvent.click(screen.getByRole("button", { name: "閉じる" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(opener());
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("traps Tab focus within the panel (wraps from last back to first)", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "メニューを開く" }));

    const stats = screen.getByRole("link", { name: "成績" });
    stats.focus();
    expect(stats).toHaveFocus();

    fireEvent.keyDown(document, { key: "Tab" });
    expect(screen.getByRole("button", { name: "閉じる" })).toHaveFocus();
  });

  it("renders both navigation links inside the sidebar", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "メニューを開く" }));
    expect(screen.getByRole("link", { name: "ホーム" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "成績" })).toBeInTheDocument();
  });

  it("portal先はdocument.bodyの直下で、開いたボタンの祖先の外に出る(backdrop-filter配下のposition:fixedが潰れる問題の回帰防止)", () => {
    const { container } = render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "メニューを開く" }));

    const dialog = screen.getByRole("dialog", { name: "メニュー" });
    expect(container.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });
});
