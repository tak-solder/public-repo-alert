import {createContext, FC, ReactNode, useContext, useEffect, useMemo, useState} from "react";
import {Config, loadConfig} from "@/utils/config";

export type Octolytics = MetaOctolytics &{
  needShowAlert: boolean;
  isLoaded: boolean;
};

type MetaOctolytics = {
  repositoryName?: string;
  repositoryIsPublic?: boolean;
};

const octolyticsKeyToMetaName: Record<keyof MetaOctolytics, string> = {
  repositoryName: 'octolytics-dimension-repository_nwo',
  repositoryIsPublic: 'octolytics-dimension-repository_public',
} as const;

export const getMetaOctolytics = () => {
  const octolyticsTags = Array.from(document.querySelectorAll('meta[name*=octolytics-]'));
  const octolyticsMap = new Map(octolyticsTags.map(octolytics => [octolytics.getAttribute('name'), octolytics.getAttribute('content')]));

  const octolytics: MetaOctolytics = {};
  if (octolyticsMap.has(octolyticsKeyToMetaName.repositoryName)) {
    octolytics.repositoryName = octolyticsMap.get(octolyticsKeyToMetaName.repositoryName) as string;
  }
  if (octolyticsMap.has(octolyticsKeyToMetaName.repositoryIsPublic)) {
    octolytics.repositoryIsPublic = octolyticsMap.get(octolyticsKeyToMetaName.repositoryIsPublic) === 'true';
  }

  return octolytics;
}

const OctolyticsContext = createContext<Octolytics>({
  needShowAlert: false,
  isLoaded: false,
});

type Props = {
  children: ReactNode;
}

export const OctolyticsProvider: FC<Props> = ({children}) => {
  const [metaOctorytics, setMetaOctolytics] = useState<MetaOctolytics>(getMetaOctolytics);
  const [config, setConfig] = useState<Config|undefined>();
  const ignoreRepositoryRegExp: RegExp[]|undefined = useMemo(() => {
    if (!config) {
      return undefined;
    }

    return config.ignoreRepositoryPatterns.map(pattern => new RegExp(pattern, 'i'));
  }, [config]);

  useEffect(() => {
    (async () => {
      setConfig(await loadConfig())
    })()
  }, []);

  // Turbo SPA遷移時にメタタグを再取得する
  useEffect(() => {
    const handleTurboLoad = () => {
      setMetaOctolytics(getMetaOctolytics());
    };
    document.addEventListener('turbo:load', handleTurboLoad);
    return () => {
      document.removeEventListener('turbo:load', handleTurboLoad);
    };
  }, []);

  const octolytics: Octolytics = useMemo<Octolytics>(() => {
    const isLoaded = ignoreRepositoryRegExp !== undefined;
    let needShowAlert = false;
    if (isLoaded && metaOctorytics.repositoryIsPublic) {
      needShowAlert = !ignoreRepositoryRegExp!.find(regexp => {
        return regexp.test(metaOctorytics.repositoryName!)
      })
    }
    return {
      ...metaOctorytics,
      needShowAlert,
      isLoaded,
    };
  }, [metaOctorytics, ignoreRepositoryRegExp]);

  return <OctolyticsContext.Provider value={octolytics}>
    {children}
  </OctolyticsContext.Provider>;
}

export const useOctolytics: () => Octolytics = () => {
  return useContext(OctolyticsContext);
};
