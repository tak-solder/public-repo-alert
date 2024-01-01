import React from "react";
import {BottomNotification} from "./BottomNotification.tsx";
import {OctolyticsProvider} from "./octolytics.tsx";
import {CommentConfirmFeature} from "./CommentConfirmFeature.tsx";

export const App: React.FC = () => (
  <OctolyticsProvider>
    <CommentConfirmFeature/>
    <BottomNotification />
  </OctolyticsProvider>
);
