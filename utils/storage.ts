import {storage} from "wxt/utils/storage";

/** ストレージに保存される設定の型 */
export type StorageState = {
  showAlert: boolean;
  protectForm: boolean;
  ignoreList: string[];
};

/** アラート表示のON/OFF */
export const showAlertItem = storage.defineItem<boolean>("local:showAlert", {
  fallback: true,
});

/** フォーム保護のON/OFF */
export const protectFormItem = storage.defineItem<boolean>("local:protectForm", {
  fallback: true,
});

/** 除外リスト（`owner/repo` または `owner/*` 形式） */
export const ignoreListItem = storage.defineItem<string[]>("local:ignoreList", {
  fallback: [],
});

/** 除外判定（完全一致 + owner/*ワイルドカード、大文字小文字を区別しない） */
export const isIgnored = (repositoryName: string, ignoreList: string[]): boolean => {
  const repoLower = repositoryName.toLowerCase();
  return ignoreList.some(pattern => {
    const patternLower = pattern.toLowerCase();
    if (patternLower.endsWith("/*")) {
      const owner = patternLower.slice(0, -2);
      return repoLower.startsWith(owner + "/");
    }
    return repoLower === patternLower;
  });
};
