import React, {useEffect, useState} from "react";
import {ThemeProvider, BaseStyles} from '@primer/react'
import {ignoreListItem} from "@/utils/storage";
import {Setting} from "./Setting";

export const App: React.FC = () => {
  const [ignoreList, setIgnoreList] = useState<string[] | undefined>();
  useEffect(() => {
    (async () => {
      setIgnoreList(await ignoreListItem.getValue())
    })()
  }, []);

  return (
    <ThemeProvider>
      <BaseStyles>
        {ignoreList !== undefined ? <Setting ignoreList={ignoreList} /> : null}
      </BaseStyles>
    </ThemeProvider>
  );
};
