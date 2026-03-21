export type Config = {
  ignoreRepositoryPatterns: string[];
};

export const loadConfig = async (): Promise<Config> => {
  const result = await chrome.storage.local.get('config');
  const config = result.config as Config | undefined;
  if (!config || typeof config !== 'object') {
    return {
      ignoreRepositoryPatterns: [],
    }
  }

  return {
    ignoreRepositoryPatterns: config.ignoreRepositoryPatterns || [],
  };
}

export const saveConfig = async (config: Config): Promise<void> => {
  await chrome.storage.local.set({config});
}
