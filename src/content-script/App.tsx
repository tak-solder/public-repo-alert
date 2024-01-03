import React from "react";
import {BottomNotification} from "./BottomNotification.tsx";
import {OctolyticsProvider} from "./octolytics.tsx";
import {PublicRepositoryFormObserver} from "./PublicRepositoryFormObserver.tsx";

export const App: React.FC = () => (
  <OctolyticsProvider>
    <PublicRepositoryFormObserver/>
    <BottomNotification />
  </OctolyticsProvider>
);
