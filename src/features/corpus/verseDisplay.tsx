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
  const alignmentSide = useMemo(() =>
    corpus?.id === 'source'
      ? AlignmentSide.SOURCE
      : AlignmentSide.TARGET, [corpus?.id]);
  const { result: databaseStatus } = useDatabaseStatus();
  const { result: links } = useFindLinksByBCV(
    alignmentSide,
    verse.bcvId.book,
    verse.bcvId.chapter,
    verse.bcvId.verse,
    false,
    String(databaseStatus.lastUpdateTime ?? 0)
  );
  const linkMap = useMemo(() => {
    if (!links
      || links.length < 0) {
      return;
    }
    const result = new Map<string, Link>();
    (links ?? [])
      .forEach(link => ((alignmentSide === AlignmentSide.SOURCE
        ? link.sources
        : link.targets) ?? [])
        .forEach(wordId => result.set(wordId, link)));
    return result;
  }, [links, alignmentSide]);

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
