import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { ThemeProvider, BaseStyles } from "@primer/react";
import { Setting } from "./Setting";
import type { Config } from "@/utils/config";

vi.mock("@/utils/config", () => ({
  saveConfig: vi.fn(),
}));
import { saveConfig } from "@/utils/config";
const mockSaveConfig = vi.mocked(saveConfig);

function renderSetting(config: Config) {
  return render(
    <ThemeProvider>
      <BaseStyles>
        <Setting config={config} />
      </BaseStyles>
    </ThemeProvider>,
  );
}

describe("Setting", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSaveConfig.mockReset();
    mockSaveConfig.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    cleanup();
  });

  describe("初期表示", () => {
    it("除外パターンが改行区切りでtextareaに表示される", () => {
      renderSetting({ ignoreRepositoryPatterns: ["repo-a", "repo-b"] });

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue("repo-a\nrepo-b");
    });

    it("除外パターンが空配列の場合はtextareaが空", () => {
      renderSetting({ ignoreRepositoryPatterns: [] });

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue("");
    });

    it("placeholderが正しく設定される", () => {
      renderSetting({ ignoreRepositoryPatterns: [] });

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute(
        "placeholder",
        "eg. username/repo-name\n^username/",
      );
    });

    it("Saveボタンが有効状態で表示される", () => {
      renderSetting({ ignoreRepositoryPatterns: [] });

      const button = screen.getByRole("button", { name: "Save" });
      expect(button).toBeEnabled();
    });

    it("見出しが表示される", () => {
      renderSetting({ ignoreRepositoryPatterns: [] });

      expect(
        screen.getByRole("heading", { name: "Public repo Alert Settings" }),
      ).toBeInTheDocument();
    });
  });

  describe("フォーム送信", () => {
    async function submitWithValue(value: string) {
      renderSetting({ ignoreRepositoryPatterns: [] });
      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value } });
      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: "Save" }).closest("form")!);
      });
    }

    it("入力値が改行で分割されてsaveConfigに渡される", async () => {
      await submitWithValue("owner/repo\norg/lib");

      expect(mockSaveConfig).toHaveBeenCalledWith({
        ignoreRepositoryPatterns: ["owner/repo", "org/lib"],
      });
    });

    it("各行がtrimされる", async () => {
      await submitWithValue("  owner/repo  \n  org/lib  ");

      expect(mockSaveConfig).toHaveBeenCalledWith({
        ignoreRepositoryPatterns: ["owner/repo", "org/lib"],
      });
    });

    it("空行が除去される", async () => {
      await submitWithValue("owner/repo\n\n\norg/lib\n");

      expect(mockSaveConfig).toHaveBeenCalledWith({
        ignoreRepositoryPatterns: ["owner/repo", "org/lib"],
      });
    });

    it("CRLFの改行コードで正しく分割される", async () => {
      await submitWithValue("owner/repo\r\norg/lib");

      expect(mockSaveConfig).toHaveBeenCalledWith({
        ignoreRepositoryPatterns: ["owner/repo", "org/lib"],
      });
    });

    it("CRの改行コードで正しく分割される", async () => {
      await submitWithValue("owner/repo\rorg/lib");

      expect(mockSaveConfig).toHaveBeenCalledWith({
        ignoreRepositoryPatterns: ["owner/repo", "org/lib"],
      });
    });

    it("textareaが空の場合は空配列で保存される", async () => {
      await submitWithValue("");

      expect(mockSaveConfig).toHaveBeenCalledWith({
        ignoreRepositoryPatterns: [],
      });
    });

    it("空白のみの行しかない場合は空配列で保存される", async () => {
      await submitWithValue("   \n   \n   ");

      expect(mockSaveConfig).toHaveBeenCalledWith({
        ignoreRepositoryPatterns: [],
      });
    });

    it("パターンが1つだけの場合", async () => {
      await submitWithValue("owner/repo");

      expect(mockSaveConfig).toHaveBeenCalledWith({
        ignoreRepositoryPatterns: ["owner/repo"],
      });
    });
  });

  describe("Savedボタン", () => {
    async function submitForm() {
      renderSetting({ ignoreRepositoryPatterns: [] });
      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value: "owner/repo" } });
      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: "Save" }).closest("form")!);
      });
    }

    it("フォーム送信後にSavedボタンに切り替わる", async () => {
      await submitForm();

      const savedButton = screen.getByRole("button", { name: "Saved" });
      expect(savedButton).toBeDisabled();
    });

    it("Savedボタンが3秒後にSaveボタンに戻る", async () => {
      await submitForm();

      expect(screen.getByRole("button", { name: "Saved" })).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      const saveButton = screen.getByRole("button", { name: "Save" });
      expect(saveButton).toBeEnabled();
    });

    it("Savedボタンが3秒未満ではSaveに戻らない", async () => {
      await submitForm();

      await act(async () => {
        vi.advanceTimersByTime(2999);
      });

      expect(screen.getByRole("button", { name: "Saved" })).toBeDisabled();
    });
  });
});
