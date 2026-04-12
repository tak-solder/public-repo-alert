import React from "react";
import {Flash, FormControl, Heading, ToggleSwitch} from "@primer/react";
import {TrashIcon, MarkGithubIcon, PlusIcon} from "@primer/octicons-react";
import {type StorageState, showAlertItem, protectFormItem, ignoreListItem} from "@/utils/storage";

const REPO_URL = "https://github.com/tak-solder/public-repo-alert";

function validatePattern(value: string, currentList: string[]): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[^/]+\/(\*|[^/*]+)$/.test(trimmed)) {
    return "Please enter in owner/repo or owner/* format.";
  }
  if (currentList.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
    return "This pattern is already registered.";
  }
  return "";
}

export const Setting: React.FC<StorageState> = ({showAlert: initialShowAlert, protectForm: initialProtectForm, ignoreList: initialIgnoreList}) => {
  const [showAlert, setShowAlert] = React.useState(initialShowAlert);
  const [protectForm, setProtectForm] = React.useState(initialProtectForm);
  const [ignoreList, setIgnoreList] = React.useState(initialIgnoreList);
  const [input, setInput] = React.useState("");
  const [error, setError] = React.useState("");

  const handleToggleShowAlert = async () => {
    const newValue = !showAlert;
    setShowAlert(newValue);
    await showAlertItem.setValue(newValue);
  };

  const handleToggleProtectForm = async () => {
    const newValue = !protectForm;
    setProtectForm(newValue);
    await protectFormItem.setValue(newValue);
  };

  const handleRemovePattern = async (index: number) => {
    const newList = ignoreList.filter((_, i) => i !== index);
    setIgnoreList(newList);
    await ignoreListItem.setValue(newList);
  };

  const handleAddPattern = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validatePattern(input, ignoreList);
    if (result === null) return;
    if (result !== "") {
      setError(result);
      return;
    }
    const trimmed = input.trim();
    const newList = [...ignoreList, trimmed];
    setIgnoreList(newList);
    setInput("");
    setError("");
    await ignoreListItem.setValue(newList);
  };

  return (
    <div style={{maxWidth: 600, margin: "0 auto", padding: "32px 24px"}}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32}}>
        <Heading style={{fontSize: 24}}>Public repo Alert Settings</Heading>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" aria-label="GitHub repository">
          <MarkGithubIcon size={24} />
        </a>
      </div>

      <section style={{marginBottom: 32, borderRadius: 6, border: "1px solid var(--borderColor-default, #d0d7de)", overflow: "hidden"}}>
        <div style={{padding: "12px 20px", background: "var(--bgColor-muted, #f6f8fa)", borderBottom: "1px solid var(--borderColor-default, #d0d7de)"}}>
          <Heading as="h3" style={{fontSize: 16, margin: 0}}>Features</Heading>
        </div>
        <div style={{padding: "0 20px"}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--borderColor-muted, #d8dee4)"}}>
            <div>
              <div id="show-alert-label" style={{fontSize: 15, fontWeight: 600}}>Show Alert</div>
              <div style={{fontSize: 13, color: "var(--fgColor-muted, #656d76)", marginTop: 2}}>Display a warning bar when viewing public repositories</div>
            </div>
            <ToggleSwitch
              aria-labelledby="show-alert-label"
              checked={showAlert}
              onClick={handleToggleShowAlert}
            />
          </div>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0"}}>
            <div>
              <div id="protect-form-label" style={{fontSize: 15, fontWeight: 600}}>Protect Form</div>
              <div style={{fontSize: 13, color: "var(--fgColor-muted, #656d76)", marginTop: 2}}>Hide comment forms to prevent accidental posts</div>
            </div>
            <ToggleSwitch
              aria-labelledby="protect-form-label"
              checked={protectForm}
              onClick={handleToggleProtectForm}
            />
          </div>
        </div>
      </section>

      <section style={{borderRadius: 6, border: "1px solid var(--borderColor-default, #d0d7de)", overflow: "hidden"}}>
        <div style={{padding: "12px 20px", background: "var(--bgColor-muted, #f6f8fa)", borderBottom: "1px solid var(--borderColor-default, #d0d7de)"}}>
          <Heading as="h3" style={{fontSize: 16, margin: 0}}>Ignore List</Heading>
        </div>
        <div style={{padding: "16px 20px"}}>
          <form onSubmit={handleAddPattern}>
            <FormControl>
              <FormControl.Label htmlFor="add-pattern-input" visuallyHidden>Add pattern</FormControl.Label>
              <div style={{display: "flex", gap: 8}}>
                <div style={{position: "relative", flex: 1}}>
                  <span style={{position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fgColor-muted, #656d76)", pointerEvents: "none", display: "flex"}}><PlusIcon size={16} /></span>
                  <input
                    id="add-pattern-input"
                    type="text"
                    placeholder="owner/repo or owner/*"
                    value={input}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setInput(e.target.value);
                      if (error) setError("");
                    }}
                    style={{width: "100%", padding: "8px 12px 8px 36px", fontSize: 14, border: "1px solid var(--borderColor-default, #d0d7de)", borderRadius: 6, background: "var(--bgColor-default, #fff)", boxSizing: "border-box"}}
                  />
                </div>
                <button type="submit" style={{padding: "8px 16px", fontSize: 14, fontWeight: 600, color: "#fff", background: "#2563eb", border: "1px solid #2563eb", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap"}}>Add New</button>
              </div>
              {error && (
                <Flash variant="danger" style={{marginTop: 8}}>{error}</Flash>
              )}
            </FormControl>
          </form>
          {ignoreList.length > 0 && (
            <ul style={{listStyle: "none", padding: 0, margin: "16px 0 0 0"}}>
              {ignoreList.map((pattern, index) => (
                <li
                  key={pattern}
                  style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--borderColor-muted, #d8dee4)"}}
                >
                  <span style={{fontSize: 14}}>{pattern}</span>
                  <button
                    type="button"
                    aria-label={`Delete ${pattern}`}
                    onClick={() => handleRemovePattern(index)}
                    style={{background: "none", border: "none", cursor: "pointer", padding: 4, color: "#cf222e", display: "flex"}}
                  >
                    <TrashIcon size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {ignoreList.length === 0 && (
            <div style={{marginTop: 16, color: "var(--fgColor-muted, #656d76)", fontSize: 14}}>
              No items in the ignore list.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
