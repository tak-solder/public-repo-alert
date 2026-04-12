import React from "react";
import {Button, Flash, FormControl, Heading, TextInput, ToggleSwitch} from "@primer/react";
import {TrashIcon, MarkGithubIcon} from "@primer/octicons-react";
import {showAlertItem, protectFormItem, ignoreListItem} from "@/utils/storage";

type Props = {
  showAlert: boolean;
  protectForm: boolean;
  ignoreList: string[];
};

const REPO_URL = "https://github.com/tak-solder/public-repo-alert";

function validatePattern(value: string, currentList: string[]): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[^/]+\/(\*|[^/*]+)$/.test(trimmed)) {
    return "owner/repo または owner/* の形式で入力してください";
  }
  if (currentList.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
    return "このパターンは既に登録されています";
  }
  return "";
}

export const Setting: React.FC<Props> = ({showAlert: initialShowAlert, protectForm: initialProtectForm, ignoreList: initialIgnoreList}) => {
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
    <div style={{maxWidth: 720, margin: "0 auto", padding: "0 16px"}}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24}}>
        <Heading>Public repo Alert Settings</Heading>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" aria-label="GitHub repository">
          <MarkGithubIcon size={24} />
        </a>
      </div>

      <section style={{marginBottom: 24}}>
        <Heading as="h3" style={{fontSize: 16, marginBottom: 16}}>機能設定</Heading>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0"}}>
          <span id="show-alert-label">アラート表示</span>
          <ToggleSwitch
            aria-labelledby="show-alert-label"
            checked={showAlert}
            onClick={handleToggleShowAlert}
          />
        </div>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0"}}>
          <span id="protect-form-label">フォーム保護</span>
          <ToggleSwitch
            aria-labelledby="protect-form-label"
            checked={protectForm}
            onClick={handleToggleProtectForm}
          />
        </div>
      </section>

      <section>
        <Heading as="h3" style={{fontSize: 16, marginBottom: 16}}>除外リスト</Heading>
        {ignoreList.length > 0 && (
          <ul style={{listStyle: "none", padding: 0, margin: "0 0 16px 0"}}>
            {ignoreList.map((pattern, index) => (
              <li
                key={pattern}
                style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--borderColor-default, #d0d7de)"}}
              >
                <code>{pattern}</code>
                <Button
                  variant="danger"
                  size="small"
                  aria-label={`${pattern} を削除`}
                  onClick={() => handleRemovePattern(index)}
                  leadingVisual={TrashIcon}
                >
                  削除
                </Button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={handleAddPattern}>
          <FormControl>
            <FormControl.Label>パターンを追加</FormControl.Label>
            <FormControl.Caption>owner/repo または owner/* の形式で入力</FormControl.Caption>
            <div style={{display: "flex", gap: 8}}>
              <TextInput
                placeholder="owner/repo"
                value={input}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setInput(e.target.value);
                  if (error) setError("");
                }}
                block
              />
              <Button type="submit">追加</Button>
            </div>
            {error && (
              <Flash variant="danger" style={{marginTop: 8}}>{error}</Flash>
            )}
          </FormControl>
        </form>
      </section>
    </div>
  );
};
