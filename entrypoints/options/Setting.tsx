import React from "react";
import {Button, FormControl, Heading, Textarea} from "@primer/react";
import {ignoreListItem} from "@/utils/storage";

type Props = {
  ignoreList: string[];
}

const placeholder = `eg. username/repo-name
username/*`;

export const Setting: React.FC<Props> = ({ignoreList}) => {
  const [saved, setSaved] = React.useState(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const textarea = e.currentTarget.querySelector<HTMLTextAreaElement>('textarea#ignore-repository-input');
    const value = textarea?.value || '';
    const patterns = value.split(/(\r\n|\r|\n)/).map(v => v.trim()).filter(v => v);
    await ignoreListItem.setValue(patterns);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    },3000);
  };

  return (
    <div style={{maxWidth: '720px', margin: '0 auto', padding: '0 16px'}}>
      <Heading>Public repo Alert Settings</Heading>
      <form onSubmit={handleSubmit}>
        <FormControl id="ignore-repository-input">
          <FormControl.Label style={{fontSize: "x-large"}}>
              Ignore Repositories
          </FormControl.Label>
          <FormControl.Caption style={{fontSize: "medium"}}>
            Specify the repository where you want to disable this feature.<br/>
            You can specify one per line. Use owner/* to match all repositories of an owner.
          </FormControl.Caption>
          <Textarea style={{height: '250px'}}
                    defaultValue={ignoreList.join("\n")}
                    placeholder={placeholder}
                    block
          />
        </FormControl>
        <FormControl style={{marginTop: '16px'}}>
          {saved ? (
            <Button type="button" size="large" variant="primary" style={{fontSize: "large"}} disabled>Saved</Button>
          ) : (
            <Button type="submit" size="large" variant="primary" style={{fontSize: "large"}}>Save</Button>
          )}

        </FormControl>
      </form>
    </div>
  );
};
