import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

export default defineContentScript({
  matches: ['https://github.com/*'],
  runAt: 'document_idle',
  main(ctx) {
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        container.id = 'public-repo-alert-root';
        const root = ReactDOM.createRoot(container);
        root.render(
          <React.StrictMode>
            <App />
          </React.StrictMode>,
        );
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });
    ui.mount();
  },
});
