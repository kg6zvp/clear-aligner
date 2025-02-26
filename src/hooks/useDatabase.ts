/**
 * This file contains the useDatabase hook, which returns the collection of
 * APIs to the database.
 */
import {
  Corpus,
  CreateBulkJournalEntryParams,
  DeleteByIdParams,
  DeleteParams,
  InsertParams,
  LanguageInfo,
  Link,
  SaveParams, Word
} from '../structs';
import { PivotWordFilter } from '../features/concordanceView/concordanceView';
import { GridSortItem } from '@mui/x-data-grid';
import { useMemo } from 'react';
import { UserPreferenceDto } from '../state/preferences/tableManager';
import { ProjectEntity } from '../common/data/project/project';
import { JournalEntryDTO } from '../common/data/journalEntryDTO';
import { AlignmentSide } from '../common/data/project/corpus';

export interface ListedProjectDto {
  id: string;
  corpora: Corpus[]
}

export interface DatabaseApi {
  getPreferences: (requery: boolean) => Promise<UserPreferenceDto|undefined>;
  createOrUpdatePreferences: (preferences: UserPreferenceDto) => Promise<void>;
  createBulkInsertJournalEntry: ({ projectId, links }: CreateBulkJournalEntryParams) => Promise<void>;
  /**
   * Get the first chunk of journal entries sorted by date
   * @param sourceName source to retrieve journal entries for
   */
  getFirstJournalEntryUploadChunk: (sourceName: string) => Promise<JournalEntryDTO[]>;
  getAllJournalEntries: (projectId: string, itemLimit?: number, itemSkip?: number) => Promise<JournalEntryDTO[]>;
  getCount: (sourceName: string, tableName: string) => Promise<number>;
  getDataSources: () => Promise<ListedProjectDto[]|undefined>;
  getProjects: () => Promise<ProjectEntity[]|undefined>;
  projectSave: (project: ProjectEntity) => Promise<ProjectEntity>;
  corporaGetPivotWords: (sourceName: string, side: AlignmentSide, filter: PivotWordFilter, sort: GridSortItem | null) => Promise<{
    t: string, // normalized text
    l: string, // language id
    c: number  // frequency
  }[]>;
  corporaGetAlignedWordsByPivotWord: (sourceName: string, side: AlignmentSide, normalizedText: string, sort?: GridSortItem | null) => Promise<{
    t: string, // normalized text (pivot word)
    sl: string, // sources text language id
    st: string, // sources text
    tl: string, // targets text language id
    tt: string, // targets text
    c: number // frequency
  }[]>;
  removeTargetWordsOrParts: (sourceName: string) => Promise<void>;
  insert: <T,>({ projectId, table, itemOrItems, chunkSize, disableJournaling }: InsertParams<T>) => Promise<boolean>;
  deleteAll: ({ projectId, table }: DeleteParams) => Promise<boolean>;
  deleteByIds: ({ projectId, table, itemIdOrIds, disableJournaling }: DeleteByIdParams) => Promise<boolean>;
  /**
   * Persist/update an entity (or entities) in a database
   * @param projectId datasource name to be accessed
   * @param table table to save into
   * @param itemOrItems entities to persist
   */
  save: <T,>({ projectId, table, itemOrItems, disableJournaling }: SaveParams<T>) => Promise<boolean>;
  getAll: <T,>(sourceName: string, table: string, itemLimit?: number, itemSkip?: number) => Promise<T[]>;
  /**
   * Call to trigger an update to the `sources_text` and `targets_text` fields
   * in the `links` table
   * @param sourceName datasource to be accessed
   * @param linkIdOrIds links for which to update the text fields
   */
  updateLinkText: (sourceName: string, linkIdOrIds: string|string[]) => Promise<boolean|any[]>;
  updateAllLinkText: (sourceName: string) => Promise<boolean>;
  corporaGetLinksByAlignedWord: (sourceName: string, sourcesText: string, targetsText: string, sort?: GridSortItem | null) => Promise<Link[]>;
  findByIds: <T,K>(sourceName: string, table: string, ids: K[]) => Promise<T[]|undefined>;
  findLinksByBCV: (sourceName: string, side: AlignmentSide, bookNum: number, chapterNum: number, verseNum: number) => Promise<Link[]>;
  findLinksByWordId: (sourceName: string, side: AlignmentSide, referenceString: string) => Promise<Link[]>;
  languageGetAll: (sourceName: string) => Promise<LanguageInfo[]>;
  languageFindByIds: (sourceName: string, languageIds: string[]) => Promise<LanguageInfo[]>;
  getAllWordsByCorpus: (sourceName: string, linkSide: AlignmentSide, corpusId: string, wordLimit: number, wordSkip: number) => Promise<Word[]>;
  /**
   * Turns off flag indicating corpora have been updated since last sync
   * @param projectId
   */
  toggleCorporaUpdatedFlagOff: (projectId: string) => Promise<void>;
}

export const useDatabase = (): DatabaseApi => {
  // @ts-ignore
  const dbDelegate = useMemo(() => window.databaseApi, []);
  return dbDelegate as DatabaseApi;
}
