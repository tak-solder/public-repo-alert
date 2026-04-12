import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { ThemeProvider, BaseStyles } from "@primer/react";
import { Setting } from "./Setting";

vi.mock("@/utils/storage", () => ({
  ignoreListItem: {
    setValue: vi.fn(),
  },
}));
import { ignoreListItem } from "@/utils/storage";
const mockSetValue = vi.mocked(ignoreListItem.setValue);

function renderSetting(ignoreList: string[]) {
  return render(
    <ThemeProvider>
      <BaseStyles>
        <Setting ignoreList={ignoreList} />
      </BaseStyles>
    </ThemeProvider>,
  );
}

describe("Setting", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSetValue.mockReset();
    mockSetValue.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    cleanup();
  });

  describe("初期表示", () => {
    it("除外リストが改行区切りでtextareaに表示される", () => {
      renderSetting(["repo-a", "repo-b"]);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue("repo-a\nrepo-b");
    });

    it("除外リストが空配列の場合はtextareaが空", () => {
      renderSetting([]);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue("");
    });

    it("placeholderが正しく設定される", () => {
      renderSetting([]);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute(
        "placeholder",
        "eg. username/repo-name\nusername/*",
      );
    });

    it("Saveボタンが有効状態で表示される", () => {
      renderSetting([]);

      const button = screen.getByRole("button", { name: "Save" });
      expect(button).toBeEnabled();
    });

    it("見出しが表示される", () => {
      renderSetting([]);

      expect(
        screen.getByRole("heading", { name: "Public repo Alert Settings" }),
      ).toBeInTheDocument();
    });
  });

  describe("フォーム送信", () => {
    async function submitWithValue(value: string) {
      renderSetting([]);
      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value } });
      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: "Save" }).closest("form")!);
      });
    }

    it("入力値が改行で分割されてignoreListItemに保存される", async () => {
      await submitWithValue("owner/repo\norg/lib");

      expect(mockSetValue).toHaveBeenCalledWith(["owner/repo", "org/lib"]);
    });

    it("各行がtrimされる", async () => {
      await submitWithValue("  owner/repo  \n  org/lib  ");

      expect(mockSetValue).toHaveBeenCalledWith(["owner/repo", "org/lib"]);
    });

    it("空行が除去される", async () => {
      await submitWithValue("owner/repo\n\n\norg/lib\n");

      expect(mockSetValue).toHaveBeenCalledWith(["owner/repo", "org/lib"]);
    });

    it("CRLFの改行コードで正しく分割される", async () => {
      await submitWithValue("owner/repo\r\norg/lib");

      expect(mockSetValue).toHaveBeenCalledWith(["owner/repo", "org/lib"]);
    });

    it("CRの改行コードで正しく分割される", async () => {
      await submitWithValue("owner/repo\rorg/lib");

      expect(mockSetValue).toHaveBeenCalledWith(["owner/repo", "org/lib"]);
    });

    it("textareaが空の場合は空配列で保存される", async () => {
      await submitWithValue("");

      expect(mockSetValue).toHaveBeenCalledWith([]);
    });

    it("空白のみの行しかない場合は空配列で保存される", async () => {
      await submitWithValue("   \n   \n   ");

      expect(mockSetValue).toHaveBeenCalledWith([]);
    });

    it("パターンが1つだけの場合", async () => {
      await submitWithValue("owner/repo");

      expect(mockSetValue).toHaveBeenCalledWith(["owner/repo"]);
    });
  });

  describe("Savedボタン", () => {
    async function submitForm() {
      renderSetting([]);
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
