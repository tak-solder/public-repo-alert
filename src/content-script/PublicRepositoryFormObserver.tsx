import React from "react";
import {useMutationObserver} from "ahooks";
import {useOctolytics} from "./octolytics.tsx";
import {confirmJoinDiscussion} from "./public-repository-form-action/confirmJoinDiscussion.ts";

// 以下のフォームに対して実行する
const OBSERVE_FORM_SELECTOR = [
  'form.js-new-comment-form',
  'form.new_issue',
  'form.new-pr-form',
  'form.js-inline-comment-form',
].join(',');

export const PublicRepositoryFormObserver: React.FC = () => {
  const {needShowAlert} = useOctolytics();
  if (!needShowAlert) {
    return null;
  }

  return <WatchingForm />;
};

const WatchingForm: React.FC = () => {
  // 読み込み時に既に存在しているフォームに対して実行
  document.querySelectorAll<HTMLFormElement>(OBSERVE_FORM_SELECTOR).forEach(eachFormAction);

  // 追加されたフォームに対して実行
  useMutationObserver(
    (mutations) => {
      mutations
        .map(mutation => {
          return (Array.from(mutation.addedNodes))
            .map(node => {
              if (!(node instanceof HTMLElement)) {
                return [];
              }

              return Array.from(node.querySelectorAll<HTMLFormElement>(OBSERVE_FORM_SELECTOR))
            }).flat()
        })
        .flat()
        .forEach(eachFormAction);
    },
    document.querySelector('body') as HTMLBodyElement,
    {
      subtree: true,
      childList: true,
    }
  );

  return null;
};

const eachFormAction = (form: HTMLFormElement) => {
  confirmJoinDiscussion(form);
};
