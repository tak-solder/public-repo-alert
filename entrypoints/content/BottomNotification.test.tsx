import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup, fireEvent } from "@testing-library/react";
import { BottomNotification } from "./BottomNotification";
import { OctolyticsProvider } from "./octolytics";

// storage をモック
const mockShowAlertGetValue = vi.fn();
const mockProtectFormGetValue = vi.fn();
const mockIgnoreListGetValue = vi.fn();
const mockShowAlertWatch = vi.fn();
const mockProtectFormWatch = vi.fn();
const mockIgnoreListWatch = vi.fn();
const mockAddIgnorePattern = vi.fn();

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
    addIgnorePattern: (...args: unknown[]) => mockAddIgnorePattern(...args),
  };
});

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

function setupDefaultStorage() {
  mockShowAlertGetValue.mockResolvedValue(true);
  mockProtectFormGetValue.mockResolvedValue(true);
  mockIgnoreListGetValue.mockResolvedValue([]);
  mockAddIgnorePattern.mockResolvedValue(true);
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
    mockShowAlertGetValue.mockReset();
    mockProtectFormGetValue.mockReset();
    mockIgnoreListGetValue.mockReset();
    mockShowAlertWatch.mockReset();
    mockProtectFormWatch.mockReset();
    mockIgnoreListWatch.mockReset();
    mockAddIgnorePattern.mockReset();
    mockShowAlertWatch.mockReturnValue(() => {});
    mockProtectFormWatch.mockReturnValue(() => {});
    mockIgnoreListWatch.mockReturnValue(() => {});
  });

  afterEach(() => {
    clearMetaTags();
    cleanup();
  });

  it("showAlert が true の場合に通知が表示される", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    setupDefaultStorage();

    await act(async () => {
      renderWithProvider();
    });

    expect(screen.getByText("This repository is public")).toBeInTheDocument();
  });

  it("showAlert が false の場合に通知が表示されない", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "false",
    });
    setupDefaultStorage();

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
    mockShowAlertGetValue.mockReturnValue(new Promise(() => {}));
    mockProtectFormGetValue.mockReturnValue(new Promise(() => {}));
    mockIgnoreListGetValue.mockReturnValue(new Promise(() => {}));

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
    setupDefaultStorage();

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
    setupDefaultStorage();

    await act(async () => {
      renderWithProvider();
    });

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Close"));
    });

    expect(
      screen.queryByText("This repository is public"),
    ).not.toBeInTheDocument();

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
    setupDefaultStorage();

    await act(async () => {
      renderWithProvider();
    });

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Close"));
    });

    expect(
      screen.queryByText("This repository is public"),
    ).not.toBeInTheDocument();

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
    setupDefaultStorage();

    await act(async () => {
      renderWithProvider();
    });

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Close"));
    });

    clearMetaTags();
    await act(async () => {
      document.dispatchEvent(new Event("turbo:load"));
    });

    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    await act(async () => {
      document.dispatchEvent(new Event("turbo:load"));
    });

    expect(screen.getByText("This repository is public")).toBeInTheDocument();
  });

  it("アラートバー内に IgnoreMenu が表示される", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    setupDefaultStorage();

    await act(async () => {
      renderWithProvider();
    });

    expect(screen.getByLabelText("Ignore options")).toBeInTheDocument();
  });

  it("IgnoreMenu に正しい repositoryName が渡される", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "my-org/my-repo",
      "octolytics-dimension-repository_public": "true",
    });
    setupDefaultStorage();

    await act(async () => {
      renderWithProvider();
    });

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Ignore options"));
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Ignore this repository"));
    });

    expect(mockAddIgnorePattern).toHaveBeenCalledWith("my-org/my-repo");
  });

  it("除外登録後にアラートが即座に非表示になる（owner/repo）", async () => {
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

    await act(async () => {
      renderWithProvider();
    });

    expect(screen.getByText("This repository is public")).toBeInTheDocument();

    await act(async () => {
      ignoreListWatchCallback!(["owner/repo"]);
    });

    expect(screen.queryByText("This repository is public")).not.toBeInTheDocument();
  });

  it("除外登録後にアラートが即座に非表示になる（owner/*）", async () => {
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

    await act(async () => {
      renderWithProvider();
    });

    expect(screen.getByText("This repository is public")).toBeInTheDocument();

    await act(async () => {
      ignoreListWatchCallback!(["owner/*"]);
    });

    expect(screen.queryByText("This repository is public")).not.toBeInTheDocument();
  });

  it("protectForm が false でも showAlert が true なら通知が表示される", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });
    mockShowAlertGetValue.mockResolvedValue(true);
    mockProtectFormGetValue.mockResolvedValue(false);
    mockIgnoreListGetValue.mockResolvedValue([]);

    await act(async () => {
      renderWithProvider();
    });

    expect(screen.getByText("This repository is public")).toBeInTheDocument();
  });
});
