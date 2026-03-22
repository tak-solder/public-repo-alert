import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { App } from "./App";

vi.mock("@/utils/config", () => ({
  loadConfig: vi.fn(),
}));
import { loadConfig } from "@/utils/config";
const mockLoadConfig = vi.mocked(loadConfig);

describe("App", () => {
  beforeEach(() => {
    mockLoadConfig.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("設定読み込み完了前はSettingが表示されない", async () => {
    mockLoadConfig.mockReturnValue(new Promise(() => {}));

    await act(async () => {
      render(<App />);
    });

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("設定読み込み完了後にSettingが表示される", async () => {
    mockLoadConfig.mockResolvedValue({ ignoreRepositoryPatterns: [] });

    await act(async () => {
      render(<App />);
    });

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("保存済みの除外パターンがtextareaに表示される", async () => {
    mockLoadConfig.mockResolvedValue({
      ignoreRepositoryPatterns: ["owner/repo", "^org/"],
    });

    await act(async () => {
      render(<App />);
    });

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("owner/repo\n^org/");
  });
});
