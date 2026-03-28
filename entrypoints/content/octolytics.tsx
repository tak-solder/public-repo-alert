import {createContext, FC, ReactNode, useContext, useEffect, useMemo, useState} from "react";
import {showAlertItem, protectFormItem, ignoreListItem, isIgnored} from "@/utils/storage";

export type Octolytics = MetaOctolytics & {
  showAlert: boolean;
  protectForm: boolean;
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
  showAlert: false,
  protectForm: false,
  isLoaded: false,
});

type Props = {
  children: ReactNode;
}

type StorageState = {
  showAlert: boolean;
  protectForm: boolean;
  ignoreList: string[];
} | undefined;

export const OctolyticsProvider: FC<Props> = ({children}) => {
  const [metaOctolytics, setMetaOctolytics] = useState<MetaOctolytics>(getMetaOctolytics);
  const [storageState, setStorageState] = useState<StorageState>();

  // storageから初期値を読み込む
  useEffect(() => {
    (async () => {
      const [showAlert, protectForm, ignoreList] = await Promise.all([
        showAlertItem.getValue(),
        protectFormItem.getValue(),
        ignoreListItem.getValue(),
      ]);
      setStorageState({showAlert, protectForm, ignoreList});
    })();
  }, []);

  // storage.watch()で変更を即時反映する
  useEffect(() => {
    const unwatchShowAlert = showAlertItem.watch((newValue) => {
      setStorageState(prev => prev ? {...prev, showAlert: newValue} : undefined);
    });
    const unwatchProtectForm = protectFormItem.watch((newValue) => {
      setStorageState(prev => prev ? {...prev, protectForm: newValue} : undefined);
    });
    const unwatchIgnoreList = ignoreListItem.watch((newValue) => {
      setStorageState(prev => prev ? {...prev, ignoreList: newValue} : undefined);
    });
    return () => {
      unwatchShowAlert();
      unwatchProtectForm();
      unwatchIgnoreList();
    };
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
    const isLoaded = storageState !== undefined;
    let showAlert = false;
    let protectForm = false;
    if (isLoaded && metaOctolytics.repositoryIsPublic) {
      const ignored = isIgnored(metaOctolytics.repositoryName!, storageState.ignoreList);
      showAlert = storageState.showAlert && !ignored;
      protectForm = storageState.protectForm && !ignored;
    }
    return {
      ...metaOctolytics,
      showAlert,
      protectForm,
      isLoaded,
    };
  }, [metaOctolytics, storageState]);

  return <OctolyticsContext.Provider value={octolytics}>
    {children}
  </OctolyticsContext.Provider>;
}

export const useOctolytics: () => Octolytics = () => {
  return useContext(OctolyticsContext);
};
