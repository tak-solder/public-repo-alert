import { useEffect, useRef } from 'react';

export function useMutationObserver(
  callback: MutationCallback,
  target: Node | null,
  options: MutationObserverInit,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!target) {
      return;
    }

    const observer = new MutationObserver((...args) => {
      callbackRef.current(...args);
    });
    observer.observe(target, options);

    return () => {
      observer.disconnect();
    };
  }, [target, JSON.stringify(options)]);
}
