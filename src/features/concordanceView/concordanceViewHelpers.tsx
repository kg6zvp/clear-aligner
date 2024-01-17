import { Alignment, CorpusContainer, Link } from '../../structs';
import {
  NormalizedTextToAlignmentLink,
  NormalizedTextToPivotWord,
  NormalizedWordsToFrequencyAndLocalization,
  PivotWord,
} from './structs';
import _ from 'lodash';
import BCVWP from '../bcvwp/BCVWPSupport';
import findWord from '../../helpers/findWord';
import { WordSource } from './concordanceView';

/**
 * generate words and frequencies from a word source
 * @param wordSource word source to generate words keyed to frequencies and correct language info
 */
export const generateAllWordsAndFrequencies = (
  wordSource?: CorpusContainer
): NormalizedWordsToFrequencyAndLocalization | undefined =>
  wordSource?.corpora
    ?.flatMap((corpus) => {
      return corpus.words
        .map((word) => word.text)
        .filter((value) => !!value)
        .map((text) => ({
          text,
          languageInfo: corpus.language,
        }));
    })
    .reduce((accumulator, currentValue) => {
      const key = currentValue.text.toLowerCase();
      if (!accumulator[key]) {
        accumulator[key] = {
          count: 0,
          languageInfo: currentValue.languageInfo,
        };
      }
      ++accumulator[key].count;
      return accumulator;
    }, {} as NormalizedWordsToFrequencyAndLocalization);

/**
 * generate a map of normalized pivot word text to the corresponding pivot words, used to generate the data displayed
 * in tables in the concordance view
 * @param wordsAndFrequencies
 */
export const generatePivotWordsMap = (
  wordsAndFrequencies: NormalizedWordsToFrequencyAndLocalization
): NormalizedTextToPivotWord =>
  Object.keys(wordsAndFrequencies)
    .filter((key) => !!wordsAndFrequencies[key])
    .map((key) => {
      return {
        normalizedText: key,
        frequency: wordsAndFrequencies[key].count,
        languageInfo: wordsAndFrequencies[key].languageInfo,
      } as PivotWord;
    })
    .reduce((accumulator, currentValue) => {
      accumulator[currentValue.normalizedText] = currentValue;
      return accumulator;
    }, {} as NormalizedTextToPivotWord);

/**
 * gnerate a map of normalized text to alignment links
 * @param alignmentState application state
 * @param sourceContainer corpus container for sources
 * @param targetContainer corpus container for targets
 * @param wordSource selected word source
 */
export const generateAlignedWordsMap = (
  alignmentState: Alignment[],
  sourceContainer: CorpusContainer,
  targetContainer: CorpusContainer,
  wordSource: WordSource
): NormalizedTextToAlignmentLink =>
  alignmentState
    ?.map((alignmentData: Alignment) => {
      if (!sourceContainer.containsCorpus(alignmentData.source)) {
        throw new Error(
          `${alignmentData.source} is not equal to ${sourceContainer.id}`
        );
      }
      if (!targetContainer.containsCorpus(alignmentData.target)) {
        throw new Error(
          `${alignmentData.target} is not equal to ${targetContainer.id}`
        );
      }
      const src = wordSource === 'source' ? sourceContainer : targetContainer;
      return alignmentData.links.reduce((accumulator, singleAlignment) => {
        const uniqueAlignedWords = _.uniqWith(
          singleAlignment[wordSource === 'source' ? 'sources' : 'targets']
            .map(BCVWP.parseFromString) // get references to all words on selected side of the alignment
            .map((wordReference: BCVWP) => findWord(src.corpora, wordReference))
            .filter((word) => !!word)
            .map((word) => word!.text.toLowerCase()),
          _.isEqual
        );

        const alignedWordsString = uniqueAlignedWords.sort().join(',');

        if (!accumulator[alignedWordsString]) {
          accumulator[alignedWordsString] = [];
        }

        accumulator[alignedWordsString].push(singleAlignment);
        return accumulator;
      }, {} as { [key: string]: Link[] });
    })
    ?.reduce((accumulator, linkMap) => {
      Object.keys(linkMap)
        .filter((key) => !!linkMap[key] && Array.isArray(linkMap[key]))
        .forEach((key) => {
          if (!accumulator[key]) {
            accumulator[key] = linkMap[key];
          } else {
            linkMap[key].forEach((link) => accumulator[key].push(link));
          }
        });
      return accumulator;
    }, {} as NormalizedTextToAlignmentLink);
