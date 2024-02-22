import { AlignmentSide, CorpusContainer, Link, Word } from '../../structs';
import {
  AlignedWord, FullyResolvedLink,
  LocalizedWordEntry,
  PivotWord, ResolvedWordEntry
} from './structs';
import _ from 'lodash';
import BCVWP from '../bcvwp/BCVWPSupport';
import findWord from '../../helpers/findWord';
import { groupPartsIntoWords } from '../../helpers/groupPartsIntoWords';
import { VirtualTableLinks } from '../../state/links/tableManager';

const fullyResolveLink = (
  link: Link,
  sourceContainer: CorpusContainer,
  targetContainer: CorpusContainer): FullyResolvedLink => {
  return {
    ...link,
    sourceResolvedWords: new Set<ResolvedWordEntry>(
      link.sources.map((bcvId: string): ResolvedWordEntry|undefined => {
        const ref = BCVWP.parseFromString(bcvId);
        const corpus = sourceContainer.corpusAtReference(ref);
        if (!corpus) return undefined;
        const word = findWord([ corpus ], ref);
        if (!word) return undefined;
        return {
          word: word,
          localized: {
            text: word.text.toLowerCase(),
            position: word.id,
            languageInfo: corpus.language
          }
        };
      })
      .filter(v => !!v)
      .map(v => v as ResolvedWordEntry)),
    targetResolvedWords: new Set<ResolvedWordEntry>(
      link.targets.map((bcvId: string): ResolvedWordEntry|undefined => {
        const ref = BCVWP.parseFromString(bcvId);
        const corpus = targetContainer.corpusAtReference(ref);
        if (!corpus) return undefined;
        const word = findWord([ corpus ], ref);
        if (!word) return undefined;
        return {
          word: word,
          localized: {
            text: word.text.toLowerCase(),
            position: word.id,
            languageInfo: corpus.language
          }
        };
      })
      .filter(v => !!v)
      .map(v => v as ResolvedWordEntry))
  };
};

const getLinksForPivotWord = (
  linksTable: VirtualTableLinks,
  pivotWord: PivotWord
): PivotWord => {
  pivotWord.alignmentLinks = pivotWord.instances
    .flatMap((instance) => linksTable.findByWord(pivotWord.side, instance));
  return pivotWord;
}

export const generatePivotWordsMap = (
  linksTable: VirtualTableLinks,
  sourceContainer: CorpusContainer,
  targetContainer: CorpusContainer,
  side: AlignmentSide
): Map<string, PivotWord> => {
  const wordMap = new Map<string, PivotWord>();

  const container = side === 'sources' ? sourceContainer : targetContainer;

  container.corpora
    .forEach((corpus) => {
      corpus.wordLocation.forEach((value, key) => {
        wordMap.set(key, getLinksForPivotWord(linksTable, {
          normalizedText: key,
          side,
          instances: Array.from(value),
          languageInfo: corpus.language,
        } as PivotWord));
      });
    });

  return wordMap;
}

/**
 * generate list (alphabetical) of word texts from alignment link, container and side directive
 * @param container corpora with data to reference strings from
 * @param link link data to where word ids are listed
 * @param side side to pull word ids from
 */
const generateWordListFromCorpusContainerAndLink = (
  container: CorpusContainer,
  link: Link,
  side: AlignmentSide
): string[] => {
  const partsList = link[side]
    .map(BCVWP.parseFromString)
    .map((reference) => findWord(container.corpora, reference))
    .filter((word) => !!word) as Word[];
  return groupPartsIntoWords(partsList).map((parts) =>
    parts.map(({ text }) => text.trim().toLowerCase()).join('')
  );
};

export const hydratePivotWord = (
  pivotWord: PivotWord,
  sourceContainer: CorpusContainer,
  targetContainer: CorpusContainer,
  wordSource: AlignmentSide
): PivotWord => {
  const sourceTextId = sourceContainer.id;
  const targetTextId = targetContainer.id;
  const frequency = pivotWord.alignmentLinks?.length || 0;

  const initialAccumulator = {
    sourceWords: [] as LocalizedWordEntry[],
      targetWords: [] as LocalizedWordEntry[],
  };

  const sourceAndTargetWords = pivotWord.alignmentLinks
    ?.map((value: Link): {
      sourceWords: LocalizedWordEntry[],
      targetWords: LocalizedWordEntry[]
    } => {
      const sourceWords = value.sources
        .map(BCVWP.parseFromString)
        .map((ref: BCVWP) => {
          const wort = findWord(sourceContainer.corpora, ref);
          const languageInfo =
            sourceContainer.corpusAtReference(ref)?.language;
          if (!wort) return undefined;
          return {
            text: wort.text.toLowerCase(),
            position: wort.id,
            languageInfo,
          };
        })
        .filter((v) => !!v);
      const targetWords = value.targets
        .map(BCVWP.parseFromString)
        .map((ref: BCVWP) => {
          const wort = findWord(targetContainer.corpora, ref);
          const languageInfo =
            targetContainer.corpusAtReference(ref)?.language;
          if (!wort) return undefined;
          return {
            text: wort.text.toLowerCase(),
            position: wort.id,
            languageInfo,
          };
        })
        .filter((v) => !!v);
      return {
        sourceWords,
        targetWords,
      } as {
        sourceWords: LocalizedWordEntry[];
        targetWords: LocalizedWordEntry[];
      };
    })
    .reduce((accumulator, currentValue) => {
        currentValue.sourceWords.forEach((current) =>
          accumulator.sourceWords.push(current)
        );
        currentValue.targetWords.forEach((current) =>
          accumulator.targetWords.push(current)
        );
        return accumulator;
      },
      initialAccumulator) ?? initialAccumulator;

  const alignedWord: AlignedWord = {
    id: pivotWord.normalizedText,
      frequency,
      sourceTextId,
      targetTextId,
      sourceWordTexts: _.uniqWith(
    sourceAndTargetWords.sourceWords,
    (a, b): boolean => a.text === b.text
  ).sort(),
    targetWordTexts: _.uniqWith(
    sourceAndTargetWords.targetWords,
    (a, b): boolean => a.text === b.text
  ).sort(),
    alignments: pivotWord.alignmentLinks ?? [],
  };

  return pivotWord;
}


