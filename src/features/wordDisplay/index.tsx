import { LanguageInfo, Word } from '../../structs';
import { Typography } from '@mui/material';
import TextSegment from '../textSegment';

export interface WordDisplayProps {
  readonly?: boolean;
  parts?: Word[];
  languageInfo?: LanguageInfo;
}

export const WordDisplay = ({
  readonly,
  parts,
  languageInfo,
}: WordDisplayProps) => {
  return (
    <>
      <Typography
        component={'span'}
        style={{
          padding: '1px',
        }}
      >
        {parts?.map((part) => (
          <TextSegment
            readonly={readonly}
            key={part.id}
            word={part}
            languageInfo={languageInfo}
          />
        ))}
      </Typography>
      <span> </span>
    </>
  );
};
