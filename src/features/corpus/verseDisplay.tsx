/**
 * This file contains the VerseDisplay component which is used inside the
 * CorpusComponent
 */
import { Corpus, Link, Verse, Word } from '../../structs';
import { ReactElement, useMemo } from 'react';
import { WordDisplay, WordDisplayVariant } from '../wordDisplay';
import { groupPartsIntoWords } from '../../helpers/groupPartsIntoWords';
import { useDataLastUpdated, useFindLinksByBCV, useGetLink } from '../../state/links/tableManager';
import { AlignmentSide } from '../../common/data/project/corpus';
import { compressAlignedWords } from '../../helpers/compressAlignedWords';

/**
 * optionally declare only link data from the given links will be reflected in the verse display
 */
export interface LimitedToLinks {
  onlyLinkIds?: string[]; // alignment link ids
  disableHighlighting?: boolean; // whether highlighting should be disabled
}

export interface VerseDisplayProps extends LimitedToLinks {
  readonly?: boolean;
  variant?: WordDisplayVariant;
  corpus?: Corpus;
  verse: Verse;
  allowGloss?: boolean;
}

/**
 * Display the text of a verse and highlight the words included in alignments, includes a read-only mode for display
 * which doesn't edit alignments
 * @param readonly optional property to specify if the verse should be displayed in read-only mode
 * @param variant which component variant to use
 * @param corpus Corpus containing language information to determine how the verse should be displayed
 * @param verse verse to be displayed
 * @param onlyLinkIds
 * @param allowGloss
 * @constructor
 */
export const VerseDisplay = ({
                               readonly,
                               variant,
                               corpus,
                               verse,
                               onlyLinkIds,
                               allowGloss = false
                             }: VerseDisplayProps) => {
  // const apiRef = useGridApiContext();
  const dataLastUpdated = useDataLastUpdated();
  const verseTokens: Word[][] = useMemo(
    () => groupPartsIntoWords(verse.words),
    [verse?.words]
  );
  const alignmentSide = useMemo(() => corpus?.side as AlignmentSide, [corpus?.side]);
  const { result: onlyLink } = useGetLink(
    (onlyLinkIds?.length ?? 0) > 0 ? onlyLinkIds?.[0] : undefined,
    `${verse.bcvId?.toReferenceString()}-${dataLastUpdated}`
  );
  const { result: allLinks } = useFindLinksByBCV(
    alignmentSide,
    (onlyLinkIds?.length ?? 0) < 1 ? verse.bcvId.book : undefined,
    (onlyLinkIds?.length ?? 0) < 1 ? verse.bcvId.chapter : undefined,
    (onlyLinkIds?.length ?? 0) < 1 ? verse.bcvId.verse : undefined,
    readonly,
    `${verse.bcvId?.toReferenceString()}-${dataLastUpdated}`
  );

  const linkMap = useMemo(() => {
    if ((!allLinks || allLinks.length < 1)
      && !onlyLink) {
      return;
    }
    const result = new Map<string, Link[]>();
    (allLinks ?? [onlyLink as Link])
      .filter(link => onlyLinkIds?.includes(link!.id!) ?? true)
      .forEach(link => ((alignmentSide === AlignmentSide.SOURCE
        ? link!.sources
        : link!.targets) ?? [])
        .forEach(wordId => {
          if (!result.has(wordId)) {
            result.set(wordId, []);
          }
          result.get(wordId)!.push(link!);
        }));
    return result;
  }, [onlyLinkIds, allLinks, onlyLink, alignmentSide]);

  const displayTokens = useMemo(() => {
    // /*
    //  * Calculate length of the verse to see if we need to run it through a
    //  * condensing algorithm so that tokens are visible in the table
    //  */
    // let isAlignedWordCutoff = false;
    // const computedColumnWidth = apiRef ? apiRef.current.getColumn('verse').computedWidth : 0;
    //
    // // iterate over verse Tokens and calculate its length
    // let verseCharacterLength = 0;
    // let verseCharacterLengthUpToAlignedWord = 0;
    // let tokenFound = false;
    // let printableVerse = '';
    // let printableVerseUpToAlignedWord = '';
    //
    // verseTokens.forEach((token) => {
    //   token.forEach((subToken) => {
    //     verseCharacterLength += subToken.text.length;
    //     printableVerse += subToken.text + ' ';
    //     if (linkMap?.has(subToken.id) && !tokenFound) {
    //       verseCharacterLengthUpToAlignedWord = verseCharacterLength;
    //       printableVerseUpToAlignedWord = printableVerse;
    //       tokenFound = true;
    //     }
    //   });
    // });
    //
    // const text = printableVerseUpToAlignedWord;
    // const canvas = document.createElement('canvas');
    // const ctx = canvas.getContext('2d');
    // if (ctx) {
    //   let printableVerseWidth = ctx.measureText(text).width;
    //   let adjustedPrintableVerseWidth = printableVerseWidth * 1.75;
    //   if (adjustedPrintableVerseWidth) {
    //     if (adjustedPrintableVerseWidth > computedColumnWidth) {
    //       isAlignedWordCutoff = true;
    //     }
    //   }
    // }

    return readonly && /*isAlignedWordCutoff && */ linkMap
      ? compressAlignedWords(verseTokens.flat(), linkMap).map(x => [x])
      : verseTokens;

  }, [linkMap, readonly, verseTokens]);

  // aligned word is visible in the table
  return (
    <>
      {(displayTokens || []).map(
        (token: Word[], index): ReactElement => (
          <WordDisplay
            key={`${alignmentSide}:${index}/${token.at(0)?.id}`}
            variant={variant}
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
