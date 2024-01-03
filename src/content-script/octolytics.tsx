import {createContext, FC, ReactNode, useContext, useMemo, useState} from "react";
import {useMutationObserver} from "ahooks";

export type Octolytics = {
  repositoryName?: string;
  repositoryIsPublic?: boolean;
};

const octolyticsKeyToMetaName: Record<keyof Octolytics, string> = {
  repositoryName: 'octolytics-dimension-repository_nwo',
  repositoryIsPublic: 'octolytics-dimension-repository_public',
} as const;

const octolyticsMetaNames = Object.values(octolyticsKeyToMetaName);

const getOctolytics = () => {
  const octolyticsTags = Array.from(document.querySelectorAll('meta[name*=octolytics-]'));
  const octolyticsMap = new Map(octolyticsTags.map(octolytics => [octolytics.getAttribute('name'), octolytics.getAttribute('content')]));

  const octolytics: Octolytics = {};
  if (octolyticsMap.has(octolyticsKeyToMetaName.repositoryName)) {
    octolytics.repositoryName = octolyticsMap.get(octolyticsKeyToMetaName.repositoryName) as string;
  }
  if (octolyticsMap.has(octolyticsKeyToMetaName.repositoryIsPublic)) {
    octolytics.repositoryIsPublic = octolyticsMap.get(octolyticsKeyToMetaName.repositoryIsPublic) === 'true';
  }

  return octolytics;
}

const OctolyticsContext = createContext<Octolytics>({});

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
  const [octolytics, setOctolytics] = useState<Octolytics>(getOctolytics);

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
        setOctolytics(getOctolytics());
      }
    },
    document.querySelector('head') as HTMLHeadElement,
    {
      subtree: true,
      childList: true,
      attributeFilter: ['value']
    }
  );

  const memoizedOctolytics = useMemo(() => octolytics, [octolytics.repositoryName, octolytics.repositoryIsPublic]);

  return <OctolyticsContext.Provider value={memoizedOctolytics}>
    {children}
  </OctolyticsContext.Provider>;
}

export const useOctolytics: () => Octolytics = () => useContext(OctolyticsContext);
