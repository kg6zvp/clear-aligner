import { AlignmentSide, BookStats, Link, Project } from '../../structs';
import BCVWP from '../../features/bcvwp/BCVWPSupport';
import { IndexedChangeType, SecondaryIndex, VirtualTable } from '../databaseManagement';
import uuid from 'uuid-random';
import _ from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../App';
import { AlignmentFile, AlignmentRecord } from '../../structs/alignmentFile';
import books from '../../workbench/books';

const DatabaseChunkSize = 10_000;
const IndexChunkSize = 100;
const DatbaseStatusRefreshTimeInMs = 500;
const DatabaseWaitInMs = 1_000;
const EmptyWordId = '00000000000';
const DefaultProjectName = 'default';
const LinkTableName = 'link';
const ProjectTableName = 'project';
const LogDatabaseHooks = true;

export interface DatabaseLoadState {
  isLoaded: boolean,
  isLoading: boolean
}

export interface TableLoadState extends DatabaseLoadState {
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
  projectTableLoadState: TableLoadState,
  linkTableLoadState: TableLoadState,
  lastUpdateTime?: number,
}

const InitialDatabaseStatus = {
  busyInfo: { isBusy: false, progressCtr: 0, progressMax: 0 },
  databaseLoadState: { isLoaded: false, isLoading: false },
  projectTableLoadState: { isLoaded: false, isLoading: false },
  linkTableLoadState: { isLoaded: false, isLoading: false }
} as DatabaseStatus;

export class LinksTable extends VirtualTable<Link> {
  private readonly isLoggingTime = true;
  private readonly linksMap: Map<string, Link>;
  private readonly sourcesMap: Map<string, string[]>;
  private readonly targetsMap: Map<string, string[]>;
  private readonly linksByBookMap: Map<number, number>;
  private readonly databaseStatus: DatabaseStatus;
  private databaseBusyCtr = 0;

  constructor() {
    super();
    this.linksMap = new Map<string, Link>();
    this.sourcesMap = new Map<string, string[]>(); // links a normalized BCVWP reference string to a set of link id strings
    this.targetsMap = new Map<string, string[]>(); // links a normalized BCVWP reference string to a set of link id strings
    this.linksByBookMap = new Map<number, number>();
    this.databaseStatus = { ..._.cloneDeep(InitialDatabaseStatus) };
  }

  save = async (link: Link, suppressOnUpdate = false, isForced = false): Promise<Link | undefined> => {
    if (!isForced && this._isDatabaseBusy()) {
      return;
    }

    this._logDatabaseTime('save()');
    this._incrDatabaseBusyCtr();
    try {
      await this.remove(link.id, true);

      const newLink: Link = {
        id: link.id ?? uuid(),
        sources: link.sources.map(BCVWP.sanitize),
        targets: link.targets.map(BCVWP.sanitize)
      };

      this.linksMap.set(newLink.id!, newLink);
      this._addLinkIndex(newLink);
      void this._updateSecondaryIndices(IndexedChangeType.SAVE, newLink);

      await this.checkLinkTable();
      // @ts-ignore
      await window.databaseApi.save(LinkTableName, newLink);
      await this._saveDefaultProject();

      return newLink;
    } catch (e) {
      return undefined;
    } finally {
      this._onUpdate(suppressOnUpdate);
    }
  };

  exists = (id?: string): boolean => {
    if (!id) return false;
    return this.linksMap.has(id);
  };

  removeAll = async (suppressOnUpdate = false, isForced = false) => {
    if (!isForced && this._isDatabaseBusy()) {
      return;
    }

    this._logDatabaseTime('removeAll()');
    this._incrDatabaseBusyCtr();
    this.databaseStatus.busyInfo.userText = 'Removing old links...';
    try {
      this.sourcesMap.clear();
      this.targetsMap.clear();
      this.linksMap.clear();
      this.linksByBookMap.clear();

      await this.checkLinkTable();
      // @ts-ignore
      await window.databaseApi.deleteAll(LinkTableName);
      await this._saveDefaultProject();

      if (!suppressOnUpdate) {
        void this.catchUpAllIndexes();
      }
      this._onUpdate(suppressOnUpdate);
    } catch (ex) {
      console.error('error removing all links', ex);
    } finally {
      this._decrDatabaseBusyCtr();
      this._logDatabaseTimeEnd('removeAll()');
    }
  };

  saveAlignmentFile = async (alignmentFile: AlignmentFile,
                             suppressOnUpdate = false,
                             isForced = false) =>
    await this.saveAll(alignmentFile.records.map(
      record =>
        ({
          id: LinksTable.createAlignmentRecordId(record),
          sources: record.source,
          targets: record.target
        } as Link)
    ), suppressOnUpdate, isForced);

