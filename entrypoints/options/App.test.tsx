import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { App } from "./App";

vi.mock("@/utils/storage", () => ({
  ignoreListItem: {
    getValue: vi.fn(),
  },
}));
import { ignoreListItem } from "@/utils/storage";
const mockGetValue = vi.mocked(ignoreListItem.getValue);

describe("App", () => {
  beforeEach(() => {
    mockGetValue.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("設定読み込み完了前はSettingが表示されない", async () => {
    mockGetValue.mockReturnValue(new Promise(() => {}));

    await act(async () => {
      render(<App />);
    });

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("設定読み込み完了後にSettingが表示される", async () => {
    mockGetValue.mockResolvedValue([]);

    render(<App />);

    expect(await screen.findByRole("textbox")).toBeInTheDocument();
  });

  it("保存済みの除外リストがtextareaに表示される", async () => {
    mockGetValue.mockResolvedValue(["owner/repo", "org/*"]);

    render(<App />);

    const textarea = await screen.findByRole("textbox");
    expect(textarea).toHaveValue("owner/repo\norg/*");
  });
});
