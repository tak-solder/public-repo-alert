import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";
import {isIgnored, addIgnorePattern, ignoreListItem} from "./storage";

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

describe("addIgnorePattern", () => {
  const mockGetValue = vi.fn();
  const mockSetValue = vi.fn();

  beforeEach(() => {
    mockGetValue.mockReset();
    mockSetValue.mockReset();
    vi.spyOn(ignoreListItem, "getValue").mockImplementation(mockGetValue);
    vi.spyOn(ignoreListItem, "setValue").mockImplementation(mockSetValue);
    mockSetValue.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("空の除外リストに owner/repo 形式のパターンを追加する", async () => {
    mockGetValue.mockResolvedValue([]);
    const result = await addIgnorePattern("owner/repo");
    expect(result).toBe(true);
    expect(mockSetValue).toHaveBeenCalledWith(["owner/repo"]);
  });

  it("空の除外リストに owner/* 形式のパターンを追加する", async () => {
    mockGetValue.mockResolvedValue([]);
    const result = await addIgnorePattern("owner/*");
    expect(result).toBe(true);
    expect(mockSetValue).toHaveBeenCalledWith(["owner/*"]);
  });

  it("既存のリストに新しいパターンを追記する", async () => {
    mockGetValue.mockResolvedValue(["alpha/repo"]);
    const result = await addIgnorePattern("beta/repo");
    expect(result).toBe(true);
    expect(mockSetValue).toHaveBeenCalledWith(["alpha/repo", "beta/repo"]);
  });

  it("完全一致のパターンが既に存在する場合は重複追加しない", async () => {
    mockGetValue.mockResolvedValue(["owner/repo"]);
    const result = await addIgnorePattern("owner/repo");
    expect(result).toBe(false);
    expect(mockSetValue).not.toHaveBeenCalled();
  });

  it("owner/* が既に存在する場合に同一ownerの owner/repo を追加しない", async () => {
    mockGetValue.mockResolvedValue(["owner/*"]);
    const result = await addIgnorePattern("owner/repo");
    expect(result).toBe(false);
    expect(mockSetValue).not.toHaveBeenCalled();
  });

  it("owner/repo が既に存在する場合でも owner/* は追加できる", async () => {
    mockGetValue.mockResolvedValue(["owner/repo"]);
    const result = await addIgnorePattern("owner/*");
    expect(result).toBe(true);
    expect(mockSetValue).toHaveBeenCalledWith(["owner/repo", "owner/*"]);
  });

  it("大文字小文字が異なる同一パターンは重複として扱われる", async () => {
    mockGetValue.mockResolvedValue(["Owner/Repo"]);
    const result = await addIgnorePattern("owner/repo");
    expect(result).toBe(false);
    expect(mockSetValue).not.toHaveBeenCalled();
  });

  it("異なるownerの同名リポジトリは重複にならない", async () => {
    mockGetValue.mockResolvedValue(["alpha/repo"]);
    const result = await addIgnorePattern("beta/repo");
    expect(result).toBe(true);
    expect(mockSetValue).toHaveBeenCalledWith(["alpha/repo", "beta/repo"]);
  });

  it("前後の空白をトリムして保存する", async () => {
    mockGetValue.mockResolvedValue([]);
    const result = await addIgnorePattern("  owner/repo  ");
    expect(result).toBe(true);
    expect(mockSetValue).toHaveBeenCalledWith(["owner/repo"]);
  });

  it("形式不正のパターンは追加しない", async () => {
    const result = await addIgnorePattern("owner");
    expect(result).toBe(false);
    expect(mockGetValue).not.toHaveBeenCalled();
    expect(mockSetValue).not.toHaveBeenCalled();
  });

  it("空白のみのパターンは追加しない", async () => {
    const result = await addIgnorePattern("   ");
    expect(result).toBe(false);
    expect(mockGetValue).not.toHaveBeenCalled();
    expect(mockSetValue).not.toHaveBeenCalled();
  });
});