  saveAll = async (inputLinks: Link[],
                   suppressOnUpdate = false,
                   isForced = false) => {
    // reentry is possible because everything is
    // done in chunks with promises
    if (!isForced && this._isDatabaseBusy()) {
      return [] as Link[];
    }

    this._logDatabaseTime('saveAllLinks(): complete');
    this._incrDatabaseBusyCtr();
    this.databaseStatus.busyInfo.userText = `Importing ${inputLinks.length.toLocaleString()} links...`;
    try {
      await this.removeAll(true, true);
      await this.checkLinkTable();

      this.databaseStatus.busyInfo.userText = `Sorting ${inputLinks.length.toLocaleString()} links...`;
      this._logDatabaseTime('saveAllLinks(): sorted');
      const outputLinks = inputLinks.map(link =>
        ({
          id: link.id ?? LinksTable.createLinkId(link),
          sources: link.sources.map(BCVWP.sanitize),
          targets: link.targets.map(BCVWP.sanitize)
        } as Link));
      outputLinks.sort((l1, l2) =>
        (l1.id ?? EmptyWordId)
          .localeCompare(l2.id ?? EmptyWordId));
      this._logDatabaseTimeEnd('saveAllLinks(): sorted');

      this._logDatabaseTime('saveAllLinks(): saved');
      const busyInfo = this.databaseStatus.busyInfo;
      busyInfo.userText = `Saving ${outputLinks.length.toLocaleString()} links...`;
      busyInfo.progressCtr = 0;
      busyInfo.progressMax = outputLinks.length;
      for (const chunk of _.chunk(outputLinks, DatabaseChunkSize)) {
        // @ts-ignore
        await window.databaseApi.insert(LinkTableName, chunk);
        chunk.forEach(outputLink => this._addLinkIndex(outputLink));
        busyInfo.progressCtr += chunk.length;

        const fromLinkTitle = LinksTable.createLinkTitle(chunk[0]);
        const toLinkTitle = LinksTable.createLinkTitle(chunk[chunk.length - 1]);
        busyInfo.userText = chunk.length === busyInfo.progressMax
          ? `Saved ${fromLinkTitle} to ${toLinkTitle} (${busyInfo.progressCtr.toLocaleString()} links)...`
          : `Saved ${fromLinkTitle} to ${toLinkTitle} (${busyInfo.progressCtr.toLocaleString()} of ${busyInfo.progressMax.toLocaleString()} links)...`;

        this._logDatabaseTimeLog('saveAllLinks(): saved', busyInfo.progressCtr, busyInfo.progressMax);
      }
      this._logDatabaseTimeEnd('saveAllLinks(): saved');

      busyInfo.userText = `Saving project...`;
      await this._saveDefaultProject();

      if (!suppressOnUpdate) {
        void this.catchUpAllIndexes();
      }
      this._onUpdate(suppressOnUpdate);
      return outputLinks;
    } catch (ex) {
      console.error('error saving all links', ex);
    } finally {
      this._decrDatabaseBusyCtr();
      this._logDatabaseTimeEnd('saveAllLinks(): complete');
    }
  };

  /**
   * check if the given word has a link
   * @param side
   * @param wordId
   */
  hasLinkByWord = (side: AlignmentSide, wordId: BCVWP): boolean => {
    const refString = wordId.toReferenceString();
    switch (side) {
      case AlignmentSide.SOURCE:
        return (this.sourcesMap.get(refString) ?? []).length > 0;
      case AlignmentSide.TARGET:
        return (this.targetsMap.get(refString) ?? []).length > 0;
      default:
        return false;
    }
  };

  findLinkIdsByWord = (side: AlignmentSide, wordId: BCVWP): string[] => {
    const refString = wordId.toReferenceString();
    switch (side) {
      case AlignmentSide.SOURCE:
        return this.sourcesMap.get(refString) ?? [];
      case AlignmentSide.TARGET:
        return this.targetsMap.get(refString) ?? [];
      default:
        return [];
    }
  };

  findByWord = (side: AlignmentSide, wordId: BCVWP): Link[] =>
    this.findLinkIdsByWord(side, wordId)
      .map(this.get)
      .filter(v => !!v) as Link[];

  getAll = (): Link[] => Array.from(this.linksMap.values());

  get = (id?: string): Link | undefined => {
    if (!id) return undefined;
    return this.linksMap.get(id);
  };

  remove = async (id?: string, suppressOnUpdate = false, isForced = false) => {
    if (!isForced && this._isDatabaseBusy()) {
      return;
    }

    this._logDatabaseTime('remove()');
    this._incrDatabaseBusyCtr();
    try {
      const oldLink = this.linksMap.get(id!);
      if (!oldLink) return;

      void this._updateSecondaryIndices(IndexedChangeType.REMOVE, oldLink);
      this._removeLinkIndex(oldLink);
      this.linksMap.delete(oldLink.id ?? '');

      await this.checkLinkTable();
      // @ts-ignore
      await window.databaseApi.deleteByIds(LinkTableName, oldLink.id ?? '');
      await this._saveDefaultProject();

      this._onUpdate(suppressOnUpdate);
    } finally {
      this._decrDatabaseBusyCtr();
      this._logDatabaseTimeEnd('remove()');
    }
  };

