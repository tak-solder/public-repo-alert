import React, {useEffect, useLayoutEffect} from "react";
import {useMutationObserver} from "@/hooks/useMutationObserver";
import {useOctolytics} from "./octolytics";
import {confirmJoinDiscussion} from "./public-repository-form-action/confirmJoinDiscussion";

const OBSERVE_TARGET_SELECTOR = [
  '[data-testid="comment-composer"]',
  'form.js-new-comment-form',
  'form.js-inline-comment-form',
].join(',');

export const PublicRepositoryFormObserver: React.FC = () => {
  const {needShowAlert, isLoaded} = useOctolytics();
  if (!isLoaded || !needShowAlert) {
    return null;
  }

  return <WatchingForm />;
};

const scanAndIntercept = () => {
  document.querySelectorAll<HTMLElement>(OBSERVE_TARGET_SELECTOR).forEach(eachComposerAction);
};

const WatchingForm: React.FC = () => {
  // 読み込み時に既に存在しているコンポーザーに対して実行（ちらつき防止のためuseLayoutEffect）
  useLayoutEffect(() => {
    scanAndIntercept();
  }, []);

  // turbo:load（SPA遷移）時にコンポーザーを再スキャン
  useEffect(() => {
    const handleTurboLoad = () => {
      scanAndIntercept();
    };
    document.addEventListener('turbo:load', handleTurboLoad);
    return () => {
      document.removeEventListener('turbo:load', handleTurboLoad);
    };
  }, []);

  // 動的に追加されたコンポーザーに対して実行
  useMutationObserver(
    (mutations) => {
      mutations
        .map(mutation => {
          return (Array.from(mutation.addedNodes))
            .map(node => {
              if (!(node instanceof HTMLElement)) {
                return [];
              }

              // 追加されたノード自体がコンポーザーの場合と、子孫にコンポーザーがある場合の両方を検出
              const composers: HTMLElement[] = [];
              if (node.matches(OBSERVE_TARGET_SELECTOR)) {
                composers.push(node);
              }
              composers.push(...Array.from(node.querySelectorAll<HTMLElement>(OBSERVE_TARGET_SELECTOR)));
              return composers;
            }).flat()
        })
        .flat()
        .forEach(eachComposerAction);
    },
    document.body,
    {
      subtree: true,
      childList: true,
    }
  );

  return null;
};

const eachComposerAction = (composer: HTMLElement) => {
  confirmJoinDiscussion(composer);
};
