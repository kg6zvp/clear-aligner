import { AlignmentSide, CorpusContainer, Link } from '../../structs';
import { PivotWord } from '../../features/concordanceView/structs';
import { findWordByString } from '../../helpers/findWord';
import { IndexedChangeType, SecondaryIndex } from '../databaseManagement';
import _ from 'lodash';
import Queue from 'queue-promise';

export class WordsIndex implements SecondaryIndex<Link> {
  container: CorpusContainer;
  side: AlignmentSide;
  pivotWords: Map<string, PivotWord>;
  linkIdsToPivotWordNormalizedTexts: Map<string, string[]>;
  lastUpdate: number;
  loading: boolean;
  indexingTasks: Queue;

  constructor(container: CorpusContainer, side: AlignmentSide) {
    this.container = container;
    this.side = side;
    this.pivotWords = new Map<string, PivotWord>();
    this.linkIdsToPivotWordNormalizedTexts = new Map<string, string[]>();
    this.lastUpdate = 0;
    this.loading = false;

    this.indexingTasks = new Queue({
      concurrent: 1,
      interval: 10
    });
    this.indexingTasks.on('start', () => {
      this.loading = true;
    });
    this.indexingTasks.on('end', () => {
      this.loading = false;
      this.lastUpdate = Date.now().valueOf();
    });
  }

  isLoading = (): boolean => {
    return this.loading;
  };

  initialize = async (): Promise<void> => {
    //this.pivotWords = await generatePivotWordsList(this.container, this.side);
  };

  waitForTasksToFinish = async (): Promise<void> => {
    while (this.loading) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  getPivotWords = (): PivotWord[] => Array.from(this.pivotWords.values());

  id = (): string => {
    return this.side;
  };

  onChange = async (type: IndexedChangeType, payload: Link, suppressLastUpdate?: boolean): Promise<void> => {
    setTimeout(async () => {
      switch (type) {
        case IndexedChangeType.SAVE:
          await this._indexSave(payload);
          break;
        case IndexedChangeType.REMOVE:
          await this._indexRemove(payload);
          break;
      }
      if (!suppressLastUpdate) {
        this.lastUpdate = Date.now().valueOf();
      }
    }, 5);
  };

  _indexSave = async (payload: Link): Promise<void> => {
    if (!payload.id) return;
    const pivotWordNormalizedTexts = (this.side === AlignmentSide.SOURCE ? payload.sources : payload.targets)
      .map((bcvId) => findWordByString(this.container.corpora, bcvId)?.text.trim().toLowerCase())
      .filter((text) => !!text) as string[];
    this.linkIdsToPivotWordNormalizedTexts.set(payload.id, _.uniqWith(pivotWordNormalizedTexts, _.isEqual));
    for (const normalizedText of pivotWordNormalizedTexts) {
      const pivotWord = this.pivotWords.get(normalizedText);
      if (!pivotWord) break;
      /*if (!pivotWord.alignmentLinks) {
        pivotWord.alignmentLinks = [];
      }
      pivotWord.alignmentLinks.push(payload);
      if (pivotWord.alignedWords) {
        delete pivotWord.alignedWords;
      }
      pivotWord.hasAlignmentLinks = (pivotWord.alignmentLinks.length > 0); //*/
    }
  };

  _indexRemove = async (payload: Link): Promise<void> => {
    if (!payload.id) return;
    const pivotWordNormalizedTexts = this.linkIdsToPivotWordNormalizedTexts.get(payload.id);
    if (!pivotWordNormalizedTexts) return;
    for (const normalizedText of pivotWordNormalizedTexts) {
      const pivotWord = this.pivotWords.get(normalizedText);
      if (!pivotWord) break;
      /*if (pivotWord.alignmentLinks) {
        // remove the link from the list
        _.remove(pivotWord.alignmentLinks, (link) => link.id === payload.id);
        pivotWord.hasAlignmentLinks = (pivotWord.alignmentLinks.length > 0);
      }
      if (pivotWord.alignedWords) {
        _.remove(pivotWord.alignedWords, (alignedWord) => {
          if (!alignedWord.alignments) return true; // remove because this word has no alignments
          _.remove(alignedWord.alignments, (link) => link.id === payload.id);
          alignedWord.frequency = alignedWord.alignments.length;
          return (alignedWord.alignments.length < 1); // remove alignedWord if it has no links
        });
      } //*/
    }
    this.linkIdsToPivotWordNormalizedTexts.delete(payload.id);
  };
}
