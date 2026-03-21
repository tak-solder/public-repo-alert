import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup, fireEvent } from "@testing-library/react";
import { BottomNotification } from "./BottomNotification";
import { OctolyticsProvider } from "./octolytics";

// loadConfig をモック
vi.mock("@/utils/config", () => ({
  loadConfig: vi.fn(),
}));
import { loadConfig } from "@/utils/config";
const mockLoadConfig = vi.mocked(loadConfig);

function setMetaTags(tags: Record<string, string>) {
  document
    .querySelectorAll('meta[name*="octolytics-"]')
    .forEach((el) => el.remove());
  for (const [name, content] of Object.entries(tags)) {
    const meta = document.createElement("meta");
    meta.setAttribute("name", name);
    meta.setAttribute("content", content);
    document.head.appendChild(meta);
  }
}

function clearMetaTags() {
  document
    .querySelectorAll('meta[name*="octolytics-"]')
    .forEach((el) => el.remove());
}

function renderWithProvider() {
  return render(
    <OctolyticsProvider>
      <BottomNotification />
    </OctolyticsProvider>,
  );
}

describe("BottomNotification", () => {
  beforeEach(() => {
    mockLoadConfig.mockReset();
  });

  afterEach(() => {
    clearMetaTags();
    cleanup();
  });

  it("needShowAlert が true の場合に通知が表示される", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    mockLoadConfig.mockResolvedValue({ ignoreRepositoryPatterns: [] });

    await act(async () => {
      renderWithProvider();
    });

    expect(screen.getByText("This repository is public")).toBeInTheDocument();
  });

  it("needShowAlert が false の場合に通知が表示されない", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "false",
    });
    mockLoadConfig.mockResolvedValue({ ignoreRepositoryPatterns: [] });

    await act(async () => {
      renderWithProvider();
    });

    expect(
      screen.queryByText("This repository is public"),
    ).not.toBeInTheDocument();
  });

  it("isLoaded が false の場合に通知が表示されない", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    mockLoadConfig.mockReturnValue(new Promise(() => {}));

    await act(async () => {
      renderWithProvider();
    });

    expect(
      screen.queryByText("This repository is public"),
    ).not.toBeInTheDocument();
  });

  it("閉じるボタンをクリックすると通知が非表示になる", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    mockLoadConfig.mockResolvedValue({ ignoreRepositoryPatterns: [] });

    await act(async () => {
      renderWithProvider();
    });

    expect(screen.getByText("This repository is public")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Close"));
    });

    expect(
      screen.queryByText("This repository is public"),
    ).not.toBeInTheDocument();
  });

  it("別リポジトリに遷移した場合 hidden がリセットされ再表示される", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo-a",
      "octolytics-dimension-repository_public": "true",
    });
    mockLoadConfig.mockResolvedValue({ ignoreRepositoryPatterns: [] });

    await act(async () => {
      renderWithProvider();
    });

    // 閉じる
    await act(async () => {
      fireEvent.click(screen.getByLabelText("Close"));
    });

    expect(
      screen.queryByText("This repository is public"),
    ).not.toBeInTheDocument();

    // 別リポジトリに遷移
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo-b",
      "octolytics-dimension-repository_public": "true",
    });

    await act(async () => {
      document.dispatchEvent(new Event("turbo:load"));
    });

    expect(screen.getByText("This repository is public")).toBeInTheDocument();
  });

  it("同一リポジトリ内で遷移した場合 hidden が維持される", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    mockLoadConfig.mockResolvedValue({ ignoreRepositoryPatterns: [] });

    await act(async () => {
      renderWithProvider();
    });

    // 閉じる
    await act(async () => {
      fireEvent.click(screen.getByLabelText("Close"));
    });

    expect(
      screen.queryByText("This repository is public"),
    ).not.toBeInTheDocument();

    // 同一リポジトリ内の遷移（repositoryName は同じ）
    await act(async () => {
      document.dispatchEvent(new Event("turbo:load"));
    });

    expect(
      screen.queryByText("This repository is public"),
    ).not.toBeInTheDocument();
  });

  it("閉じた後にリポジトリ外ページを経由して同一リポジトリに戻った場合", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    mockLoadConfig.mockResolvedValue({ ignoreRepositoryPatterns: [] });

    await act(async () => {
      renderWithProvider();
    });

    // 閉じる
    await act(async () => {
      fireEvent.click(screen.getByLabelText("Close"));
    });

    // リポジトリ外ページに遷移
    clearMetaTags();
    await act(async () => {
      document.dispatchEvent(new Event("turbo:load"));
    });

    // 同一リポジトリに戻る
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    await act(async () => {
      document.dispatchEvent(new Event("turbo:load"));
    });

    // repositoryName が変更されたため再表示
    expect(screen.getByText("This repository is public")).toBeInTheDocument();
  });
});
