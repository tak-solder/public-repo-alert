import {FC, useEffect, useRef, useState} from "react";
import {useBoolean} from "ahooks";
import {useOctolytics} from "./octolytics.tsx";

export const BottomNotification: FC = () => {
  const [hidden, {setTrue: handleCloseButton}] = useBoolean(false)
  const fixedDivRef = useRef<HTMLDivElement>(null);
  const [wrapperHeight, setWrapperHeight] = useState<number>(0);
  const octolytics = useOctolytics()

  const needShow = !hidden && octolytics.repositoryIsPublic;

  useEffect(() => {
    const height = fixedDivRef.current?.clientHeight ?? 0;
    setWrapperHeight(height);
  }, [needShow]);

  if (!needShow) {
    return null;
  }

  return (
    // fixedの要素分、wrapperの高さを確保する
    <div style={{height: wrapperHeight}}>
      <div className="position-fixed bottom-0 width-full" ref={fixedDivRef}>
        <div className="flash flash-error flash-full border-bottom-0 text-center text-bold py-2">
          <div className="flash-action d-flex flex-items-center">
            <button className="flash-close Button Button--iconOnly Button--invisible Button--medium" type="submit"
                    aria-label="Close" onClick={handleCloseButton}>
              {/* https://primer.style/foundations/icons/x-16 */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"
                   className="octicon octicon-x">
                <path
                  d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path>
              </svg>
            </button>
          </div>
          <span>This repository is public</span>
        </div>
      </div>
    </div>
  );
};