  protected override _onUpdateImpl = (suppressOnUpdate?: boolean) => {
    this.databaseStatus.lastUpdateTime = this.lastUpdate;
  };

  catchUpIndex = async (index: SecondaryIndex<Link>): Promise<void> => {
    const indicesPromises: Promise<void>[] = [];
    for (const chunk of _.chunk(Array.from(this.linksMap.values()), IndexChunkSize)) {
      indicesPromises.push(new Promise<void>(resolve =>
        setTimeout(() => {
          chunk.forEach(link =>
            index.onChange(IndexedChangeType.SAVE, link, true));
          resolve();
        }, 3)));
    }
    await Promise.all(indicesPromises);
  };

  getDatabaseStatus = (): DatabaseStatus => ({
    ..._.cloneDeep(this.databaseStatus)
  });

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
      await this._waitForDatabase();
    }
    if (loadState.isLoaded) return false;

    this._logDatabaseTime('checkDatabase(): loading');
    loadState.isLoading = true;
    try {
      // @ts-ignore
      await window.databaseApi.createDataSource();
      loadState.isLoaded = true;

      return true;
    } finally {
      loadState.isLoading = false;
      this._logDatabaseTimeEnd('checkDatabase(): loading');
    }
  };

  /**
   * Checks to see if the link table is loaded and,
   * if not, loads it.
   *
   * Returns true if the link table was loaded in this step,
   * false otherwise.
   */
  public checkLinkTable = async (): Promise<boolean> => {
    if (!this._quickCheckDatabase()) {
      await this.checkDatabase();
    }
    const loadState = this.databaseStatus.linkTableLoadState;
    if (loadState.isLoading) {
      await this._waitForLinkTable();
    }
    if (loadState.isLoaded) {
      return false;
    }

    this._logDatabaseTime('checkLinkTable(): loading');
    loadState.isLoading = true;
    try {
      await this.checkProjectTable();
      await this._rebuildLinkMaps();

      loadState.isLoaded = true;
    } finally {
      loadState.isLoading = false;
      this._logDatabaseTimeEnd('checkLinkTable(): loading');
    }

    return true;
  };

  /**
   * Checks to see if the links DB has been created without using a promise.
   * Does not guarantee the database is not in the process of being created.
   */
  private _quickCheckDatabase = () => this.databaseStatus.databaseLoadState.isLoaded;

  /**
   * Checks to see if the project table is loaded and,
   * if not, loads it.
   *
   * Returns true if the project table was loaded in this step,
   * false otherwise.
   */
  public checkProjectTable = async () => {
    if (!this._quickCheckDatabase()) {
      await this.checkDatabase();
    }
    const loadState = this.databaseStatus.projectTableLoadState;
    if (loadState.isLoading) {
      await this._waitForProjectTable();
    }
    if (loadState.isLoaded) {
      return false;
    }

    this._logDatabaseTime('checkProjectTable(): loading');
    loadState.isLoading = true;
    try {
      await this._loadDefaultProject();
      loadState.isLoaded = true;
    } finally {
      loadState.isLoading = false;
      this._logDatabaseTimeEnd('checkProjectTable(): loading');
    }

    return true;
  };

  checkUserTable = async () => {
    if (!this._quickCheckDatabase()) {
      await this.checkDatabase();
    }
  };

  /**
   * Checks to see if the database and all tables are loaded and
   * if not, loads it.
   *
   * Returns true if the database or any table was loaded in this step,
   * false otherwise.
   */
  public checkAllTables = async () => {
    this._logDatabaseTime('checkAllTables(): loading');
    try {
      const databaseResult = await this.checkDatabase();
      const linkTableResult = await this.checkLinkTable();
      const projectTableResult = await this.checkProjectTable();
      const userTableResult = await this.checkUserTable();
      return databaseResult || linkTableResult || projectTableResult || userTableResult;
    } finally {
      this._logDatabaseTimeEnd('checkAllTables(): loading');
    }
  };

  private _saveDefaultProject = async () => {
    this._logDatabaseTime('_saveDefaultProject()');
    try {
      const defaultProject = {
        id: DefaultProjectName,
        bookStats: Array.from(this.linksByBookMap)
          .map(([key, value]) =>
            ({
              bookNum: key,
              linkCtr: value
            } as BookStats))
      } as Project;

      // @ts-ignore
      await window.databaseApi.save(ProjectTableName, defaultProject);
      return defaultProject;
    } finally {
      this._logDatabaseTimeEnd('_saveDefaultProject()');
    }
  };

  private _loadDefaultProject = async () => {
    this._logDatabaseTime('_loadDefaultProject()');
    try {
      // @ts-ignore
      const defaultProject = await window.databaseApi.findOneById(ProjectTableName, DefaultProjectName)
        ?? await this._saveDefaultProject();

      this.linksByBookMap.clear();
      ((defaultProject.bookStats ?? []) as BookStats[])
        .forEach(bookStats =>
          this.linksByBookMap.set(bookStats.bookNum, bookStats.linkCtr));

      return defaultProject;
    } finally {
      this._logDatabaseTimeEnd('_loadDefaultProject()');
    }
  };

  private _isDatabaseBusy = () => this.databaseBusyCtr > 0;

  private _incrDatabaseBusyCtr = () => {
    this._updateDatabaseBusyCtr(+1);
  };

  private _decrDatabaseBusyCtr = () => {
    this._updateDatabaseBusyCtr(-1);
  };

  private _updateDatabaseBusyCtr = (ctrDelta: number) => {
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

  private _rebuildLinkMaps = async (suppressOnUpdate = false, isForced = false) => {
    if (!isForced && this._isDatabaseBusy()) {
      return;
    }

    this._logDatabaseTime('_rebuildLinkMaps(): indexing');
    this._incrDatabaseBusyCtr();
    this.databaseStatus.busyInfo.userText = 'Loading the database...';
    try {
      this.sourcesMap.clear();
      this.targetsMap.clear();
      this.linksMap.clear();

      const oldLinksByBookMap = new Map<number, number>(this.linksByBookMap);
      this.linksByBookMap.clear();

      this._logDatabaseTimeLog('_rebuildLinkMaps(): indexing', oldLinksByBookMap);
      const busyInfo = this.databaseStatus.busyInfo;
      busyInfo.progressCtr = 0;
      busyInfo.progressMax = oldLinksByBookMap.size;
      for (const [bookNum, linkCtr] of oldLinksByBookMap.entries()) {
        busyInfo.progressCtr++;
        if (linkCtr < 1) {
          continue;
        }

        busyInfo.userText = `Loading ${books[bookNum - 1].ParaText} (${busyInfo.progressCtr} of ${busyInfo.progressMax} books)...`;
        const keyPrefix = `00${bookNum}`.slice(-2);
        const fromId = `${keyPrefix}000000000-00000000-0000-0000-0000-000000000000`;
        const toId = `${keyPrefix}999999999-ffffffff-ffff-ffff-ffff-ffffffffffff`;

        // @ts-ignore
        const bookLinks = await window.databaseApi.findBetweenIds(LinkTableName, fromId, toId) as Link[];
        bookLinks.forEach(link => {
          this.linksMap.set(link?.id ?? '', link);
          this._addLinkIndex(link as Link);
        });

        this._logDatabaseTimeLog('_rebuildLinkMaps(): indexing', fromId, toId, bookLinks.length);
      }
    } finally {
      this._onUpdate(suppressOnUpdate);
      this._decrDatabaseBusyCtr();
      this._logDatabaseTimeEnd('_rebuildLinkMaps(): indexing');
    }
  };

  private _waitForDatabase = async () => {
    while (this.databaseStatus.databaseLoadState.isLoading) {
      await new Promise(resolve => window.setTimeout(resolve, DatabaseWaitInMs));
    }
  };

  private _waitForLinkTable = async () => {
    while (this.databaseStatus.linkTableLoadState.isLoading) {
      await new Promise(resolve => window.setTimeout(resolve, DatabaseWaitInMs));
    }
  };

  private _waitForProjectTable = async () => {
    while (this.databaseStatus.projectTableLoadState.isLoading) {
      await new Promise(resolve => window.setTimeout(resolve, DatabaseWaitInMs));
    }
  };

  /**
   * perform indexing on the given link
   * @param link
   */
  private _addLinkIndex = (link: Link) => {
    if (!link.id) {
      throw new Error('Cannot index link without an id!');
    }
    // index sources
    link.sources.map(BCVWP.sanitize).forEach(sourceId => {
      const linksOnSource = this.sourcesMap.get(sourceId) ?? [];
      if (linksOnSource.includes(link.id!)) {
        return;
      }

      linksOnSource.push(link.id!);
      this.sourcesMap.set(sourceId, linksOnSource);
    });

    // index targets
    link.targets.map(BCVWP.sanitize).forEach(targetId => {
      const linksOnTarget = this.targetsMap.get(targetId) ?? [];
      if (linksOnTarget.includes(link.id!)) {
        return;
      }

      linksOnTarget.push(link.id!);
      this.targetsMap.set(targetId, linksOnTarget);

      this._updateBookCtr(Number(targetId.substring(0, 2)), +1);
    });
  };

  /**
   * remove the indexes created for a given link
   * @param link
   */
  private _removeLinkIndex = (link?: Link) => {
    if (!link || !link.id) return;

    link.sources.forEach(sourceId => {
      const associatedLinks = this.sourcesMap.get(sourceId);
      if (!associatedLinks) return;

      const newAssociatedLinks = associatedLinks.filter(v => v !== link.id!);
      if (newAssociatedLinks.length < 1) {
        this.sourcesMap.delete(sourceId);
      } else {
        this.sourcesMap.set(sourceId, newAssociatedLinks);
      }
    });
    link.targets.forEach(targetId => {
      const associatedLinks = this.targetsMap.get(targetId);
      if (!associatedLinks) return;

      const newAssociatedLinks = associatedLinks.filter(v => v !== link.id!);
      if (associatedLinks.length < 1) {
        this.targetsMap.delete(targetId);
      } else {
        this.targetsMap.set(targetId, newAssociatedLinks);
      }

      this._updateBookCtr(Number(targetId.substring(0, 2)), -1);
    });
  };

  private _updateBookCtr = (bookNum: number, ctrDelta: number) => {
    const newCtr = Math.max((this.linksByBookMap.get(bookNum) ?? 0) + ctrDelta, 0);
    if (newCtr < 1) {
      this.linksByBookMap.delete(bookNum);
    } else {
      this.linksByBookMap.set(bookNum, newCtr);
    }
  };

  private _logDatabaseTime = (label: string) => {
    if (this.isLoggingTime) {
      console.time(label);
    }
  };

  private _logDatabaseTimeLog = (label: string, ...args: any[]) => {
    if (this.isLoggingTime) {
      console.timeLog(label, ...args);
    }
  };

  private _logDatabaseTimeEnd = (label: string) => {
    if (this.isLoggingTime) {
      console.timeEnd(label);
    }
  };

  /**
   * create virtual links table with all necessary indexes
   */
  static createLinksTable = () => new LinksTable();

  static createLinkTitle = (link: Link): string => {
    const bcvwp = BCVWP.parseFromString(link?.targets?.[0] ?? EmptyWordId);
    return `${bcvwp?.getBookInfo()?.ParaText ?? '???'} ${bcvwp.chapter ?? 1}:${bcvwp.verse ?? 1}`;
  };

  static createIdFromWordId = (wordId: string): string => {
    const workWordId = `${BCVWP.sanitize(wordId)}000000000`.slice(0, 11);
    return `${workWordId}-${uuid()}`;
  };

  /**
   * Creates a prefixed link ID that allows for prefix-based searches.
   * @param link Input link (required).
   */
  static createLinkId = (link: Link): string =>
    LinksTable.createIdFromWordId(link?.targets?.[0] ?? EmptyWordId);

  /**
   * Creates a prefixed alignment record ID that allows for prefix-based searches.
   * @param alignmentRecord Input Alignment record (required).
   */
  static createAlignmentRecordId = (alignmentRecord: AlignmentRecord): string =>
    LinksTable.createIdFromWordId(alignmentRecord?.target?.[0] ?? EmptyWordId);
}

