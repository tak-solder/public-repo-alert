import { useCallback, useState } from 'react';

type Actions = {
  setTrue: () => void;
  setFalse: () => void;
  toggle: () => void;
};

export function useBoolean(defaultValue = false): [boolean, Actions] {
  const [state, setState] = useState(defaultValue);

  const actions: Actions = {
    setTrue: useCallback(() => setState(true), []),
    setFalse: useCallback(() => setState(false), []),
    toggle: useCallback(() => setState((prev) => !prev), []),
  };

  return [state, actions];
}
