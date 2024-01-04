import React from "react";
import {Box, Button, FormControl, Heading, Textarea} from "@primer/react";
import {Config, saveConfig} from "../contig/config.ts";

type Props = {
  config: Config;
}

const placeholder = `eg. username/repo-name
^username/`;

export const Setting: React.FC<Props> = ({config}) => {
  const [saved, setSaved] = React.useState(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const textarea = e.currentTarget.querySelector<HTMLTextAreaElement>('textarea#ignore-repository-input');
    const value = textarea?.value || '';
    const ignoreRepositoryPatterns = value.split(/(\r\n|\r|\n)/).map(v => v.trim()).filter(v => v);
    await saveConfig({ignoreRepositoryPatterns})
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    },3000);
  };

  return (
    <Box sx={{maxWidth: '720px', mx: 'auto', px: 4}}>
      <Heading>Public repo Alert Settings</Heading>
      <form onSubmit={handleSubmit}>
        <FormControl id="ignore-repository-input">
          <FormControl.Label sx={{fontSize: "x-large"}}>
              Ignore Repositories
          </FormControl.Label>
          <FormControl.Caption sx={{fontSize: "medium"}}>
            Specify the repository where you want to disable this feature.<br/>
            You can specify one per line. Regular expressions can be used.
          </FormControl.Caption>
          <Textarea sx={{height: '250px'}}
                    defaultValue={config.ignoreRepositoryPatterns.join("\n")}
                    placeholder={placeholder}
                    block
          />
        </FormControl>
        <FormControl sx={{marginTop: 3}}>
          {saved ? (
            <Button type="button" size="large" variant="primary" sx={{fontSize: "large"}} disabled>Saved</Button>
          ) : (
            <Button type="submit" size="large" variant="primary" sx={{fontSize: "large"}}>Save</Button>
          )}

        </FormControl>
      </form>
    </Box>
  );
};
