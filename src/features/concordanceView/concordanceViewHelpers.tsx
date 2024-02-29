import { AlignmentSide, CorpusContainer, Link, Word } from '../../structs';
import { FullyResolvedLink, PivotWord, ResolvedWordEntry } from './structs';
import { findWordByString } from '../../helpers/findWord';
import { groupPartsIntoWords } from '../../helpers/groupPartsIntoWords';
import { VirtualTableLinks } from '../../state/links/tableManager';

export const fullyResolveLink = (
  link: Link,
  sourceContainer: CorpusContainer,
  targetContainer: CorpusContainer
): FullyResolvedLink => {
  return {
    ...link,
    sourceResolvedWords: new Set<ResolvedWordEntry>(
      link.sources
        .map((bcvId: string): ResolvedWordEntry | undefined => {
          const corpus = sourceContainer.corpusAtReferenceString(bcvId);
          if (!corpus) return undefined;
          const word = findWordByString([corpus], bcvId);
          if (!word) return undefined;
          return {
            word: word,
            localized: {
              text: word.text.toLowerCase(),
              position: word.id,
              languageInfo: corpus.language,
            },
          };
        })
        .filter((v) => !!v)
        .map((v) => v as ResolvedWordEntry)
    ),
    targetResolvedWords: new Set<ResolvedWordEntry>(
      link.targets
        .map((bcvId: string): ResolvedWordEntry | undefined => {
          const corpus = targetContainer.corpusAtReferenceString(bcvId);
          if (!corpus) return undefined;
          const word = findWordByString([corpus], bcvId);
          if (!word) return undefined;
          return {
            word: word,
            localized: {
              text: word.text.toLowerCase(),
              position: word.id,
              languageInfo: corpus.language,
            },
          };
        })
        .filter((v) => !!v)
        .map((v) => v as ResolvedWordEntry)
    ),
  };
};

/**
 * populate alignmentLinks property of given pivotWord
 * @param linksTable datasource
 * @param pivotWord pivotWord to populate
 */
export const getLinksForPivotWord = async (
  linksTable: VirtualTableLinks,
  pivotWord: PivotWord
): Promise<PivotWord> => {
  pivotWord.alignmentLinks = pivotWord.instances.flatMap((instance) =>
    linksTable.findByWord(pivotWord.side, instance)
  );
  return pivotWord;
};

/**
 * generate map of pivotWords without links or alignedWords populated
 * @param linksTable
 * @param container
 * @param side
 */
export const generatePivotWordsList = async (
  container: CorpusContainer,
  side: AlignmentSide
): Promise<Map<string, PivotWord>> => {
  console.time(`generating pivot words for ${side}`);

  const pivotWordPromises = container.corpora.flatMap((corpus) =>
    Array.from(corpus.wordLocation.entries()).map(async ([key, value]) => {
      return new Promise<PivotWord>((resolve) => {
        setTimeout(() => {
            resolve({
              normalizedText: key,
              side,
              instances: Array.from(value),
              languageInfo: corpus.language
            } as PivotWord);
          }, 10);
      });
      }
    )
  );

  const pivotWords: PivotWord[] = [];

  for (const pivotWordPromise of pivotWordPromises) {
    const pivotWord = await pivotWordPromise;
    pivotWords.push(pivotWord);
  }

  const pivotWordsMap = pivotWords.reduce((accumulator, currentValue) => {
    if (
      !accumulator.has(currentValue.normalizedText) ||
      !accumulator.get(currentValue.normalizedText)?.alignmentLinks
    ) {
      // create it
      accumulator.set(currentValue.normalizedText, currentValue);
    } else {
      // mutate it
      const pivotWord = accumulator.get(currentValue.normalizedText)!;
      currentValue.alignmentLinks?.forEach((link) =>
        pivotWord.alignmentLinks!.push(link)
      );
    }
    return accumulator;
  }, new Map<string, PivotWord>());

  console.timeEnd(`generating pivot words for ${side}`);
  return pivotWordsMap;
};

/**
 * generate list (alphabetical) of word texts from alignment link, container and side directive
 * @param link link data to where word ids are listed
 * @param side side to pull word ids from
 */
export const generateWordListFromCorpusContainerAndLink = (
  link: FullyResolvedLink,
  side: AlignmentSide
): string[] => {
  const partsList = Array.from(
    side === 'sources' ? link.sourceResolvedWords : link.targetResolvedWords
  )
    .map((word) => word.word)
    .filter((word) => !!word) as Word[];
  return groupPartsIntoWords(partsList)
    .map((parts) => parts.map(({ text }) => text.trim().toLowerCase()).join(''))
    .sort();
};
