import { useMemo, useState } from 'react';

type Actions = {
  setTrue: () => void;
  setFalse: () => void;
  toggle: () => void;
};

export function useBoolean(defaultValue = false): [boolean, Actions] {
  const [state, setState] = useState(defaultValue);

  const actions: Actions = useMemo(() => ({
    setTrue: () => setState(true),
    setFalse: () => setState(false),
    toggle: () => setState((prev) => !prev),
  }), []);

  return [state, actions];
}
