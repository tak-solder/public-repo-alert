import React from "react";
import {BottomNotification} from "./BottomNotification.tsx";
import {OctolyticsProvider} from "./octolytics.tsx";
import {PublicRepositoryObserveFeature} from "./PublicRepositoryObserveFeature.tsx";

export const App: React.FC = () => (
  <OctolyticsProvider>
    <PublicRepositoryObserveFeature/>
    <BottomNotification />
  </OctolyticsProvider>
);
