import React, { ReactElement, useMemo } from 'react';
import useDebug from 'hooks/useDebug';
import { useAppSelector } from 'app/hooks';
import { Divider, Typography } from '@mui/material';

import { AlignmentSide, CorpusContainer, Link, Word } from 'structs';
import findWordById from 'helpers/findWord';

import cssVar from 'styles/cssVar';
import BCVWP, { BCVWPField } from '../bcvwp/BCVWPSupport';
import { WordDisplay } from '../wordDisplay';

interface LinkBuilderProps {
  containers: CorpusContainer[];
}

export const LinkBuilderComponent: React.FC<LinkBuilderProps> = ({
  containers,
}): ReactElement => {
  useDebug('LinkBuilderComponent');

  const sourceContainer = useMemo(
    () => containers.find(({ id }) => id === AlignmentSide.SOURCE)!,
    // reference to `containers` doesn't change, but the length does
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [containers, containers.length]
  );
  const targetContainer = useMemo(
    () => containers.find(({ id }) => id === AlignmentSide.TARGET)!,
    // reference to `containers` doesn't change, but the length does
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [containers, containers.length]
  );

  const selectedWords: Record<string, Word[]> = useAppSelector((state) => {
    const inProgressLink = state.alignment.present.inProgressLink;

    if (inProgressLink) {
      const sourceWords: Word[] = inProgressLink.sources
        .map((sourceId) => {
          if (!sourceContainer) {
            return null;
          }
          return findWordById(
            sourceContainer?.corpora,
            BCVWP.parseFromString(sourceId)
          );
        })
        .filter((x): x is Word => !!x);

      const targetWords: Word[] = inProgressLink.targets
        .map((targetId) => {
          if (!targetContainer) {
            return null;
          }
          return findWordById(
            targetContainer?.corpora,
            BCVWP.parseFromString(targetId)
          );
        })
        .filter((x): x is Word => !!x);

      return {
        sources: sourceWords ?? [],
        targets: targetWords ?? [],
      } as Record<string, Word[]>;
    }
    return {};
  });

  const theme = useAppSelector((state) => {
    return state.app.theme;
  });

  if (!selectedWords?.sources?.length && !selectedWords?.targets?.length) {
    return (
      <>
        <div
          style={{
            textAlign: 'center',
            paddingLeft: '1rem',
            paddingRight: '1rem',
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem',
          }}
        >
          <Typography
            style={{
              lineHeight: '12rem',
              color: cssVar('font-color', theme),
              userSelect: 'none',
            }}
          >
            Select a target word to begin building a link.
          </Typography>
        </div>
      </>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      {Object.keys(selectedWords).map(
        (textId: string, index: number): ReactElement => {
          const container = containers.find(
            (corpusContainer: CorpusContainer) => {
              return corpusContainer.id === textId;
            }
          );
          if (!container) return <div key={index} />;

          const selectedPartsForText = selectedWords[textId];
          const sortedSelectedPartsForText = selectedPartsForText.sort(
            (a: Word, b: Word) =>
              BCVWP.compare(BCVWP.parseFromString(a.id), BCVWP.parseFromString(b.id)));
          const partsAsWordsTmp: Word[][] = [];
          sortedSelectedPartsForText.forEach((part) => {
            const lastIndex = partsAsWordsTmp.length - 1;
            const currentValueRef: BCVWP = BCVWP.parseFromString(part.id);

            if (
              partsAsWordsTmp[lastIndex]?.length === 0 ||
              (lastIndex >= 0 &&
                BCVWP.parseFromString(
                  partsAsWordsTmp[lastIndex].at(-1)!.id
                ).matchesTruncated(currentValueRef, BCVWPField.Word))
            ) {
              // if text should be grouped in the last word
              partsAsWordsTmp[lastIndex].push(part);
            } else {
              // new word
              partsAsWordsTmp.push([part]);
            }
          });
          const partsAsWords: Word[][] = [];
          partsAsWordsTmp.forEach((word) => {
            if (partsAsWords.length < 1) {
              partsAsWords.push(word);
              return;
            }
            const lastIndex = partsAsWords.length - 1;
            const lastWordPart = partsAsWords[lastIndex][0];
            const lastWordPartBCV = BCVWP.parseFromString(lastWordPart.id);
            const currentWordPartBCV = BCVWP.parseFromString(word[0].id);
            const offsetByOneWordBCV = BCVWP.parseFromString(lastWordPartBCV.toReferenceString());
            offsetByOneWordBCV.word! += 1;
            offsetByOneWordBCV.referenceString = undefined;

            if (!currentWordPartBCV.matchesTruncated(offsetByOneWordBCV, BCVWPField.Word)) {
              partsAsWords.push([]);
            }
            partsAsWords.push(word);
          });

          const wordInDisplayGroup = partsAsWords
            .find(({ length }) => length > 0)
            ?.find((word) => word.id);
          const corpusAtRef = wordInDisplayGroup
            ? container?.corpusAtReferenceString(wordInDisplayGroup.id)
            : undefined;

          const corpus = (container.corpora || [])[0];

          return (
            <div
              key={`linkBuilder_${corpus?.name}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                paddingLeft: '1rem',
                paddingRight: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                color: cssVar('font-color', theme),
              }}
            >
              <Typography variant="h6" style={{ textAlign: 'right' }}>
                {corpus?.name}
              </Typography>
              <div style={{ marginBottom: '8px' }}>
                <Divider />
              </div>
              <div>
                <span>&nbsp;</span>
                {partsAsWords
                  .map((selectedWord, index: number): ReactElement => {
                    if (selectedWord.length < 1) {
                      return <span key={`selected_${index}_ellipsis`}>... </span>;
                    }
                    const wordId = BCVWP.parseFromString(
                      selectedWord.at(0)!.id
                    ).toTruncatedReferenceString(BCVWPField.Word);
                    return (
                      <span key={`selected_${wordId}`}>
                        <WordDisplay
                          suppressAfter={true}
                          readonly={true}
                          key={wordId}
                          parts={selectedWord}
                          corpus={corpusAtRef}
                          disableHighlighting
                        />
                      </span>
                    );
                  })}
              </div>
              <div style={{ marginTop: '8px' }}>
                <Divider />
              </div>
            </div>
          );
        }
      )}
    </div>
  );
};

export default LinkBuilderComponent;
