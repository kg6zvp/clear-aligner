import {Grid, Typography} from '@mui/material';
import {LanguageInfo, Verse, Word} from '../../structs';
import {ReactElement, useMemo} from 'react';
import BCVWP, {BCVWPField} from "../bcvwp/BCVWPSupport";
import {LocalizedTextDisplay} from "../localizedTextDisplay";
import {WordDisplay} from "../wordDisplay";

export interface VerseDisplayProps {
  readonly?: boolean;
  languageInfo?: LanguageInfo;
  verse: Verse;
}

export const VerseDisplay = ({ readonly, languageInfo, verse }: VerseDisplayProps) => {
  const textDirection = languageInfo?.textDirection;
  const verseTokens: (string|Word[])[] = useMemo(() => {
    const partsGroupedByWords = verse.words.reduce((accumulator, currentValue) => {
      const lastIndex = accumulator.length-1;
      const currentValueRef: BCVWP = BCVWP.parseFromString(currentValue.id);

      if ((accumulator[lastIndex]?.length) === 0 ||
        (lastIndex >= 0 && BCVWP.parseFromString(accumulator[lastIndex].at(-1)!.id).matchesTruncated(currentValueRef, BCVWPField.Word)) ) { // if text should be grouped in the last word
        accumulator[lastIndex].push(currentValue);
        return accumulator;
      } else { // new word
        accumulator.push([currentValue]);
        return accumulator;
      }
    }, [] as Word[][])
      .filter(value => value.length >= 1);

    const finalTokens: (string|Word[])[] = [];

    partsGroupedByWords.forEach((word) => {
      finalTokens.push(word);
      if (word.at(-1)?.after) {
        finalTokens.push(word.at(-1)!.after!);
      }
    });

    return finalTokens;
    }, [verse.words]);

  return (
    <Grid
      container
      lang={languageInfo?.code}
      sx={{
        p: '1px',
        pl: 4,
        //flex: 8,
        flexGrow: 1,
        overflow: 'auto',
        ...(textDirection ? { direction: textDirection } : {})
      }}
    >
      <Typography
        style={{
          paddingBottom: '0.5rem',
          paddingLeft: '0.7rem',
          paddingRight: '0.7rem',
        }}
      >
        {(verseTokens || []).map((token: string|Word[], index): ReactElement => {
          if (typeof token === 'string') {
            return (<LocalizedTextDisplay key={index} languageInfo={languageInfo}>{token}</LocalizedTextDisplay>);
          } else {
            return <WordDisplay readonly={readonly} key={`${index}/${token.at(0)?.id}`} languageInfo={languageInfo} parts={token}/>
          }
        })}
      </Typography>
    </Grid>
  );
};
