import React from "react";
import {BottomNotification} from "./BottomNotification.tsx";
import {OctolyticsProvider} from "./octolytics.tsx";

export const App: React.FC = () => (
  <OctolyticsProvider>
    <BottomNotification />
  </OctolyticsProvider>
);
