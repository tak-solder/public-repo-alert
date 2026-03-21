import React, {useEffect, useState} from "react";
import {ThemeProvider, BaseStyles} from '@primer/react'
import {Config, loadConfig} from "../contig/config.ts";
import {Setting} from "./Setting.tsx";

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
