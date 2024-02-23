import { AlignmentSide, CorpusContainer, Link, Word } from '../../structs';
import { FullyResolvedLink, PivotWord, ResolvedWordEntry } from './structs';
import BCVWP from '../bcvwp/BCVWPSupport';
import findWord, { findWordByString } from '../../helpers/findWord';
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
          const ref = BCVWP.parseFromString(bcvId);
          const corpus = sourceContainer.corpusAtReference(ref);
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
          const ref = BCVWP.parseFromString(bcvId);
          const corpus = targetContainer.corpusAtReference(ref);
          if (!corpus) return undefined;
          const word = findWord([corpus], ref);
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

export const getLinksForPivotWord = (
  linksTable: VirtualTableLinks,
  pivotWord: PivotWord
): PivotWord => {
  pivotWord.alignmentLinks = pivotWord.instances.flatMap((instance) =>
    linksTable.findByWord(pivotWord.side, instance)
  );
  return pivotWord;
};

export const generatePivotWordsMap = async (
  linksTable: VirtualTableLinks,
  sourceContainer: CorpusContainer,
  targetContainer: CorpusContainer,
  side: AlignmentSide
): Promise<Map<string, PivotWord>> => {
  const wordMap = new Map<string, PivotWord>();

  const container = side === 'sources' ? sourceContainer : targetContainer;

  container.corpora.forEach((corpus) => {
    corpus.wordLocation.forEach((value, key) => {
      wordMap.set(
        key,
        getLinksForPivotWord(linksTable, {
          normalizedText: key,
          side,
          instances: Array.from(value),
          languageInfo: corpus.language,
        } as PivotWord)
      );
    });
  });

  return wordMap;
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
  const partsList = Array.from(side === 'sources' ? link.sourceResolvedWords : link.targetResolvedWords)
    .map((word) => word.word)
    .filter((word) => !!word) as Word[];
  return groupPartsIntoWords(partsList)
    .map((parts) => parts.map(({ text }) => text.trim().toLowerCase()).join(''))
    .sort();
};