const LinksTableInstance = LinksTable.createLinksTable();

const databaseHookDebug = (text: string, ...args: any[]) => {
  if (LogDatabaseHooks) {
    console.debug(text, ...args);
  }
};

/**
 * Save link hook.
 *<p>
 * Key parameters are used to control operations that may be destructive or time-consuming
 * on re-render. A constant value will ensure an operation only happens once, and a UUID
 * or other ephemeral value will force a refresh. Destructive or time-consuming hooks
 * require key values to execute, others will execute when key parameters are undefined (i.e., by default).
 *<p>
 * @param link Link to save (optional; undefined = no save).
 * @param saveKey Unique key to control save operation (optional; undefined = no save).
 */
export const useSaveLink = (link?: Link, saveKey?: string) => {
  const [status, setStatus] = useState<{
    isPending: boolean;
    result?: Link | undefined;
  }>({ isPending: false });
  const { projectState } = useContext(AppContext);
  const [prevSaveKey, setPrevSaveKey] = useState<string | undefined>();

  useEffect(() => {
    if (!projectState?.linksTable
      || !link
      || !saveKey
      || prevSaveKey === saveKey) {
      return;
    }
    const startStatus = {
      ...status,
      isPending: true
    };
    setStatus(startStatus);
    setPrevSaveKey(saveKey);
    databaseHookDebug('useSaveLink(): startStatus', startStatus);
    projectState?.linksTable?.save(link)
      .then(result => {
        const endStatus = {
          ...startStatus,
          isPending: false,
          result
        };
        setStatus(endStatus);
        databaseHookDebug('useSaveLink(): endStatus', endStatus);
      });
  }, [prevSaveKey, link, projectState?.linksTable, saveKey, status]);

  return { ...status };
};

