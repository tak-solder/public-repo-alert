import React, {useEffect, useState} from "react";
import {ThemeProvider, BaseStyles} from '@primer/react'
import {Config, loadConfig} from "@/utils/config";
import {Setting} from "./Setting";

export const App: React.FC = () => {
  const [config, setConfig] = useState<Config | undefined>();
  useEffect(() => {
    (async () => {
      setConfig(await loadConfig())
    })()
  }, []);

  return (
    <ThemeProvider>
      <BaseStyles>
        {config ? <Setting config={config} /> : null}
      </BaseStyles>
    </ThemeProvider>
  );
};
