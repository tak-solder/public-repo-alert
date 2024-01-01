import React from "react";
import {useMutationObserver} from "ahooks";

const COMMENT_CONFIRM_FEATURE_FORM_SELECTOR = 'form.js-new-comment-form';
const COMMENT_CONFIRM_FEATURE_DATA_ATTRIBUTE = 'publicRepoAlertCommentConfirmFeature';

export const CommentConfirmFeature: React.FC = () => {

  document.querySelectorAll<HTMLFormElement>(COMMENT_CONFIRM_FEATURE_FORM_SELECTOR).forEach(addConfirmListener);

  useMutationObserver(
    (mutations) => {
      mutations
        .map(mutation => {
          return (Array.from(mutation.addedNodes))
            .map<HTMLFormElement[]>(node => {
              if (!(node instanceof HTMLElement)) {
                return [];
              }

              return Array.from(node.querySelectorAll(COMMENT_CONFIRM_FEATURE_FORM_SELECTOR))
            }).flat()
        })
        .flat()
        .forEach(addConfirmListener);

    },
    document.querySelector('body') as HTMLBodyElement,
    {
      subtree: true,
      childList: true,
    }
  );

  return null;
};

const addConfirmListener = (form: HTMLFormElement) => {
  if (form.dataset[COMMENT_CONFIRM_FEATURE_DATA_ATTRIBUTE] === 'true') {
    return;
  }

  form.addEventListener('submit', (e) => {
    if (!confirm('Do you want to comment to public repository?')) {
      e.stopPropagation();
      e.preventDefault();
    }
  });
  form.dataset[COMMENT_CONFIRM_FEATURE_DATA_ATTRIBUTE] = 'true';
}
