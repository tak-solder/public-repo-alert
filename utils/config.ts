export type Config = {
  ignoreRepositoryPatterns: string[];
};

export const loadConfig = async (): Promise<Config> => {
  const {config} = await chrome.storage.local.get();
  if (typeof config !== 'object') {
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