/**
 * Save alignment file hook.
 *<p>
 * Key parameters are used to control operations that may be destructive or time-consuming
 * on re-render. A constant value will ensure an operation only happens once, and a UUID
 * or other ephemeral value will force a refresh. Destructive or time-consuming hooks
 * require key values to execute, others will execute when key parameters are undefined (i.e., by default).
 *<p>
 * @param alignmentFile Alignment file to save (optional; undefined = no save).
 * @param saveKey Unique key to control save operation (optional; undefined = no save).
 * @param suppressOnUpdate Suppress virtual table update notifications (optional; undefined = true).
 */
export const useSaveAlignmentFile = (alignmentFile?: AlignmentFile, saveKey?: string, suppressOnUpdate: boolean = true) => {
  const [status, setStatus] = useState<{
    isPending: boolean;
  }>({ isPending: false });
  const { projectState } = useContext(AppContext);
  const [prevSaveKey, setPrevSaveKey] = useState<string | undefined>();

  useEffect(() => {
    if (!projectState?.linksTable
      || !alignmentFile
      || !saveKey
      || prevSaveKey === saveKey) {
      return;
    }
    const startStatus = {
      ...status,
      isPending: true
    };
    setStatus(startStatus);
    setPrevSaveKey(saveKey);
    databaseHookDebug('useSaveAlignmentFile(): startStatus', startStatus);
    projectState?.linksTable?.saveAlignmentFile(alignmentFile, suppressOnUpdate)
      .then(() => {
        const endStatus = {
          ...startStatus,
          isPending: false
        };
        setStatus(endStatus);
        databaseHookDebug('useSaveAlignmentFile(): endStatus', endStatus);
      });
  }, [prevSaveKey, alignmentFile, projectState?.linksTable, saveKey, status, suppressOnUpdate]);

  return { ...status };
};

