import PouchDB from 'pouchdb';

/**
 * intended to provide a single place to keep track of
 * PouchDB "tables" (databases)
 */
export interface AppState {
  linksTable?: PouchDB.Database;
}
