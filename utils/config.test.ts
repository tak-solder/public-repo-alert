import { describe, expect, it, beforeEach } from "vitest";
import { fakeBrowser } from "wxt/testing";
import { loadConfig, saveConfig } from "./config";

describe("config", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  describe("loadConfig", () => {
    it("ストレージが空の場合にデフォルト値を返す", async () => {
      const config = await loadConfig();
      expect(config).toEqual({ ignoreRepositoryPatterns: [] });
    });

    it("ストレージに正常な設定が保存されている場合", async () => {
      await chrome.storage.local.set({
        config: { ignoreRepositoryPatterns: ["org/repo", "org/*"] },
      });
      const config = await loadConfig();
      expect(config).toEqual({
        ignoreRepositoryPatterns: ["org/repo", "org/*"],
      });
    });

    it("ストレージの値がオブジェクトでない場合にデフォルト値を返す", async () => {
      await chrome.storage.local.set({ config: "invalid-string" });
      const config = await loadConfig();
      expect(config).toEqual({ ignoreRepositoryPatterns: [] });
    });

    it("ストレージの値がnullの場合にデフォルト値を返す", async () => {
      await chrome.storage.local.set({ config: null });
      const config = await loadConfig();
      expect(config).toEqual({ ignoreRepositoryPatterns: [] });
    });

    it("ignoreRepositoryPatternsが未定義のオブジェクトの場合", async () => {
      await chrome.storage.local.set({ config: {} });
      const config = await loadConfig();
      expect(config).toEqual({ ignoreRepositoryPatterns: [] });
    });

    it("ignoreRepositoryPatternsが空配列の場合", async () => {
      await chrome.storage.local.set({
        config: { ignoreRepositoryPatterns: [] },
      });
      const config = await loadConfig();
      expect(config).toEqual({ ignoreRepositoryPatterns: [] });
    });
  });

  describe("saveConfig", () => {
    it("設定を保存できる", async () => {
      await saveConfig({ ignoreRepositoryPatterns: ["org/repo"] });
      const result = await chrome.storage.local.get("config");
      expect(result.config).toEqual({
        ignoreRepositoryPatterns: ["org/repo"],
      });
    });

    it("既存の設定を上書きできる", async () => {
      await chrome.storage.local.set({
        config: { ignoreRepositoryPatterns: ["old/repo"] },
      });
      await saveConfig({ ignoreRepositoryPatterns: ["new/repo"] });
      const result = await chrome.storage.local.get("config");
      expect(result.config).toEqual({
        ignoreRepositoryPatterns: ["new/repo"],
      });
    });

    it("空の配列で設定を保存できる", async () => {
      await chrome.storage.local.set({
        config: { ignoreRepositoryPatterns: ["org/repo"] },
      });
      await saveConfig({ ignoreRepositoryPatterns: [] });
      const result = await chrome.storage.local.get("config");
      expect(result.config).toEqual({ ignoreRepositoryPatterns: [] });
    });
  });

  describe("結合テスト", () => {
    it("保存した設定を再読み込みできる", async () => {
      await saveConfig({
        ignoreRepositoryPatterns: ["org/repo", "org2/*"],
      });
      const config = await loadConfig();
      expect(config).toEqual({
        ignoreRepositoryPatterns: ["org/repo", "org2/*"],
      });
    });
  });
});