/**
 * Save links hook.
 *<p>
 * Key parameters are used to control operations that may be destructive or time-consuming
 * on re-render. A constant value will ensure an operation only happens once, and a UUID
 * or other ephemeral value will force a refresh. Destructive or time-consuming hooks
 * require key values to execute, others will execute when key parameters are undefined (i.e., by default).
 *<p>
 * @param links Links to save (optional; undefined = no save).
 * @param saveKey Unique key to control save operation (optional; undefined = no save).
 * @param suppressOnUpdate Suppress virtual table update notifications (optional; undefined = true).
 */
export const useSaveAllLinks = (links?: Link[], saveKey?: string, suppressOnUpdate: boolean = true) => {
  const [status, setStatus] = useState<{
    isPending: boolean;
  }>({ isPending: false });
  const { projectState } = useContext(AppContext);
  const [prevSaveKey, setPrevSaveKey] = useState<string | undefined>();

  useEffect(() => {
    if (!projectState?.linksTable
      || !links
      || !saveKey
      || prevSaveKey === saveKey) {
      return;
    }
    const startStatus = {
      ...status,
      isPending: true
    };
    setStatus(startStatus);
    setPrevSaveKey(saveKey);
    databaseHookDebug('useSaveAllLinks(): startStatus', startStatus);
    projectState?.linksTable?.saveAll(links, suppressOnUpdate)
      .then(() => {
        const endStatus = {
          ...startStatus,
          isPending: false
        };
        setStatus(endStatus);
        databaseHookDebug('useSaveAllLinks(): endStatus', endStatus);
      });
  }, [prevSaveKey, links, projectState?.linksTable, saveKey, status, suppressOnUpdate]);

  return { ...status };
};

/**
 * Links existence check hook.
 *<p>
 * Key parameters are used to control operations that may be destructive or time-consuming
 * on re-render. A constant value will ensure an operation only happens once, and a UUID
 * or other ephemeral value will force a refresh. Destructive or time-consuming hooks
 * require key values to execute, others will execute when key parameters are undefined (i.e., by default).
 *<p>
 * @param linkId Link id to check (optional; undefined = no check).
 * @param existsKey Unique key to control check operation (optional; undefined = will check).
 */
export const useLinkExists = (linkId?: string, existsKey?: string) => {
  const [status, setStatus] = useState<{
    isPending: boolean;
    result?: boolean;
  }>({ isPending: false });
  const { projectState } = useContext(AppContext);
  const [prevExistsKey, setPrevExistsKey] = useState<string | undefined>();

  useEffect(() => {
    const workExistsKey = existsKey ?? uuid();
    if (!projectState?.linksTable
      || !linkId
      || prevExistsKey === workExistsKey) {
      return;
    }
    const endStatus = {
      ...status,
      isPending: false,
      result: !!projectState?.linksTable?.exists(linkId)
    };
    setStatus(endStatus);
    setPrevExistsKey(existsKey);
    databaseHookDebug('useLinkExists(): endStatus', endStatus);
  }, [prevExistsKey, existsKey, linkId, projectState?.linksTable, status]);

  return { ...status };
};

