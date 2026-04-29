import {FC, useEffect, useRef} from "react";
import {useBoolean} from "@/hooks/useBoolean";
import {addIgnorePattern} from "@/utils/storage";

type Props = {
  repositoryName: string;
};

export const IgnoreMenu: FC<Props> = ({repositoryName}) => {
  const [open, {toggle, setFalse: close}] = useBoolean(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // メニュー外クリックで閉じる
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [open, close]);

  const owner = repositoryName.split("/")[0];

  const handleIgnoreRepo = async () => {
    await addIgnorePattern(repositoryName);
    close();
  };

  const handleIgnoreOwner = async () => {
    await addIgnorePattern(`${owner}/*`);
    close();
  };

  return (
    <div ref={menuRef} className="position-relative d-inline-block">
      <button
        className="Button Button--iconOnly Button--invisible Button--medium"
        type="button"
        aria-label="Ignore options"
        aria-expanded={open}
        onClick={toggle}
      >
        {/* https://primer.style/foundations/icons/kebab-horizontal-16 */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"
             className="octicon octicon-kebab-horizontal">
          <path
            d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
        </svg>
      </button>
      {open && (
        <div
          className="position-absolute bottom-0 right-0 mb-4 py-1 color-bg-overlay color-shadow-large rounded-2"
          style={{whiteSpace: "nowrap", zIndex: 100, boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.12)"}}
        >
          <button
            className="d-block width-full text-left px-3 py-2 color-fg-default color-bg-overlay border-0"
            style={{cursor: "pointer", fontSize: "14px", lineHeight: "20px"}}
            type="button"
            onClick={handleIgnoreRepo}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bgColor-neutral-muted)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
          >
            Ignore this repository
          </button>
          <button
            className="d-block width-full text-left px-3 py-2 color-fg-default color-bg-overlay border-0"
            style={{cursor: "pointer", fontSize: "14px", lineHeight: "20px"}}
            type="button"
            onClick={handleIgnoreOwner}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bgColor-neutral-muted)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
          >
            Ignore this owner's repositories
          </button>
        </div>
      )}
    </div>
  );
};
