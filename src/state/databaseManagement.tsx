import { LinksTable } from './links/tableManager';
import { WordsIndex } from './links/wordsIndex';
import { UserPreferenceTable } from './preferences/tableManager';
import { ProjectTable } from './projects/tableManager';
import _ from 'lodash';

/**
 * denotes the type of change being made to a database
 */
export enum IndexedChangeType {
  SAVE,
  REMOVE
}

/**
 * intended to provide a single place to keep track of
 * PouchDB "tables" (databases)
 */
export interface ProjectState {
  linksTable: LinksTable;
  projectTable: ProjectTable;
  userPreferenceTable: UserPreferenceTable;
  linksIndexes?: {
    sourcesIndex: WordsIndex;
    targetsIndex: WordsIndex;
  };
}

export type SecondaryIndex<Link> = {
  /**
   * unique identifier
   */
  id(): string;
  /**
   * receive change action
   * @param type change type
   * @param payload item being removed or added
   * @param suppressLastUpdate don't update the last updated time during this indexing operation (used for bulk operations)
   */
  onChange(type: IndexedChangeType, payload: Link, suppressLastUpdate?: boolean): Promise<void>;

  isLoading(): boolean;
}

const DatabaseWaitInMs = 1_000;

export interface DatabaseLoadState {
  isLoaded: boolean,
  isLoading: boolean
}

export interface DatabaseBusyInfo {
  isBusy?: boolean,
  userText?: string,
  progressCtr?: number,
  progressMax?: number,
}

export interface DatabaseStatus {
  busyInfo: DatabaseBusyInfo,
  databaseLoadState: DatabaseLoadState,
  lastUpdateTime?: number,
}

export const InitialDatabaseStatus = {
  busyInfo: { isBusy: false, progressCtr: 0, progressMax: 0 },
  databaseLoadState: { isLoaded: false, isLoading: false }
} as DatabaseStatus;


/**
 * intended to provide functionality common to any virtual table
 *
 * A virtual table will be implemented to support storing data across one or more pouchdb databases and should provide a
 * higher level abstraction that allows the application code to interface directly with the objects that it consumes
 * or produces without performing any pre- or post-processing
 */
export abstract class VirtualTable<T> {
  lastUpdate: number;
  secondaryIndexes: Set<SecondaryIndex<T>>;
  readonly databaseStatus: DatabaseStatus;
  databaseBusyCtr = 0;
  readonly isLoggingTime = true;

  protected constructor() {
    this.lastUpdate = Date.now();
    this.secondaryIndexes = new Set();
    this.databaseStatus = { ..._.cloneDeep(InitialDatabaseStatus) };
  }

  getDatabaseStatus = (): DatabaseStatus => ({
    ..._.cloneDeep(this.databaseStatus)
  });

  isDatabaseBusy = () => this.databaseBusyCtr > 0;

  incrDatabaseBusyCtr = () => this.updateDatabaseBusyCtr(+1);

  decrDatabaseBusyCtr = () => this.updateDatabaseBusyCtr(-1);

  updateDatabaseBusyCtr = (ctrDelta: number) => {
    const busyInfo = this.databaseStatus.busyInfo;
    const wasBusy = busyInfo.isBusy;
    this.databaseBusyCtr = Math.max(this.databaseBusyCtr + ctrDelta, 0);
    busyInfo.isBusy = this.databaseBusyCtr > 0;
    if (wasBusy && !busyInfo.isBusy) {
      busyInfo.userText = undefined;
      busyInfo.progressCtr = 0;
      busyInfo.progressMax = 0;
    }
  };

  /**
   * Checks to see if the database is loaded and,
   * if not, loads it.
   *
   * Returns true if the database was loaded in this step,
   * false otherwise.
   */
  public checkDatabase = async (): Promise<boolean> => {
    const loadState = this.databaseStatus.databaseLoadState;
    if (loadState.isLoading) {
      await this.waitForDatabase();
    }
    if (loadState.isLoaded) return false;

    this.logDatabaseTime('checkDatabase(): loading');
    loadState.isLoading = true;
    try {
      // @ts-ignore
      await window.databaseApi.createDataSource(this.sourceName ?? DefaultProjectName);
      loadState.isLoaded = true;

      return true;
    } catch (ex) {
      console.error('error checking database', ex);
      return false;
    } finally {
      loadState.isLoading = false;
      this.logDatabaseTimeEnd('checkDatabase(): loading');
    }
  };

  waitForDatabase = async () => {
    while (this.databaseStatus.databaseLoadState.isLoading) {
      await new Promise(resolve => window.setTimeout(resolve, DatabaseWaitInMs));
    }
  };

  logDatabaseTime = (label: string) => {
    if (this.isLoggingTime) {
      console.time(label);
    }
  };

  logDatabaseTimeLog = (label: string, ...args: any[]) => {
    if (this.isLoggingTime) {
      console.timeLog(label, ...args);
    }
  };

  logDatabaseTimeEnd = (label: string) => {
    if (this.isLoggingTime) {
      console.timeEnd(label);
    }
  };

  /**
   * register a secondary index
   * @param index
   */
  registerSecondaryIndex = async (index: SecondaryIndex<T>): Promise<void> => {
    await this.catchUpIndex(index);
    this.secondaryIndexes.add(index);
  };

  /**
   * unregister a secondary index
   * @param index
   */
  unregisterSecondaryIndex = async (index: SecondaryIndex<T>): Promise<void> => {
    this.secondaryIndexes.delete(index);
  };

  /**
   * whether the given index has already been registered
   * @param secondaryIndex
   */
  isSecondaryIndexRegistered = (secondaryIndex: SecondaryIndex<T>): boolean =>
    !!this.findSecondaryIndexByIdentifier(secondaryIndex.id());

  findSecondaryIndexByIdentifier = (id: string): SecondaryIndex<T> | undefined => {
    return [...this.secondaryIndexes.values()].find(idx => idx.id() === id);
  };

  /**
   * internal function to be called when performing a mutating operation
   * @param suppressOnUpdate
   */
  protected _onUpdate = async (suppressOnUpdate = false) => {
    if (!suppressOnUpdate) {
      this.lastUpdate = Date.now();
    }
    await this._onUpdateImpl(suppressOnUpdate);
  };

  protected _onUpdateImpl = async (suppressOnUpdate = false) => {
  };

  _updateSecondaryIndices = async (type: IndexedChangeType, payload: T): Promise<void> => {
    const indexingPromises: Promise<void>[] = [];
    for (const index of [...this.secondaryIndexes.values()]) {
      indexingPromises.push(index.onChange(type, payload));
    }

    await Promise.all(indexingPromises);
  };

  /**
   * catches up all registered indexes.
   */
  catchUpAllIndexes = async (): Promise<void> => {
    const promises = [];
    for (const index of [...this.secondaryIndexes.values()]) {
      promises.push(this.catchUpIndex(index));
    }
    await Promise.all(promises);
  };

  /**
   * implement this function to catch up newly registered indexes to the current table state
   * @param index
   */
  abstract catchUpIndex(index: SecondaryIndex<T>): Promise<void>;
}

// Table factories
