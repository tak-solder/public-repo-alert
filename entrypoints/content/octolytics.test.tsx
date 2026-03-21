import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { useContext, createContext } from "react";
import { getMetaOctolytics, OctolyticsProvider, useOctolytics } from "./octolytics";
import type { Octolytics } from "./octolytics";

// loadConfig をモック
vi.mock("@/utils/config", () => ({
  loadConfig: vi.fn(),
}));
import { loadConfig } from "@/utils/config";
const mockLoadConfig = vi.mocked(loadConfig);

// メタタグのセットアップヘルパー
function setMetaTags(tags: Record<string, string>) {
  // 既存の octolytics メタタグを削除
  document
    .querySelectorAll('meta[name*="octolytics-"]')
    .forEach((el) => el.remove());
  // 新しいメタタグを追加
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

// OctolyticsProvider のコンテキスト値を取得するヘルパー
function OctolyticsConsumer({
  onValue,
}: {
  onValue: (value: Octolytics) => void;
}) {
  const octolytics = useOctolytics();
  onValue(octolytics);
  return null;
}

describe("getMetaOctolytics", () => {
  afterEach(() => {
    clearMetaTags();
  });

  it("全メタタグが存在する場合に正しく取得できる", () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });

    const result = getMetaOctolytics();
    expect(result).toEqual({
      repositoryName: "owner/repo",
      repositoryIsPublic: true,
    });
  });

  it("repositoryIsPublic が false の場合", () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "false",
    });

    const result = getMetaOctolytics();
    expect(result).toEqual({
      repositoryName: "owner/repo",
      repositoryIsPublic: false,
    });
  });

  it("メタタグが一切存在しない場合は空オブジェクトを返す", () => {
    const result = getMetaOctolytics();
    expect(result).toEqual({});
  });

  it("repositoryName のみ存在する場合", () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
    });

    const result = getMetaOctolytics();
    expect(result).toEqual({ repositoryName: "owner/repo" });
    expect(result.repositoryIsPublic).toBeUndefined();
  });

  it("repositoryIsPublic のみ存在する場合", () => {
    setMetaTags({
      "octolytics-dimension-repository_public": "true",
    });

    const result = getMetaOctolytics();
    expect(result).toEqual({ repositoryIsPublic: true });
    expect(result.repositoryName).toBeUndefined();
  });

  it("octolytics 以外のメタタグが混在している場合", () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
    });
    const viewport = document.createElement("meta");
    viewport.setAttribute("name", "viewport");
    viewport.setAttribute("content", "width=device-width");
    document.head.appendChild(viewport);

    const result = getMetaOctolytics();
    expect(result).toEqual({ repositoryName: "owner/repo" });

    viewport.remove();
  });

  it("content 属性が空文字の場合", () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "",
    });

    const result = getMetaOctolytics();
    expect(result).toEqual({ repositoryName: "" });
  });
});

describe("OctolyticsProvider", () => {
  beforeEach(() => {
    mockLoadConfig.mockReset();
  });

  afterEach(() => {
    clearMetaTags();
    cleanup();
  });

  it("初期ロード時にメタタグから値を取得する", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    mockLoadConfig.mockResolvedValue({ ignoreRepositoryPatterns: [] });

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value).toEqual({
      repositoryName: "owner/repo",
      repositoryIsPublic: true,
      needShowAlert: true,
      isLoaded: true,
    });
  });

  it("turbo:load イベント発火時にメタタグを再取得する", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo-a",
      "octolytics-dimension-repository_public": "true",
    });
    mockLoadConfig.mockResolvedValue({ ignoreRepositoryPatterns: [] });

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.repositoryName).toBe("owner/repo-a");

    // メタタグを変更して turbo:load を発火
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo-b",
      "octolytics-dimension-repository_public": "true",
    });

    await act(async () => {
      document.dispatchEvent(new Event("turbo:load"));
    });

    expect(value!.repositoryName).toBe("owner/repo-b");
  });

  it("turbo:load イベントでプライベートリポジトリに遷移した場合", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    mockLoadConfig.mockResolvedValue({ ignoreRepositoryPatterns: [] });

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.needShowAlert).toBe(true);

    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/private-repo",
      "octolytics-dimension-repository_public": "false",
    });

    await act(async () => {
      document.dispatchEvent(new Event("turbo:load"));
    });

    expect(value!.needShowAlert).toBe(false);
  });

  it("turbo:load イベントでリポジトリ外ページに遷移した場合", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    mockLoadConfig.mockResolvedValue({ ignoreRepositoryPatterns: [] });

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    clearMetaTags();

    await act(async () => {
      document.dispatchEvent(new Event("turbo:load"));
    });

    expect(value!.repositoryName).toBeUndefined();
    expect(value!.repositoryIsPublic).toBeUndefined();
    expect(value!.needShowAlert).toBe(false);
  });

  it("アンマウント時に turbo:load リスナーが解除される", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    mockLoadConfig.mockResolvedValue({ ignoreRepositoryPatterns: [] });

    let value: Octolytics | undefined;
    const { unmount } = await act(async () => {
      return render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    unmount();

    // アンマウント後に turbo:load を発火してもエラーにならない
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/other",
      "octolytics-dimension-repository_public": "true",
    });

    expect(() => {
      document.dispatchEvent(new Event("turbo:load"));
    }).not.toThrow();
  });

  it("config 読み込み前は isLoaded が false", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    // Promise を未解決のまま保持
    mockLoadConfig.mockReturnValue(new Promise(() => {}));

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.isLoaded).toBe(false);
    expect(value!.needShowAlert).toBe(false);
  });

  it("config 読み込み後に isLoaded が true になる", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    mockLoadConfig.mockResolvedValue({ ignoreRepositoryPatterns: [] });

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.isLoaded).toBe(true);
  });

  it("パブリックリポジトリかつ除外パターンに該当しない場合 needShowAlert が true", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    mockLoadConfig.mockResolvedValue({
      ignoreRepositoryPatterns: ["other/.*"],
    });

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.needShowAlert).toBe(true);
  });

  it("パブリックリポジトリかつ除外パターンに該当する場合 needShowAlert が false", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    mockLoadConfig.mockResolvedValue({
      ignoreRepositoryPatterns: ["owner/repo"],
    });

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.needShowAlert).toBe(false);
  });

  it("除外パターンが大文字小文字を区別しない", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "Owner/Repo",
      "octolytics-dimension-repository_public": "true",
    });
    mockLoadConfig.mockResolvedValue({
      ignoreRepositoryPatterns: ["owner/repo"],
    });

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.needShowAlert).toBe(false);
  });

  it("プライベートリポジトリの場合 needShowAlert が false", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "false",
    });
    mockLoadConfig.mockResolvedValue({ ignoreRepositoryPatterns: [] });

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.needShowAlert).toBe(false);
  });

  it("repositoryIsPublic が未定義の場合 needShowAlert が false", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
    });
    mockLoadConfig.mockResolvedValue({ ignoreRepositoryPatterns: [] });

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.needShowAlert).toBe(false);
  });

  it("複数の除外パターンのいずれかに該当する場合 needShowAlert が false", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "org/lib",
      "octolytics-dimension-repository_public": "true",
    });
    mockLoadConfig.mockResolvedValue({
      ignoreRepositoryPatterns: ["owner/.*", "org/lib"],
    });

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.needShowAlert).toBe(false);
  });
});
