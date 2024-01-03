const CONFIRM_JOIN_DISCUSSION_DATA_ATTRIBUTE = 'publicRepoAlertConfirmJoinDiscussionFeature';
export const confirmJoinDiscussion = (form: HTMLFormElement) => {
  // formごとに1回のみ実行する
  if (form.dataset[CONFIRM_JOIN_DISCUSSION_DATA_ATTRIBUTE] === 'true') {
    return;
  }
  form.dataset[CONFIRM_JOIN_DISCUSSION_DATA_ATTRIBUTE] = 'true';

  // コメントフォームを非表示にする
  form.style.display = 'none';

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
  form.before(wrapper);

  // 警告文のボタンを押したらコメントフォームを表示する
  wrapper.querySelector('button')?.addEventListener('click', () => {
    form.style.display = '';
    wrapper.remove();
  });
}
