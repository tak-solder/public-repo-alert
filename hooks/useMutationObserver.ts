import { useEffect, useRef } from 'react';

export function useMutationObserver(
  callback: MutationCallback,
  target: Node | null,
  options: MutationObserverInit,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!target) {
      return;
    }

    const observer = new MutationObserver((...args) => {
      callbackRef.current(...args);
    });
    observer.observe(target, optionsRef.current);

    return () => {
      observer.disconnect();
    };
  }, [target]);
}
