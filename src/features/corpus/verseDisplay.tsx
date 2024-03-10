import { AlignmentSide, Corpus, Link, Verse, Word } from '../../structs';
import { ReactElement, useMemo } from 'react';
import { WordDisplay } from '../wordDisplay';
import { groupPartsIntoWords } from '../../helpers/groupPartsIntoWords';
import { useDatabaseStatus, useFindLinksByBCV } from '../../state/links/tableManager';

/**
 * optionally declare only link data from the given links will be reflected in the verse display
 */
export interface LimitedToLinks {
  onlyLinkIds?: string[]; // alignment link ids
}

export interface VerseDisplayProps extends LimitedToLinks {
  readonly?: boolean;
  corpus?: Corpus;
  verse: Verse;
  allowGloss?: boolean;
}

/**
 * Display the text of a verse and highlight the words included in alignments, includes a read-only mode for display
 * which doesn't edit alignments
 * @param readonly optional property to specify if the verse should be displayed in read-only mode
 * @param corpus Corpus containing language information to determine how the verse should be displayed
 * @param verse verse to be displayed
 * @constructor
 */
export const VerseDisplay = ({
                               readonly,
                               corpus,
                               verse,
                               onlyLinkIds,
                               allowGloss = false
                             }: VerseDisplayProps) => {
  const verseTokens: Word[][] = useMemo(
    () => groupPartsIntoWords(verse.words),
    [verse?.words]
  );
  const { result: databaseStatus } = useDatabaseStatus();
  const alignmentSide = useMemo<AlignmentSide | undefined>(() => {
    if (readonly
      || !verse.words
      || verse.words.length < 1) {
      return;
    }
    return verse.words[0].side;
  }, [readonly, verse.words]);
  const {
    result: wordLinks
  } = useFindLinksByBCV(
    alignmentSide,
    verse.bcvId.book,
    verse.bcvId.chapter,
    verse.bcvId.verse,
    String(databaseStatus?.lastUpdateTime ?? 0));
  const linkMap = useMemo<Map<string, Link> | undefined>(() => {
    if (!alignmentSide
      || !wordLinks
      || wordLinks.length < 1) {
      return;
    }
    const result = new Map<string, Link>();
    wordLinks
      .filter(Boolean)
      .forEach(link => {
        ((alignmentSide === 'sources'
          ? link.sources
          : link.targets) ?? [])
          .forEach(wordId => result.set(wordId, link));
      });
    return result;
  }, [wordLinks, alignmentSide]);

  return (
    <>
      {(verseTokens || []).map(
        (token: Word[], index): ReactElement => (
          <WordDisplay
            key={`${index}/${token.at(0)?.id}`}
            links={linkMap}
            readonly={readonly}
            onlyLinkIds={onlyLinkIds}
            corpus={corpus}
            parts={token}
            allowGloss={allowGloss}
          />
        )
      )}
    </>
  );
};