/**
 * Remove all links hook.
 *<p>
 * Key parameters are used to control operations that may be destructive or time-consuming
 * on re-render. A constant value will ensure an operation only happens once, and a UUID
 * or other ephemeral value will force a refresh. Destructive or time-consuming hooks
 * require key values to execute, others will execute when key parameters are undefined (i.e., by default).
 *<p>
 * @param removeKey Unique key to control remove operation (optional; undefined = no remove).
 * @param suppressOnUpdate Suppress table update notifications (optional; undefined = true).
 */
export const useRemoveAllLinks = (removeKey?: string, suppressOnUpdate: boolean = true) => {
  const [status, setStatus] = useState<{
    isPending: boolean;
  }>({ isPending: false });
  const { projectState } = useContext(AppContext);
  const [prevRemoveKey, setPrevRemoveKey] = useState<string | undefined>();

  useEffect(() => {
    if (!projectState?.linksTable
      || !removeKey
      || prevRemoveKey === removeKey) {
      return;
    }
    const startStatus = {
      ...status,
      isPending: true
    };
    setStatus(startStatus);
    setPrevRemoveKey(removeKey);
    databaseHookDebug('useRemoveAllLinks(): startStatus', startStatus);
    projectState?.linksTable?.removeAll(suppressOnUpdate)
      .then(() => {
        const endStatus = {
          ...startStatus,
          isPending: false
        };
        setStatus(endStatus);
        databaseHookDebug('useRemoveAllLinks(): endStatus', endStatus);
      });
  }, [prevRemoveKey, projectState?.linksTable, removeKey, status, suppressOnUpdate]);

  return { ...status };
};

/**
 * Find links by word ID hook.
 *<p>
 * Key parameters are used to control operations that may be destructive or time-consuming
 * on re-render. A constant value will ensure an operation only happens once, and a UUID
 * or other ephemeral value will force a refresh. Destructive or time-consuming hooks
 * require key values to execute, others will execute when key parameters are undefined (i.e., by default).
 *<p>
 * @param side Alignment side to find (optional; undefined = no find).
 * @param wordId Word ID to find (optional; undefined = no find).
 * @param findKey Unique key to control find operation (optional; undefined = will find).
 */
export const useFindLinksByWord = (side?: AlignmentSide, wordId?: BCVWP, findKey?: string) => {
  const [status, setStatus] = useState<{
    isPending: boolean;
    result?: Link[];
  }>({ isPending: false });
  const { projectState } = useContext(AppContext);
  const [prevFindKey, setPrevFindKey] = useState<string | undefined>();

  useEffect(() => {
    const workFindKey = findKey ?? uuid();
    if (!projectState?.linksTable
      || !side
      || !wordId
      || prevFindKey === workFindKey) {
      return;
    }
    const endStatus = {
      ...status,
      isPending: false,
      result: projectState?.linksTable?.findByWord(side, wordId)
    };
    setStatus(endStatus);
    setPrevFindKey(findKey);
    databaseHookDebug('useFindLinksByWord(): endStatus', endStatus);
  }, [prevFindKey, findKey, projectState?.linksTable, side, status, wordId]);

  return { ...status };
};

/**
 * Get all links hook.
 *<p>
 * Key parameters are used to control operations that may be destructive or time-consuming
 * on re-render. A constant value will ensure an operation only happens once, and a UUID
 * or other ephemeral value will force a refresh. Destructive or time-consuming hooks
 * require key values to execute, others will execute when key parameters are undefined (i.e., by default).
 *<p>
 * @param getKey Unique key to control get operation (optional; undefined = no get).
 */
export const useGetAllLinks = (getKey?: string) => {
  const [status, setStatus] = useState<{
    isPending: boolean;
    result?: Link[];
  }>({ isPending: false });
  const { projectState } = useContext(AppContext);
  const [prevGetKey, setPrevGetKey] = useState<string | undefined>();

  useEffect(() => {
    if (!projectState?.linksTable
      || !getKey
      || prevGetKey === getKey) {
      return;
    }
    const endStatus = {
      ...status,
      isPending: false,
      result: projectState?.linksTable?.getAll()
    };
    setStatus(endStatus);
    setPrevGetKey(getKey);
    databaseHookDebug('useGetAllLinks(): endStatus', endStatus);
  }, [prevGetKey, getKey, projectState?.linksTable, status]);

  return { ...status };
};

/**
 * Get link by ID hook.
 *<p>
 * Key parameters are used to control operations that may be destructive or time-consuming
 * on re-render. A constant value will ensure an operation only happens once, and a UUID
 * or other ephemeral value will force a refresh. Destructive or time-consuming hooks
 * require key values to execute, others will execute when key parameters are undefined (i.e., by default).
 *<p>
 * @param linkId Link ID to get (optional; undefined = no get).
 * @param getKey Unique key to control get operation (optional; undefined = will get).
 */
