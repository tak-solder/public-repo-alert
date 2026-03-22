import { describe, it, expect, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { fakeBrowser } from "wxt/testing";
import { saveConfig } from "@/utils/config";
import { OctolyticsProvider, useOctolytics } from "@/entrypoints/content/octolytics";
import type { Octolytics } from "@/entrypoints/content/octolytics";

// loadConfig をモックしない — 実際の chrome.storage.local（fakeBrowser）を経由する

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

function OctolyticsConsumer({
  onValue,
}: {
  onValue: (value: Octolytics) => void;
}) {
  const octolytics = useOctolytics();
  onValue(octolytics);
  return null;
}

describe("統合テスト: 設定画面 → content script 反映", () => {
  afterEach(() => {
    clearMetaTags();
    cleanup();
    fakeBrowser.reset();
  });

  it("設定画面で保存した除外パターンがOctolyticsProviderで反映される", async () => {
    // 設定画面で保存（fakeBrowser 経由で chrome.storage.local に書き込み）
    await saveConfig({ ignoreRepositoryPatterns: ["owner/repo"] });

    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
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

  it("設定画面で除外パターンを空にした場合はアラートが表示される", async () => {
    await saveConfig({ ignoreRepositoryPatterns: [] });

    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
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

  it("設定画面で保存した正規表現パターンがOctolyticsProviderで正しく評価される", async () => {
    await saveConfig({ ignoreRepositoryPatterns: ["^owner/"] });

    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/any-repo",
      "octolytics-dimension-repository_public": "true",
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

  it("設定画面で保存したパターンに該当しないリポジトリではアラートが表示される", async () => {
    await saveConfig({ ignoreRepositoryPatterns: ["owner/repo"] });

    setMetaTags({
      "octolytics-dimension-repository_nwo": "other/repo",
      "octolytics-dimension-repository_public": "true",
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
});
