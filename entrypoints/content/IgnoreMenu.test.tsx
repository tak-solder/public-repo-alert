import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";
import {render, screen, act, cleanup, fireEvent} from "@testing-library/react";
import {IgnoreMenu} from "./IgnoreMenu";

const mockAddIgnorePattern = vi.fn();

vi.mock("@/utils/storage", () => ({
  addIgnorePattern: (...args: unknown[]) => mockAddIgnorePattern(...args),
}));

describe("IgnoreMenu", () => {
  beforeEach(() => {
    mockAddIgnorePattern.mockReset();
    mockAddIgnorePattern.mockResolvedValue(true);
  });

  afterEach(() => {
    cleanup();
  });

  it("3点メニューアイコンが表示される", () => {
    render(<IgnoreMenu repositoryName="owner/repo" />);
    expect(screen.getByLabelText("Ignore options")).toBeInTheDocument();
  });

  it("ボタンクリックでドロップダウンメニューが開く", async () => {
    render(<IgnoreMenu repositoryName="owner/repo" />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Ignore options"));
    });

    expect(screen.getByText("Ignore this repository")).toBeInTheDocument();
    expect(screen.getByText("Ignore this owner's repositories")).toBeInTheDocument();
  });

  it("メニューが開いた状態でボタンを再クリックするとメニューが閉じる", async () => {
    render(<IgnoreMenu repositoryName="owner/repo" />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Ignore options"));
    });
    expect(screen.getByText("Ignore this repository")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Ignore options"));
    });
    expect(screen.queryByText("Ignore this repository")).not.toBeInTheDocument();
  });

  it("メニュー外をクリックするとメニューが閉じる", async () => {
    render(<IgnoreMenu repositoryName="owner/repo" />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Ignore options"));
    });
    expect(screen.getByText("Ignore this repository")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(document.body);
    });
    expect(screen.queryByText("Ignore this repository")).not.toBeInTheDocument();
  });

  it("Ignore this repository を選択すると owner/repo 形式で除外登録される", async () => {
    render(<IgnoreMenu repositoryName="owner/repo" />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Ignore options"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Ignore this repository"));
    });

    expect(mockAddIgnorePattern).toHaveBeenCalledWith("owner/repo");
  });

  it("Ignore this owner's repositories を選択すると owner/* 形式で除外登録される", async () => {
    render(<IgnoreMenu repositoryName="owner/repo" />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Ignore options"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Ignore this owner's repositories"));
    });

    expect(mockAddIgnorePattern).toHaveBeenCalledWith("owner/*");
  });

  it("repositoryName が大文字を含む場合でもそのまま渡される", async () => {
    render(<IgnoreMenu repositoryName="Owner/Repo" />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Ignore options"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Ignore this repository"));
    });

    expect(mockAddIgnorePattern).toHaveBeenCalledWith("Owner/Repo");
  });

  it("メニュー項目選択後にメニューが閉じる", async () => {
    render(<IgnoreMenu repositoryName="owner/repo" />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Ignore options"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Ignore this repository"));
    });

    expect(screen.queryByText("Ignore this repository")).not.toBeInTheDocument();
  });
});
