import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { getMetaOctolytics, OctolyticsProvider, useOctolytics } from "./octolytics";
import type { Octolytics } from "./octolytics";

// storage をモック
const mockShowAlertGetValue = vi.fn();
const mockProtectFormGetValue = vi.fn();
const mockIgnoreListGetValue = vi.fn();
const mockShowAlertWatch = vi.fn();
const mockProtectFormWatch = vi.fn();
const mockIgnoreListWatch = vi.fn();

vi.mock("@/utils/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/utils/storage")>();
  return {
    showAlertItem: {
      getValue: () => mockShowAlertGetValue(),
      watch: (cb: unknown) => mockShowAlertWatch(cb),
    },
    protectFormItem: {
      getValue: () => mockProtectFormGetValue(),
      watch: (cb: unknown) => mockProtectFormWatch(cb),
    },
    ignoreListItem: {
      getValue: () => mockIgnoreListGetValue(),
      watch: (cb: unknown) => mockIgnoreListWatch(cb),
    },
    isIgnored: actual.isIgnored,
  };
});

// メタタグのセットアップヘルパー
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

function setupDefaultStorage() {
  mockShowAlertGetValue.mockResolvedValue(true);
  mockProtectFormGetValue.mockResolvedValue(true);
  mockIgnoreListGetValue.mockResolvedValue([]);
  mockShowAlertWatch.mockReturnValue(() => {});
  mockProtectFormWatch.mockReturnValue(() => {});
  mockIgnoreListWatch.mockReturnValue(() => {});
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
    mockShowAlertGetValue.mockReset();
    mockProtectFormGetValue.mockReset();
    mockIgnoreListGetValue.mockReset();
    mockShowAlertWatch.mockReset();
    mockProtectFormWatch.mockReset();
    mockIgnoreListWatch.mockReset();
  });

  afterEach(() => {
    clearMetaTags();
    cleanup();
  });

  it("初期ロード時にメタタグとstorage値を読み込む", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    setupDefaultStorage();

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
      showAlert: true,
      protectForm: true,
      isLoaded: true,
    });
  });

  it("turbo:load イベント発火時にメタタグを再取得する", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo-a",
      "octolytics-dimension-repository_public": "true",
    });
    setupDefaultStorage();

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.repositoryName).toBe("owner/repo-a");

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
    setupDefaultStorage();

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.showAlert).toBe(true);
    expect(value!.protectForm).toBe(true);

    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/private-repo",
      "octolytics-dimension-repository_public": "false",
    });

    await act(async () => {
      document.dispatchEvent(new Event("turbo:load"));
    });

    expect(value!.showAlert).toBe(false);
    expect(value!.protectForm).toBe(false);
  });

  it("turbo:load イベントでリポジトリ外ページに遷移した場合", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    setupDefaultStorage();

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
    expect(value!.showAlert).toBe(false);
    expect(value!.protectForm).toBe(false);
  });

  it("アンマウント時に turbo:load リスナーが解除される", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    setupDefaultStorage();

    const { unmount } = await act(async () => {
      return render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={() => {}} />
        </OctolyticsProvider>,
      );
    });

    unmount();

    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/other",
      "octolytics-dimension-repository_public": "true",
    });

    expect(() => {
      document.dispatchEvent(new Event("turbo:load"));
    }).not.toThrow();
  });

  it("storage 読み込み前は isLoaded が false", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    // getValue()を未解決のまま保持（watch登録はgetValue()完了後のため呼ばれない）
    mockShowAlertGetValue.mockReturnValue(new Promise(() => {}));
    mockProtectFormGetValue.mockReturnValue(new Promise(() => {}));
    mockIgnoreListGetValue.mockReturnValue(new Promise(() => {}));

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.isLoaded).toBe(false);
    expect(value!.showAlert).toBe(false);
    expect(value!.protectForm).toBe(false);
  });

  it("getValue()解決前にアンマウントした場合 watch が登録されない", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    // getValue()を未解決のまま保持
    let resolveGetValue!: (value: boolean) => void;
    mockShowAlertGetValue.mockReturnValue(new Promise((resolve) => { resolveGetValue = resolve; }));
    mockProtectFormGetValue.mockReturnValue(new Promise(() => {}));
    mockIgnoreListGetValue.mockReturnValue(new Promise(() => {}));

    const { unmount } = await act(async () => {
      return render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={() => {}} />
        </OctolyticsProvider>,
      );
    });

    // getValue()解決前にアンマウント
    unmount();

    // Promise解決後も cancelled=true のため watch が登録されない
    await act(async () => {
      resolveGetValue(true);
    });

    expect(mockShowAlertWatch).not.toHaveBeenCalled();
    expect(mockProtectFormWatch).not.toHaveBeenCalled();
    expect(mockIgnoreListWatch).not.toHaveBeenCalled();
  });

  it("storage 読み込み後に isLoaded が true になる", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    setupDefaultStorage();

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

  it("パブリックリポジトリかつ除外リストに該当しない場合 showAlert/protectForm が true", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    setupDefaultStorage();
    mockIgnoreListGetValue.mockResolvedValue(["other/repo"]);

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.showAlert).toBe(true);
    expect(value!.protectForm).toBe(true);
  });

  it("パブリックリポジトリかつ除外リストに完全一致する場合 showAlert/protectForm が false", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    setupDefaultStorage();
    mockIgnoreListGetValue.mockResolvedValue(["owner/repo"]);

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.showAlert).toBe(false);
    expect(value!.protectForm).toBe(false);
  });

  it("除外判定が大文字小文字を区別しない", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "Owner/Repo",
      "octolytics-dimension-repository_public": "true",
    });
    setupDefaultStorage();
    mockIgnoreListGetValue.mockResolvedValue(["owner/repo"]);

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.showAlert).toBe(false);
    expect(value!.protectForm).toBe(false);
  });

  it("プライベートリポジトリの場合 showAlert/protectForm が false", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "false",
    });
    setupDefaultStorage();

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.showAlert).toBe(false);
    expect(value!.protectForm).toBe(false);
  });

  it("repositoryIsPublic が未定義の場合 showAlert/protectForm が false", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
    });
    setupDefaultStorage();

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.showAlert).toBe(false);
    expect(value!.protectForm).toBe(false);
  });

  it("複数の除外パターンのいずれかに該当する場合 showAlert/protectForm が false", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "org/lib",
      "octolytics-dimension-repository_public": "true",
    });
    setupDefaultStorage();
    mockIgnoreListGetValue.mockResolvedValue(["owner/repo", "org/*"]);

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.showAlert).toBe(false);
    expect(value!.protectForm).toBe(false);
  });

  it("showAlertItem が false の場合 showAlert のみ false", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    setupDefaultStorage();
    mockShowAlertGetValue.mockResolvedValue(false);

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.showAlert).toBe(false);
    expect(value!.protectForm).toBe(true);
  });

  it("protectFormItem が false の場合 protectForm のみ false", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    setupDefaultStorage();
    mockProtectFormGetValue.mockResolvedValue(false);

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.showAlert).toBe(true);
    expect(value!.protectForm).toBe(false);
  });

  it("storage.watch() で showAlertItem の変更が即時反映される", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    setupDefaultStorage();

    let showAlertWatchCallback: ((newValue: boolean) => void) | undefined;
    mockShowAlertWatch.mockImplementation((cb: (newValue: boolean) => void) => {
      showAlertWatchCallback = cb;
      return () => {};
    });

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.showAlert).toBe(true);

    await act(async () => {
      showAlertWatchCallback!(false);
    });

    expect(value!.showAlert).toBe(false);
    expect(value!.protectForm).toBe(true);
  });

  it("storage.watch() で protectFormItem の変更が即時反映される", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    setupDefaultStorage();

    let protectFormWatchCallback: ((newValue: boolean) => void) | undefined;
    mockProtectFormWatch.mockImplementation((cb: (newValue: boolean) => void) => {
      protectFormWatchCallback = cb;
      return () => {};
    });

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.protectForm).toBe(true);

    await act(async () => {
      protectFormWatchCallback!(false);
    });

    expect(value!.protectForm).toBe(false);
    expect(value!.showAlert).toBe(true);
  });

  it("storage.watch() で ignoreListItem の変更が即時反映される", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    setupDefaultStorage();

    let ignoreListWatchCallback: ((newValue: string[]) => void) | undefined;
    mockIgnoreListWatch.mockImplementation((cb: (newValue: string[]) => void) => {
      ignoreListWatchCallback = cb;
      return () => {};
    });

    let value: Octolytics | undefined;
    await act(async () => {
      render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={(v) => (value = v)} />
        </OctolyticsProvider>,
      );
    });

    expect(value!.showAlert).toBe(true);
    expect(value!.protectForm).toBe(true);

    await act(async () => {
      ignoreListWatchCallback!(["owner/repo"]);
    });

    expect(value!.showAlert).toBe(false);
    expect(value!.protectForm).toBe(false);
  });

  it("アンマウント時に storage.watch() が解除される", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    setupDefaultStorage();

    const unwatchShowAlert = vi.fn();
    const unwatchProtectForm = vi.fn();
    const unwatchIgnoreList = vi.fn();
    mockShowAlertWatch.mockReturnValue(unwatchShowAlert);
    mockProtectFormWatch.mockReturnValue(unwatchProtectForm);
    mockIgnoreListWatch.mockReturnValue(unwatchIgnoreList);

    const { unmount } = await act(async () => {
      return render(
        <OctolyticsProvider>
          <OctolyticsConsumer onValue={() => {}} />
        </OctolyticsProvider>,
      );
    });

    unmount();

    expect(unwatchShowAlert).toHaveBeenCalled();
    expect(unwatchProtectForm).toHaveBeenCalled();
    expect(unwatchIgnoreList).toHaveBeenCalled();
  });
});
