/* eslint-disable no-restricted-syntax */
import PouchDB from 'pouchdb';
import {
  LinksIndexDocs, SourceBookIndex,
  SourceChapterIndex, SourcesIndex, SourceVerseIndex, TargetBookIndex,
  TargetChapterIndex, TargetVerseIndex
} from './linksIndexes';

/**
 * intended to provide a single place to keep track of
 * PouchDB "tables" (databases)
 */
export interface ProjectState {
  linksTable?: PouchDB.Database;
}

// Table factories

/**
 * create links table with all necessary indexes
 */
export const createTableLinks = () => {
  const linksTable = new PouchDB('links');

  // create indices
  LinksIndexDocs
    .forEach((index) => void linksTable.put(index));

  return linksTable;
}

/**
 * trigger a re-index for data in the links table
 * @param linksTable
 */
export const reindexTableLinks = async (linksTable: PouchDB.Database) => {
  await linksTable.query(SourcesIndex, { stale: 'update_after' });
  await linksTable.query(SourceBookIndex, { stale: 'update_after' });
  await linksTable.query(SourceChapterIndex, { stale: 'update_after' });
  await linksTable.query(SourceVerseIndex, { stale: 'update_after' });

  await linksTable.query(TargetBookIndex, { stale: 'update_after' });
  await linksTable.query(TargetChapterIndex, { stale: 'update_after' });
  await linksTable.query(TargetVerseIndex, { stale: 'update_after' });

  return linksTable.viewCleanup();
}