export const useGetLink = (linkId?: string, getKey?: string) => {
  const [status, setStatus] = useState<{
    isPending: boolean;
    result?: Link | undefined;
  }>({ isPending: false });
  const { projectState } = useContext(AppContext);
  const [prevGetKey, setPrevGetKey] = useState<string | undefined>();

  useEffect(() => {
    const workGetKey = getKey ?? uuid();
    if (!projectState?.linksTable
      || !linkId
      || prevGetKey === workGetKey) {
      return;
    }
    const endStatus = {
      ...status,
      isPending: false,
      result: projectState?.linksTable?.get(linkId)
    };
    setStatus(endStatus);
    setPrevGetKey(getKey);
    databaseHookDebug('useGetLink(): endStatus', endStatus);
  }, [prevGetKey, getKey, linkId, projectState?.linksTable, status]);

  return { ...status };
};

/**
 * Remove link by ID hook.
 *<p>
 * Key parameters are used to control operations that may be destructive or time-consuming
 * on re-render. A constant value will ensure an operation only happens once, and a UUID
 * or other ephemeral value will force a refresh. Destructive or time-consuming hooks
 * require key values to execute, others will execute when key parameters are undefined (i.e., by default).
 *<p>
 * @param linkId Link ID to remove (optional; undefined = no remove).
 * @param removeKey Unique key to control remove operation (optional; undefined = no remove).
 * @param suppressOnUpdate Suppress table update notifications (optional; undefined = false).
 */
export const useRemoveLink = (linkId?: string, removeKey?: string, suppressOnUpdate: boolean = false) => {
  const [status, setStatus] = useState<{
    isPending: boolean;
  }>({ isPending: false });
  const { projectState } = useContext(AppContext);
  const [prevRemoveKey, setPrevRemoveKey] = useState<string | undefined>();

  useEffect(() => {
    if (!projectState?.linksTable
      || !linkId
      || !removeKey
      || prevRemoveKey === removeKey) {
      return;
    }
    const startStatus = {
      ...status,
      isPending: true
    };
    setStatus(startStatus);
    setPrevRemoveKey(removeKey);
    databaseHookDebug('useRemoveLink(): startStatus', startStatus);
    projectState?.linksTable?.remove(linkId, suppressOnUpdate)
      .then(() => {
        const endStatus = {
          ...startStatus,
          isPending: false
        };
        setStatus(endStatus);
        databaseHookDebug('useRemoveLink(): endStatus', endStatus);
      });
  }, [prevRemoveKey, linkId, projectState?.linksTable, removeKey, status, suppressOnUpdate]);

  return { ...status };
};

/**
 * Database check/access hook.
 *<p>
 * Key parameters are used to control operations that may be destructive or time-consuming
 * on re-render. A constant value will ensure an operation only happens once, and a UUID
 * or other ephemeral value will force a refresh. Destructive or time-consuming hooks
 * require key values to execute, others will execute when key parameters are undefined (i.e., by default).
 *<p>
 * @param checkKey Unique key to control check operation (optional; undefined = no check).
 */
export const useCheckDatabase = (checkKey?: string) => {
  const [status, setStatus] =
    useState<{
      isPending: boolean;
      result?: LinksTable,
      status: DatabaseStatus
    }>({
      isPending: false,
      status: { ..._.cloneDeep(InitialDatabaseStatus) }
    });
  const [prevCheckKey, setPrevCheckKey] = useState<string | undefined>();

  useEffect(() => {
    if (!checkKey
      || prevCheckKey === checkKey) {
      return;
    }
    const startStatus = {
      ...status,
      isPending: true
    };
    setStatus(startStatus);
    setPrevCheckKey(checkKey);
    databaseHookDebug('useCheckDatabase(): startStatus', startStatus);

    const databaseAccess = LinksTableInstance;
    databaseAccess.checkAllTables()
      .then(() => {
        const endStatus = {
          ...startStatus,
          isPending: false,
          result: databaseAccess,
          status: databaseAccess.getDatabaseStatus()
        };
        setStatus(endStatus);
      });
  }, [prevCheckKey, checkKey, status]);

  return { ...status };
};

/**
 * Database status hook.
 */
export const useDatabaseStatus = () => {
  const [status, setStatus] =
    useState<{
      isPending: boolean;
      result: DatabaseStatus
    }>({ isPending: false, result: _.cloneDeep(InitialDatabaseStatus) });

  useEffect(() => {
    const nowTime = Date.now();
    const prevStatus = status.result;
    const currStatus = LinksTableInstance.getDatabaseStatus();
    if (currStatus.busyInfo.isBusy
      || !_.isEqual(prevStatus, currStatus)) {
      const endStatus = {
        ...status,
        isPending: false,
        result: currStatus
      };
      setStatus(endStatus);
      databaseHookDebug('useDatabaseStatus(): endStatus', endStatus);
    }
  }, [status]);

  return { ...status };
};
