import { AlignmentSide, CorpusContainer, Link, Word } from '../../structs';
import { FullyResolvedLink, ResolvedWordEntry } from './structs';
import { findWordByString } from '../../helpers/findWord';
import { groupPartsIntoWords } from '../../helpers/groupPartsIntoWords';

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
 * generate list (alphabetical) of word texts from alignment link, container and side directive
 * @param link link data to where word ids are listed
 * @param side side to pull word ids from
 */
export const generateWordListFromCorpusContainerAndLink = (
  link: FullyResolvedLink,
  side: AlignmentSide
): string[] => {
  const partsList = Array.from(
    side === AlignmentSide.SOURCE ? link.sourceResolvedWords : link.targetResolvedWords
  )
    .map((word) => word.word)
    .filter((word) => !!word) as Word[];
  return groupPartsIntoWords(partsList)
    .map((parts) => parts.map(({ text }) => text.trim().toLowerCase()).join(''))
    .sort();
};
