import { describe, it, expect, beforeEach } from "vitest";
import { confirmJoinDiscussion } from "./confirmJoinDiscussion";

function createComposer(): HTMLElement {
  const composer = document.createElement("div");
  composer.setAttribute("data-testid", "comment-composer");
  document.body.appendChild(composer);
  return composer;
}

describe("confirmJoinDiscussion", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("コンポーザー要素を非表示にして警告バナーを表示する", () => {
    const composer = createComposer();

    confirmJoinDiscussion(composer);

    expect(composer.style.display).toBe("none");
    const banner = composer.previousElementSibling as HTMLElement;
    expect(banner).not.toBeNull();
    expect(banner.querySelector("strong")?.textContent).toBe(
      "Are you sure you want to join in public discussion?",
    );
    expect(banner.querySelector("button")?.textContent).toBe("Got it.");
  });

  it("警告バナーのボタンをクリックするとフォームが復元される", () => {
    const composer = createComposer();
    confirmJoinDiscussion(composer);

    const banner = composer.previousElementSibling as HTMLElement;
    const button = banner.querySelector("button") as HTMLButtonElement;
    button.click();

    expect(composer.style.display).toBe("");
    expect(banner.parentElement).toBeNull();
  });

  it("同一要素に対して二重実行されない", () => {
    const composer = createComposer();

    confirmJoinDiscussion(composer);
    confirmJoinDiscussion(composer);

    const banners = document.querySelectorAll(".flash");
    expect(banners.length).toBe(1);
  });

  it("複数のコンポーザー要素に対してそれぞれ独立に動作する", () => {
    const composerA = createComposer();
    const composerB = createComposer();

    confirmJoinDiscussion(composerA);
    confirmJoinDiscussion(composerB);

    expect(composerA.style.display).toBe("none");
    expect(composerB.style.display).toBe("none");

    const bannerA = composerA.previousElementSibling as HTMLElement;
    bannerA.querySelector("button")!.click();

    expect(composerA.style.display).toBe("");
    expect(composerB.style.display).toBe("none");
    // composerBの警告バナーはまだ存在する
    expect(composerB.previousElementSibling).not.toBeNull();
  });

  it("HTMLElement（非form要素）を受け取れる", () => {
    const composer = document.createElement("div");
    composer.setAttribute("data-testid", "comment-composer");
    document.body.appendChild(composer);

    confirmJoinDiscussion(composer);

    expect(composer.style.display).toBe("none");
    expect(composer.previousElementSibling).not.toBeNull();
  });
});
