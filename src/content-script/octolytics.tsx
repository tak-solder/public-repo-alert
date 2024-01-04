import {createContext, FC, ReactNode, useContext, useEffect, useMemo, useState} from "react";
import {useMutationObserver} from "ahooks";
import {Config, loadConfig} from "../contig/config.ts";

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

const octolyticsMetaNames = Object.values(octolyticsKeyToMetaName);

const getMetaOctolytics = () => {
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

const isOctolyticsMetaTag = (node: HTMLElement) => {
  if (node.tagName.toLowerCase() !== 'meta') {
    return false;
  }
  const name = node.getAttribute('name');
  return name && octolyticsMetaNames.includes(name);
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

  useMutationObserver(
    (mutations) => {
      // 追加された要素の中にOctolyticsで使っているmetaタグが存在するか
      const addedTagExists = !!mutations
        .find(mutation => {
          if (!mutation.addedNodes.length) {
            return false;
          }

          return (Array.from(mutation.addedNodes) as HTMLElement[])
            .find(isOctolyticsMetaTag)
        });

      // 削除された要素の中にOctolyticsで使っているmetaタグが存在するか
      const removedTagExists = !!mutations
        .find(mutation => {
          if (!mutation.removedNodes.length) {
            return false;
          }

          return (Array.from(mutation.removedNodes) as HTMLElement[])
            .find(isOctolyticsMetaTag)
        });


      // mutationListのaddNodesまたはremovedNodesにOctolyticsで使っているmetaタグが含まれていたら再取得する
      if (addedTagExists || removedTagExists) {
        setMetaOctolytics(getMetaOctolytics());
      }
    },
    document.querySelector('head') as HTMLHeadElement,
    {
      subtree: true,
      childList: true,
      attributeFilter: ['value']
    }
  );

  const octolytics: Octolytics = useMemo<Octolytics>(() => {
    const isLoaded = ignoreRepositoryRegExp === undefined;
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

// eslint-disable-next-line react-refresh/only-export-components
export const useOctolytics: () => Octolytics = () => {
  return useContext(OctolyticsContext);
};
