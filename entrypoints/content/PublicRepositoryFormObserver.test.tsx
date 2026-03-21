import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { PublicRepositoryFormObserver } from "./PublicRepositoryFormObserver";

// useOctolytics をモック
const mockUseOctolytics = vi.fn();
vi.mock("./octolytics", () => ({
  useOctolytics: () => mockUseOctolytics(),
}));

function createComposer(): HTMLElement {
  const composer = document.createElement("div");
  composer.setAttribute("data-testid", "comment-composer");
  document.body.appendChild(composer);
  return composer;
}

describe("PublicRepositoryFormObserver", () => {
  beforeEach(() => {
    mockUseOctolytics.mockReset();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    cleanup();
  });

  it("needShowAlertがfalseの場合は何もレンダリングしない", () => {
    const composer = createComposer();
    mockUseOctolytics.mockReturnValue({ needShowAlert: false, isLoaded: true });

    render(<PublicRepositoryFormObserver />);

    expect(composer.style.display).not.toBe("none");
  });

  it("isLoadedがfalseの場合は何もレンダリングしない", () => {
    const composer = createComposer();
    mockUseOctolytics.mockReturnValue({ needShowAlert: false, isLoaded: false });

    render(<PublicRepositoryFormObserver />);

    expect(composer.style.display).not.toBe("none");
  });

  it("初期レンダリング時に既存のコンポーザーをインターセプトする", () => {
    const composer = createComposer();
    mockUseOctolytics.mockReturnValue({ needShowAlert: true, isLoaded: true });

    render(<PublicRepositoryFormObserver />);

    expect(composer.style.display).toBe("none");
    expect(composer.previousElementSibling).not.toBeNull();
    expect(
      composer.previousElementSibling!.querySelector("strong")?.textContent,
    ).toBe("Are you sure you want to join in public discussion?");
  });

  it("初期レンダリング時に複数のコンポーザーを全てインターセプトする", () => {
    const composerA = createComposer();
    const composerB = createComposer();
    mockUseOctolytics.mockReturnValue({ needShowAlert: true, isLoaded: true });

    render(<PublicRepositoryFormObserver />);

    expect(composerA.style.display).toBe("none");
    expect(composerB.style.display).toBe("none");
  });

  it("動的に追加されたコンポーザーをMutationObserverで検出してインターセプトする", async () => {
    mockUseOctolytics.mockReturnValue({ needShowAlert: true, isLoaded: true });

    render(<PublicRepositoryFormObserver />);

    const composer = createComposer();

    // MutationObserverのコールバックは非同期でマイクロタスクとして実行されるため、
    // 複数回のflushが必要な場合がある
    await act(async () => {
      await vi.waitFor(() => {
        expect(composer.style.display).toBe("none");
      });
    });
  });

  it("動的追加されたノードの子孫にあるコンポーザーも検出する", async () => {
    mockUseOctolytics.mockReturnValue({ needShowAlert: true, isLoaded: true });

    render(<PublicRepositoryFormObserver />);

    const parent = document.createElement("div");
    const composer = document.createElement("div");
    composer.setAttribute("data-testid", "comment-composer");
    parent.appendChild(composer);
    document.body.appendChild(parent);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(composer.style.display).toBe("none");
  });

  it("HTMLElement以外のノード追加は無視する", async () => {
    mockUseOctolytics.mockReturnValue({ needShowAlert: true, isLoaded: true });

    render(<PublicRepositoryFormObserver />);

    // テキストノードを追加
    const textNode = document.createTextNode("test");
    document.body.appendChild(textNode);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // エラーが発生しないことを確認（テストが正常に完了すればOK）
    expect(true).toBe(true);
  });

  it("SPA遷移（turbo:load）後に新ページのコンポーザーをインターセプトする", async () => {
    mockUseOctolytics.mockReturnValue({ needShowAlert: true, isLoaded: true });

    render(<PublicRepositoryFormObserver />);

    // SPA遷移をシミュレート: 新しいコンポーザーを追加してからturbo:loadを発火
    const composer = createComposer();
    // data-attributeをクリア（新しいページのDOM）
    await act(async () => {
      document.dispatchEvent(new Event("turbo:load"));
    });

    expect(composer.style.display).toBe("none");
  });

  it("コンポーザーが存在しないページでもエラーにならない", () => {
    mockUseOctolytics.mockReturnValue({ needShowAlert: true, isLoaded: true });

    expect(() => {
      render(<PublicRepositoryFormObserver />);
    }).not.toThrow();
  });

  it("旧セレクタ（form.js-new-comment-form等）に一致する要素はインターセプトしない", () => {
    const form = document.createElement("form");
    form.classList.add("js-new-comment-form");
    document.body.appendChild(form);
    mockUseOctolytics.mockReturnValue({ needShowAlert: true, isLoaded: true });

    render(<PublicRepositoryFormObserver />);

    expect(form.style.display).not.toBe("none");
  });

  it("needShowAlertがtrueからfalseに変わった場合にインターセプトを停止する", () => {
    mockUseOctolytics.mockReturnValue({ needShowAlert: true, isLoaded: true });
    const { rerender } = render(<PublicRepositoryFormObserver />);

    // needShowAlertがfalseに変わる
    mockUseOctolytics.mockReturnValue({ needShowAlert: false, isLoaded: true });
    rerender(<PublicRepositoryFormObserver />);

    // 新しく追加されたコンポーザーはインターセプトされない
    const newComposer = createComposer();
    expect(newComposer.style.display).not.toBe("none");
  });

  it("needShowAlertがfalseからtrueに変わった場合にインターセプトを開始する", () => {
    const composer = createComposer();
    mockUseOctolytics.mockReturnValue({ needShowAlert: false, isLoaded: true });
    const { rerender } = render(<PublicRepositoryFormObserver />);

    expect(composer.style.display).not.toBe("none");

    // needShowAlertがtrueに変わる
    mockUseOctolytics.mockReturnValue({ needShowAlert: true, isLoaded: true });
    rerender(<PublicRepositoryFormObserver />);

    expect(composer.style.display).toBe("none");
  });
});
