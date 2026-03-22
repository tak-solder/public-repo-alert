const CONFIRM_JOIN_DISCUSSION_DATA_ATTRIBUTE = 'publicRepoAlertConfirmJoinDiscussionFeature';
export const confirmJoinDiscussion = (composer: HTMLElement) => {
  // コンポーザーごとに1回のみ実行する
  if (composer.dataset[CONFIRM_JOIN_DISCUSSION_DATA_ATTRIBUTE] === 'true') {
    return;
  }
  composer.dataset[CONFIRM_JOIN_DISCUSSION_DATA_ATTRIBUTE] = 'true';

  // コンポーザーを非表示にする
  composer.style.display = 'none';

  // 警告文を表示する
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
  <div class="flash flash-warn my-3 d-flex flex-justify-between flex-items-center">
    <div>
        <strong>Are you sure you want to join in public discussion?</strong>
    </div>
    <button type="button" class="btn">Got it.</button>
  </div>
  `;
  composer.before(wrapper);

  // 警告文のボタンを押したらコンポーザーを表示する
  wrapper.querySelector('button')?.addEventListener('click', () => {
    composer.style.display = '';
    wrapper.remove();
  });
}
