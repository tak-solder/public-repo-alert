export type Config = {
  ignoreRepositoryPatterns: string[];
};

export const loadConfig = async (): Promise<Config> => {
  const config = await chrome.storage.local.get('config')
  if (typeof config.config !== 'object') {
    return {
      ignoreRepositoryPatterns: [],
    }
  }

  return config.config;
}

export const saveConfig = async (config: Config): Promise<void> => {
  await chrome.storage.local.set({config});
}
