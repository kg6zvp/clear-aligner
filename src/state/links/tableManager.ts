import { AlignmentSide, Link } from '../../structs';
import BCVWP from '../../features/bcvwp/BCVWPSupport';
import { SecondaryIndex, VirtualTable } from '../databaseManagement';
import uuid from 'uuid-random';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { AlignmentFile, AlignmentRecord } from '../../structs/alignmentFile';
import { createCache, MemoryCache, memoryStore } from 'cache-manager';

const DatabaseChunkSize = 10_000;
const DatabaseWaitInMs = 1_000;
const DatabaseCacheTTLMs = 600_000;
const DatabaseCacheMaxSize = 1_000;
const DatabaseStatusRefreshTimeInMs = 500;
const EmptyWordId = '00000000000';
const DefaultProjectName = 'default';
const LinkTableName = 'links';
const LogDatabaseHooks = true;
const PreloadVerseRange = 10;

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
  private readonly databaseStatus: DatabaseStatus;
  private databaseBusyCtr = 0;
  private linksByWordIdCache: MemoryCache;
  private linksByBCVCache: MemoryCache;

  constructor() {
    super();
    this.databaseStatus = { ..._.cloneDeep(InitialDatabaseStatus) };
    this.linksByBCVCache = createCache(memoryStore(), { ttl: DatabaseCacheTTLMs, max: DatabaseCacheMaxSize });
    this.linksByWordIdCache = createCache(memoryStore(), { ttl: DatabaseCacheTTLMs, max: DatabaseCacheMaxSize });
  }

  save = async (link: Link, suppressOnUpdate = false, isForced = false): Promise<boolean> => {
    if (!isForced && this._isDatabaseBusy()) {
      return false;
    }

    this._logDatabaseTime('save()');
    this._incrDatabaseBusyCtr();
    try {
      await this.remove(link.id, true, true);
      const newLink: Link = {
        id: link.id ?? uuid(),
        sources: link.sources.map(BCVWP.sanitize),
        targets: link.targets.map(BCVWP.sanitize)
      };

      await this.checkDatabase();
      // @ts-ignore
      return await window.databaseApi.save(DefaultProjectName, LinkTableName, newLink);
    } catch (e) {
      return false;
    } finally {
      await this._onUpdate(suppressOnUpdate);
    }
  };

  exists = async (linkId?: string): Promise<boolean> => {
    if (!linkId) return false;
    // @ts-ignore
    return !!(await window.databaseApi.existsById(DefaultProjectName, LinkTableName, linkId));
  };

  removeAll = async (suppressOnUpdate = false, isForced = false) => {
    if (!isForced && this._isDatabaseBusy()) {
      return false;
    }

    this._logDatabaseTime('removeAll()');
    this._incrDatabaseBusyCtr();
    this.databaseStatus.busyInfo.userText = 'Removing old links...';
    try {
      await this.checkDatabase();
      // @ts-ignore
      const result = await window.databaseApi.deleteAll(DefaultProjectName, LinkTableName);
      await this._onUpdate(suppressOnUpdate);
      return result;
    } catch (ex) {
      console.error('error removing all links', ex);
      return false;
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
      return false;
    }


    this._logDatabaseTime('saveAll(): complete');
    this._incrDatabaseBusyCtr();
    this.databaseStatus.busyInfo.userText = `Saving ${inputLinks.length.toLocaleString()} links...`;
    try {
      await this.removeAll(true, true);
      await this.checkDatabase();

      this.databaseStatus.busyInfo.userText = `Sorting ${inputLinks.length.toLocaleString()} links...`;
      this._logDatabaseTime('saveAll(): sorted');
      const outputLinks = inputLinks.map(link =>
        ({
          id: link.id ?? LinksTable.createLinkId(link),
          sources: link.sources.map(BCVWP.sanitize),
          targets: link.targets.map(BCVWP.sanitize)
        } as Link));
      outputLinks.sort((l1, l2) =>
        (l1.id ?? EmptyWordId)
          .localeCompare(l2.id ?? EmptyWordId));
      this._logDatabaseTimeEnd('saveAll(): sorted');

      this._logDatabaseTime('saveAll(): saved');
      const busyInfo = this.databaseStatus.busyInfo;
      busyInfo.userText = `Saving ${outputLinks.length.toLocaleString()} links...`;
      busyInfo.progressCtr = 0;
      busyInfo.progressMax = outputLinks.length;
      for (const chunk of _.chunk(outputLinks, DatabaseChunkSize)) {
        // @ts-ignore
        await window.databaseApi.insert(DefaultProjectName, LinkTableName, chunk);
        busyInfo.progressCtr += chunk.length;

        const fromLinkTitle = LinksTable.createLinkTitle(chunk[0]);
        const toLinkTitle = LinksTable.createLinkTitle(chunk[chunk.length - 1]);
        busyInfo.userText = chunk.length === busyInfo.progressMax
          ? `Saved ${fromLinkTitle} to ${toLinkTitle} (${busyInfo.progressCtr.toLocaleString()} links)...`
          : `Saved ${fromLinkTitle} to ${toLinkTitle} (${busyInfo.progressCtr.toLocaleString()} of ${busyInfo.progressMax.toLocaleString()} links)...`;

        this._logDatabaseTimeLog('saveAll(): saved', busyInfo.progressCtr, busyInfo.progressMax);
      }
      this._logDatabaseTimeEnd('saveAll(): saved');

      busyInfo.userText = `Updating link text...`;
      // @ts-ignore
      await window.databaseApi.updateAllLinkText(DefaultProjectName);

      busyInfo.userText = `Saving project...`;
      await this._onUpdate(suppressOnUpdate);
      return true;
    } catch (ex) {
      console.error('error saving all links', ex);
      return false;
    } finally {
      this._decrDatabaseBusyCtr();
      this._logDatabaseTimeEnd('saveAll(): complete');
    }
  };

  /**
   * check if the given word has a link
   * @param side
   * @param wordId
   */
  hasLinkByWord = async (side: AlignmentSide, wordId: BCVWP): Promise<boolean> => {
    return (await this.findLinkIdsByWordId(side, wordId)).length > 0;
  };

  findLinkIdsByWordId = async (side: AlignmentSide, wordId: BCVWP): Promise<string[]> => {
    return (await this.findByWordId(side, wordId))
      .map(link => link.id)
      .filter(Boolean) as string[];
  };

  findByWordId = async (side: AlignmentSide, wordId: BCVWP): Promise<Link[]> => {
    const referenceString = wordId.toReferenceString();
    const cacheKey = [side, referenceString].join('|');
    return this.linksByWordIdCache.wrap(cacheKey, async () => {
      // @ts-ignore
      return window.databaseApi
        .findLinksByWordId(DefaultProjectName, side, referenceString);
    });
  };

  findByBCV = async (side: AlignmentSide, bookNum: number, chapterNum: number, verseNum: number): Promise<Link[]> => {
    const cacheKey = [side, bookNum, chapterNum, verseNum].join('|');
    return this.linksByBCVCache.wrap(cacheKey, async () => {
      // @ts-ignore
      return window.databaseApi
        .findLinksByBCV(DefaultProjectName, side, bookNum, chapterNum, verseNum);
    });
  };

  preloadByBCV = (side: AlignmentSide, bookNum: number, chapterNum: number, verseNum: number, skipVerseNum: boolean) => {
    for (const verseCtr of this._createVersePreloadRange(verseNum, skipVerseNum)) {
      void this.findByBCV(side, bookNum, chapterNum, verseCtr);
    }
  };

  getAll = async (): Promise<Link[]> => {
    // @ts-ignore
    return await window.databaseApi.getAll(DefaultProjectName, LinkTableName) as Link[] ?? [];
  };

  get = async (id?: string): Promise<Link | undefined> => {
    if (!id) return undefined;
    // @ts-ignore
    return await window.databaseApi.findOneById(DefaultProjectName, LinkTableName, id) as Link | undefined;
  };

  remove = async (id?: string, suppressOnUpdate = false, isForced = false) => {
    if (!isForced && this._isDatabaseBusy()) {
      return;
    }

    this._logDatabaseTime('remove()');
    this._incrDatabaseBusyCtr();
    try {
      await this.checkDatabase();
      // @ts-ignore
      const result = await window.databaseApi.deleteByIds(DefaultProjectName, LinkTableName, oldLink.id ?? '');
      await this._onUpdate(suppressOnUpdate);
      return result;
    } catch (ex) {
      console.error('error removing link', ex);
      return false;
    } finally {
      this._decrDatabaseBusyCtr();
      this._logDatabaseTimeEnd('remove()');
    }
  };

  protected override _onUpdateImpl = async (suppressOnUpdate?: boolean) => {
    this.databaseStatus.lastUpdateTime = this.lastUpdate;
    await this.linksByWordIdCache.reset();
    await this.linksByBCVCache.reset();
  };

  catchUpIndex = async (index: SecondaryIndex<Link>): Promise<void> => {
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
      await window.databaseApi.createDataSource(DefaultProjectName);
      loadState.isLoaded = true;

      return true;
    } catch (ex) {
      console.error('error checking database', ex);
      return false;
    } finally {
      loadState.isLoading = false;
      this._logDatabaseTimeEnd('checkDatabase(): loading');
    }
  };

  /**
   * Checks to see if the links DB has been created without using a promise.
   * Does not guarantee the database is not in the process of being created.
   */
  private _quickCheckDatabase = () => this.databaseStatus.databaseLoadState.isLoaded;

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
      return await this.checkDatabase();
    } finally {
      this._logDatabaseTimeEnd('checkAllTables(): loading');
    }
  };

  _createVersePreloadRange(verseNum: number, skipVerseNum: boolean) {
    const minVerse = Math.max(verseNum - PreloadVerseRange, 1);
    const maxVerse = verseNum + PreloadVerseRange;
    const verseNumbers: number[] = _.range(minVerse, maxVerse)
      .filter(verseCtr => !skipVerseNum || verseCtr !== verseNum);
    verseNumbers.sort((v1, v2) => {
      return Math.abs(verseNum - v1) -
        Math.abs(verseNum - v2);
    });
    return verseNumbers;
  }

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
    return `${BCVWP.sanitize(wordId)}-${uuid()}`;
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
    result?: boolean | undefined;
  }>({});
  const prevSaveKey = useRef<string | undefined>();

  useEffect(() => {
    if (!link
      || !saveKey
      || prevSaveKey.current === saveKey) {
      return;
    }
    prevSaveKey.current = saveKey;
    databaseHookDebug('useSaveLink(): status', status);
    LinksTableInstance.save(link)
      .then(result => {
        const endStatus = {
          ...status,
          result
        };
        setStatus(endStatus);
        databaseHookDebug('useSaveLink(): endStatus', endStatus);
      });
  }, [prevSaveKey, link, saveKey, status]);

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
  const prevSaveKey = useRef<string | undefined>();

  useEffect(() => {
    if (!alignmentFile
      || !saveKey
      || prevSaveKey.current === saveKey) {
      return;
    }
    const startStatus = {
      ...status,
      isPending: true
    };
    setStatus(startStatus);
    prevSaveKey.current = saveKey;
    databaseHookDebug('useSaveAlignmentFile(): startStatus', startStatus);
    LinksTableInstance.saveAlignmentFile(alignmentFile, suppressOnUpdate)
      .then(() => {
        const endStatus = {
          ...startStatus,
          isPending: false
        };
        setStatus(endStatus);
        databaseHookDebug('useSaveAlignmentFile(): endStatus', endStatus);
      });
  }, [prevSaveKey, alignmentFile, saveKey, status, suppressOnUpdate]);

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
  const prevSaveKey = useRef<string | undefined>();

  useEffect(() => {
    if (!links
      || !saveKey
      || prevSaveKey.current === saveKey) {
      return;
    }
    const startStatus = {
      ...status,
      isPending: true
    };
    setStatus(startStatus);
    prevSaveKey.current = saveKey;
    databaseHookDebug('useSaveAllLinks(): startStatus', startStatus);
    LinksTableInstance.saveAll(links, suppressOnUpdate)
      .then(() => {
        const endStatus = {
          ...startStatus,
          isPending: false
        };
        setStatus(endStatus);
        databaseHookDebug('useSaveAllLinks(): endStatus', endStatus);
      });
  }, [prevSaveKey, links, saveKey, status, suppressOnUpdate]);

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
    result?: boolean;
  }>({});
  const prevExistsKey = useRef<string | undefined>();

  useEffect(() => {
    const workExistsKey = existsKey ?? uuid();
    if (!linkId
      || prevExistsKey.current === workExistsKey) {
      return;
    }
    prevExistsKey.current = existsKey;
    databaseHookDebug('useLinkExists(): status', status);
    LinksTableInstance.exists(linkId)
      .then(result => {
        const endStatus = {
          ...status,
          result
        };
        setStatus(endStatus);
        databaseHookDebug('useLinkExists(): endStatus', endStatus);
      });
  }, [prevExistsKey, existsKey, linkId, status]);

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
  const prevRemoveKey = useRef<string | undefined>();

  useEffect(() => {
    if (!removeKey
      || prevRemoveKey.current === removeKey) {
      return;
    }
    const startStatus = {
      ...status,
      isPending: true
    };
    setStatus(startStatus);
    prevRemoveKey.current = removeKey;
    databaseHookDebug('useRemoveAllLinks(): startStatus', startStatus);
    LinksTableInstance.removeAll(suppressOnUpdate)
      .then(() => {
        const endStatus = {
          ...startStatus,
          isPending: false
        };
        setStatus(endStatus);
        databaseHookDebug('useRemoveAllLinks(): endStatus', endStatus);
      });
  }, [prevRemoveKey, removeKey, status, suppressOnUpdate]);

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
export const useFindLinksByWordId = (side?: AlignmentSide, wordId?: BCVWP, isNoPreload = false, findKey?: string) => {
  const [status, setStatus] = useState<{
    result?: Link[];
  }>({});
  const prevFindKey = useRef<string | undefined>();

  useEffect(() => {
    const workFindKey = findKey ?? uuid();
    if (!side
      || !wordId
      || prevFindKey.current === workFindKey) {
      return;
    }
    prevFindKey.current = findKey;
    databaseHookDebug('useFindLinksByWord(): status', status);
    LinksTableInstance.findByWordId(side, wordId)
      .then(result => {
        const endStatus = {
          ...status,
          result
        };
        setStatus(endStatus);
        if (!isNoPreload
          && wordId.book
          && wordId.chapter
          && wordId.verse) {
          LinksTableInstance.preloadByBCV(side, wordId.book, wordId.chapter, wordId.verse, true);
        }
        databaseHookDebug('useFindLinksByWord(): endStatus', endStatus);
      });
  }, [isNoPreload, prevFindKey, findKey, side, status, wordId]);

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
 * @param bookNum Book number (optional; undefined = no find).
 * @param chapterNum Chapter number (optional; undefined = no find).
 * @param verseNum Verse number  (optional; undefined = no find).
 * @param findKey Unique key to control find operation (optional; undefined = will find).
 */
export const useFindLinksByBCV = (side?: AlignmentSide, bookNum?: number, chapterNum?: number, verseNum?: number, isNoPreload = false, findKey?: string) => {
  const [status, setStatus] = useState<{
    result?: Link[];
  }>({});
  const prevFindKey = useRef<string | undefined>();

  useEffect(() => {
    const workFindKey = findKey ?? uuid();
    if (!side
      || !bookNum
      || !chapterNum
      || !verseNum
      || prevFindKey.current === workFindKey) {
      return;
    }
    prevFindKey.current = findKey;
    databaseHookDebug('useFindLinksByWord(): status', status);
    LinksTableInstance.findByBCV(side, bookNum, chapterNum, verseNum)
      .then(result => {
        const endStatus = {
          ...status,
          result
        };
        setStatus(endStatus);
        if (!isNoPreload) {
          LinksTableInstance.preloadByBCV(side, bookNum, chapterNum, verseNum, true);
        }
        databaseHookDebug('useFindLinksByWord(): endStatus', endStatus);
      });
  }, [isNoPreload, prevFindKey, findKey, side, bookNum, chapterNum, verseNum, status]);

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
    result?: Link[];
  }>({});
  const prevGetKey = useRef<string | undefined>();

  useEffect(() => {
    if (!getKey
      || prevGetKey.current === getKey) {
      return;
    }
    prevGetKey.current = getKey;
    databaseHookDebug('useGetAllLinks(): status', status);
    LinksTableInstance.getAll()
      .then(result => {
        const endStatus = {
          ...status,
          result
        };
        setStatus(endStatus);
        databaseHookDebug('useGetAllLinks(): endStatus', endStatus);
      });
  }, [prevGetKey, getKey, status]);

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
    result?: Link | undefined;
  }>({});
  const prevGetKey = useRef<string | undefined>();

  useEffect(() => {
    const workGetKey = getKey ?? uuid();
    if (!linkId
      || prevGetKey.current === workGetKey) {
      return;
    }
    prevGetKey.current = getKey;
    databaseHookDebug('useGetLink(): status', status);
    LinksTableInstance.get(linkId)
      .then(result => {
        const endStatus = {
          ...status,
          result
        };
        setStatus(endStatus);
        databaseHookDebug('useGetLink(): endStatus', endStatus);
      });
  }, [prevGetKey, getKey, linkId, status]);

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
    result?: boolean;
  }>({});
  const prevRemoveKey = useRef<string | undefined>();

  useEffect(() => {
    if (!linkId
      || !removeKey
      || prevRemoveKey.current === removeKey) {
      return;
    }
    prevRemoveKey.current = removeKey;
    databaseHookDebug('useRemoveLink(): status', status);
    LinksTableInstance.remove(linkId, suppressOnUpdate)
      .then(result => {
        const endStatus = {
          ...status,
          result
        };
        setStatus(endStatus);
        databaseHookDebug('useRemoveLink(): endStatus', endStatus);
      });
  }, [prevRemoveKey, linkId, removeKey, status, suppressOnUpdate]);

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
      result?: LinksTable,
      status: DatabaseStatus
    }>({
      status: { ..._.cloneDeep(InitialDatabaseStatus) }
    });
  const prevCheckKey = useRef<string | undefined>();

  useEffect(() => {
    if (!checkKey
      || prevCheckKey.current === checkKey) {
      return;
    }
    prevCheckKey.current = checkKey;
    databaseHookDebug('useCheckDatabase(): status', status);
    const databaseAccess = LinksTableInstance;
    databaseAccess.checkAllTables()
      .then(() => {
        const endStatus = {
          ...status,
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
export const useDatabaseStatus = (isAsync = false, checkKey?: string) => {
  const [status, setStatus] =
    useState<{
      result: DatabaseStatus
    }>({ result: _.cloneDeep(InitialDatabaseStatus) });
  const prevCheckKey = useRef<string | undefined>();

  useEffect(() => {
    const workCheckKey = checkKey ?? uuid();
    if (!checkKey
      || prevCheckKey.current === workCheckKey) {
      return;
    }
    prevCheckKey.current = workCheckKey;
    databaseHookDebug('useDatabaseStatus(): status', status);
    const setDatabaseStatus = (isAsync = false, inputStatus?: DatabaseStatus) => {
      const prevStatus = inputStatus ?? status.result;
      const currStatus = LinksTableInstance.getDatabaseStatus();
      if (currStatus.busyInfo.isBusy
        || !_.isEqual(prevStatus, currStatus)) {
        const endStatus = {
          ...status,
          result: currStatus
        };
        setStatus(endStatus);
        databaseHookDebug('useDatabaseStatus(): endStatus', endStatus);
      }

      if (isAsync) {
        return window.setInterval(() => setDatabaseStatus(false, currStatus), DatabaseStatusRefreshTimeInMs);
      }
      return undefined;
    };

    const intervalId = setDatabaseStatus(isAsync);
    if (intervalId) {
      return () => window.clearInterval(intervalId);
    }
    return undefined;
  }, [prevCheckKey, checkKey, isAsync, status]);

  return { ...status };
};
