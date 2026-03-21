import React from "react";
import {BottomNotification} from "./BottomNotification";
import {OctolyticsProvider} from "./octolytics";
import {PublicRepositoryFormObserver} from "./PublicRepositoryFormObserver";

export const App: React.FC = () => (
  <OctolyticsProvider>
    <PublicRepositoryFormObserver/>
    <BottomNotification />
  </OctolyticsProvider>
);
