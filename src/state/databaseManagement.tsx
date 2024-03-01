import { VirtualTableLinks } from './links/tableManager';
import { WordsIndex } from './links/wordsIndex';
import { UserPreferenceTable } from './preferences/tableManager';

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
  linksTable?: VirtualTableLinks;
  userPreferences?: UserPreferenceTable;
  linksIndexes?: {
    sourcesIndex: WordsIndex;
    targetsIndex: WordsIndex;
  }
}

export type SecondaryIndex<T> = {
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
  onChange(type: IndexedChangeType, payload: T, suppressLastUpdate?: boolean): Promise<void>;

  isLoading(): boolean;
}

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

  protected constructor() {
    this.lastUpdate = Date.now();
    this.secondaryIndexes = new Set();
  }

  /**
   * register a secondary index
   * @param index
   */
  registerSecondaryIndex = async (index: SecondaryIndex<T>): Promise<void> => {
    await this.catchupNewIndex(index);
    this.secondaryIndexes.add(index);
  };

  /**
   * unregister a secondary index
   * @param index
   */
  unregisterSecondaryIndex = async (index: SecondaryIndex<T>): Promise<void> => {
    this.secondaryIndexes.delete(index);
  }

  findSecondaryIndexByIdentifier = (id: string): SecondaryIndex<T>|undefined => {
    return [...this.secondaryIndexes.values()].find(idx => idx.id() === id);
  }

  /**
   * internal function to be called when performing a mutating operation
   * @param suppressOnUpdate
   */
  _onUpdate = (suppressOnUpdate?: boolean) => {
    if (!suppressOnUpdate) {
      this.lastUpdate = Date.now();
    }
  };

  _updateSecondaryIndices = async (type: IndexedChangeType, payload: T): Promise<void> => {
    const indexingPromises: Promise<void>[] = [];
    for(const index of [...this.secondaryIndexes.values()]) {
      indexingPromises.push(index.onChange(type, payload));
    }

    await Promise.all(indexingPromises);
  }

  /**
   * implement this function to catch up newly registered indexes to the current table state
   * @param index
   */
  abstract catchupNewIndex(index: SecondaryIndex<T>): Promise<void>;
}

// Table factories
