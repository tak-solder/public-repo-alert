import { describe, it, expect, afterEach } from "vitest";
import { render, act, cleanup, waitFor } from "@testing-library/react";
import { fakeBrowser } from "wxt/testing";
import { ignoreListItem, showAlertItem, protectFormItem } from "@/utils/storage";
import { OctolyticsProvider, useOctolytics } from "@/entrypoints/content/octolytics";
import type { Octolytics } from "@/entrypoints/content/octolytics";

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

async function renderAndWaitForLoad(onValue: (value: Octolytics) => void) {
  let value: Octolytics | undefined;
  await act(async () => {
    render(
      <OctolyticsProvider>
        <OctolyticsConsumer onValue={(v) => { value = v; onValue(v); }} />
      </OctolyticsProvider>,
    );
  });
  await waitFor(() => {
    expect(value).toBeDefined();
    expect(value!.isLoaded).toBe(true);
  });
}

describe("統合テスト: 設定画面 → content script 反映", () => {
  afterEach(() => {
    clearMetaTags();
    cleanup();
    fakeBrowser.reset();
  });

  it("保存した除外リスト（完全一致）がOctolyticsProviderで反映される", async () => {
    await ignoreListItem.setValue(["owner/repo"]);

    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });

    let result: Octolytics | undefined;
    await renderAndWaitForLoad((v) => { result = v; });

    expect(result!.isLoaded).toBe(true);
    expect(result!.showAlert).toBe(false);
    expect(result!.protectForm).toBe(false);
  });

  it("除外リストが空の場合はアラートが表示される", async () => {
    await ignoreListItem.setValue([]);

    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });

    let result: Octolytics | undefined;
    await renderAndWaitForLoad((v) => { result = v; });

    expect(result!.isLoaded).toBe(true);
    expect(result!.showAlert).toBe(true);
    expect(result!.protectForm).toBe(true);
  });

  it("owner/*ワイルドカードパターンがOctolyticsProviderで正しく評価される", async () => {
    await ignoreListItem.setValue(["owner/*"]);

    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/any-repo",
      "octolytics-dimension-repository_public": "true",
    });

    let result: Octolytics | undefined;
    await renderAndWaitForLoad((v) => { result = v; });

    expect(result!.isLoaded).toBe(true);
    expect(result!.showAlert).toBe(false);
    expect(result!.protectForm).toBe(false);
  });

  it("除外リストに該当しないリポジトリではアラートが表示される", async () => {
    await ignoreListItem.setValue(["owner/repo"]);

    setMetaTags({
      "octolytics-dimension-repository_nwo": "other/repo",
      "octolytics-dimension-repository_public": "true",
    });

    let result: Octolytics | undefined;
    await renderAndWaitForLoad((v) => { result = v; });

    expect(result!.isLoaded).toBe(true);
    expect(result!.showAlert).toBe(true);
    expect(result!.protectForm).toBe(true);
  });

  it("storage.watch()でignoreListの変更がリアルタイムに反映される", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });

    let result: Octolytics | undefined;
    await renderAndWaitForLoad((v) => { result = v; });

    expect(result!.showAlert).toBe(true);
    expect(result!.protectForm).toBe(true);

    await act(async () => {
      await ignoreListItem.setValue(["owner/repo"]);
    });

    await waitFor(() => {
      expect(result!.showAlert).toBe(false);
      expect(result!.protectForm).toBe(false);
    });
  });

  it("storage.watch()でshowAlertItemの変更がリアルタイムに反映される", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });

    let result: Octolytics | undefined;
    await renderAndWaitForLoad((v) => { result = v; });

    expect(result!.showAlert).toBe(true);

    await act(async () => {
      await showAlertItem.setValue(false);
    });

    await waitFor(() => {
      expect(result!.showAlert).toBe(false);
      expect(result!.protectForm).toBe(true);
    });
  });

  it("storage.watch()でprotectFormItemの変更がリアルタイムに反映される", async () => {
    setMetaTags({
      "octolytics-dimension-repository_nwo": "owner/repo",
      "octolytics-dimension-repository_public": "true",
    });

    let result: Octolytics | undefined;
    await renderAndWaitForLoad((v) => { result = v; });

    expect(result!.protectForm).toBe(true);

    await act(async () => {
      await protectFormItem.setValue(false);
    });

    await waitFor(() => {
      expect(result!.protectForm).toBe(false);
      expect(result!.showAlert).toBe(true);
    });
  });
});
