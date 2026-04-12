import React, {useEffect, useState} from "react";
import {ThemeProvider, BaseStyles} from '@primer/react'
import {type StorageState, showAlertItem, protectFormItem, ignoreListItem} from "@/utils/storage";
import {Setting} from "./Setting";

export const App: React.FC = () => {
  const [state, setState] = useState<StorageState | undefined>();
  useEffect(() => {
    (async () => {
      const [showAlert, protectForm, ignoreList] = await Promise.all([
        showAlertItem.getValue(),
        protectFormItem.getValue(),
        ignoreListItem.getValue(),
      ]);
      setState({showAlert, protectForm, ignoreList});
    })()
  }, []);

  return (
    <ThemeProvider>
      <BaseStyles>
        {state !== undefined ? <Setting {...state} /> : null}
      </BaseStyles>
    </ThemeProvider>
  );
};
