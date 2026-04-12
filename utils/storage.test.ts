import {describe, it, expect} from "vitest";
import {isIgnored} from "./storage";

describe("isIgnored", () => {
  it("完全一致でマッチする場合", () => {
    expect(isIgnored("owner/repo", ["owner/repo"])).toBe(true);
  });

  it("完全一致でマッチしない場合", () => {
    expect(isIgnored("owner/other", ["owner/repo"])).toBe(false);
  });

  it("owner/*ワイルドカードでマッチする場合", () => {
    expect(isIgnored("owner/any-repo", ["owner/*"])).toBe(true);
  });

  it("owner/*ワイルドカードでownerが異なる場合", () => {
    expect(isIgnored("other/repo", ["owner/*"])).toBe(false);
  });

  it("大文字小文字を区別しない（完全一致）", () => {
    expect(isIgnored("Owner/Repo", ["owner/repo"])).toBe(true);
  });

  it("大文字小文字を区別しない（ワイルドカード）", () => {
    expect(isIgnored("owner/repo", ["Owner/*"])).toBe(true);
  });

  it("複数パターンのいずれかにマッチする場合", () => {
    expect(isIgnored("beta/any", ["alpha/repo", "beta/*"])).toBe(true);
  });

  it("複数パターンのいずれにもマッチしない場合", () => {
    expect(isIgnored("gamma/repo", ["alpha/repo", "beta/*"])).toBe(false);
  });

  it("空のignoreListの場合", () => {
    expect(isIgnored("owner/repo", [])).toBe(false);
  });

  it("owner/*がowner自身にはマッチしない", () => {
    expect(isIgnored("owner", ["owner/*"])).toBe(false);
  });

  it("owner/*がowner-extended/repoにはマッチしない", () => {
    expect(isIgnored("owner-extended/repo", ["owner/*"])).toBe(false);
  });

  it("部分一致ではマッチしない", () => {
    expect(isIgnored("owner/repo-extended", ["owner/repo"])).toBe(false);
  });
});
