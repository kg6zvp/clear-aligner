/* eslint-disable no-restricted-syntax */
import { VirtualTableLinks } from './links/tableManager';

/**
 * intended to provide a single place to keep track of
 * PouchDB "tables" (databases)
 */
export interface ProjectState {
  linksTable?: VirtualTableLinks;
}

// Table factories

