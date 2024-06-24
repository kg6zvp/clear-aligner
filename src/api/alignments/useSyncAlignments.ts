import { AlignmentFile, AlignmentRecord } from '../../structs/alignmentFile';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ServerAlignmentLinkDTO } from '../../common/data/serverAlignmentLinkDTO';
import { generateJsonString } from '../../common/generateJsonString';
import { useDatabase } from '../../hooks/useDatabase';
import { JournalEntryTableName } from '../../state/links/tableManager';
import { JournalEntryDTO, mapJournalEntryEntityToJournalEntryDTO } from '../../common/data/journalEntryDTO';
import { SERVER_URL } from '../../common';

export enum SyncProgress {
  IDLE,
  IN_PROGRESS
}

export interface SyncState {
  file?: AlignmentFile;
  progress: SyncProgress;
  sync: (projectId?: string, controller?: AbortController) => Promise<unknown>;
}

const mapJournalEntryEntityToJournalEntryDTOHelper = (journalEntry: any): JournalEntryDTO => mapJournalEntryEntityToJournalEntryDTO(journalEntry);

interface SyncAlignmentProps {
  projectId?: string;
  syncLinksKey?: string;
  cancelSyncKey?: string;
  manuallySync?: boolean;
}

/**
 * hook to synchronize alignments. Updating the syncLinksKey or cancelSyncKey will perform that action as in our other hooks.
 * @param projectId project being synchronized
 * @param syncLinksKey update this value to perform a sync
 * @param cancelSyncKey update this value to cancel a sync
 * @param manuallySync
 */
export const useSyncAlignments = ({ projectId, syncLinksKey, cancelSyncKey, manuallySync }: SyncAlignmentProps): SyncState => {
  const [ lastSyncKey, setLastSyncKey ] = useState(syncLinksKey);
  const [ lastCancelKey, setLastCancelKey ] = useState(cancelSyncKey);

  const [ progress, setProgress ] = useState<SyncProgress>(SyncProgress.IDLE);
  const [ file, setFile ] = useState<AlignmentFile|undefined>();
  const abortController = useRef<AbortController|undefined>();
  const dbApi = useDatabase();

  const cleanupRequest = useCallback(() => {
    abortController.current = undefined;
    setProgress(SyncProgress.IDLE);
    setLastSyncKey(syncLinksKey);
    setLastCancelKey(cancelSyncKey);
  }, [setProgress, abortController, setLastSyncKey, setLastCancelKey, syncLinksKey, cancelSyncKey]);

  const sendJournal = useCallback(async (signal: AbortSignal, alignmentProjectId?: string) => {
    const journalEntries = (await dbApi.getAll(alignmentProjectId!, JournalEntryTableName))
      .map(mapJournalEntryEntityToJournalEntryDTOHelper);
    try {
      await fetch(`${SERVER_URL ? SERVER_URL : 'http://localhost:8080'}/api/projects/${alignmentProjectId}/alignment_links/`, {
        signal,
        method: 'PATCH',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: generateJsonString(journalEntries)
      });
      await dbApi.deleteAll({
        sourceName: alignmentProjectId!,
        table: JournalEntryTableName
      });
    } catch (x) {
      cleanupRequest();
      throw new Error('Aborted');
    }
  }, []);
  const fetchLinks = useCallback(async (signal: AbortSignal, alignmentProjectId?: string) => {
    let response;
    try {
      response = await fetch(`${SERVER_URL ? SERVER_URL : 'http://localhost:8080'}/api/projects/${alignmentProjectId}/alignment_links/`, {
        signal,
        headers: { accept: 'application/json' }
      });
    } catch (x) {
      cleanupRequest();
      throw new Error('Aborted');
    }
    const linksBody: {
      links: ServerAlignmentLinkDTO[]
    } = await response.json();
    const tmpFile = {
      type: 'translation',
      meta: { creator: 'api' },
      records: linksBody.links
        .map(l => ({
          meta: {
            id: l.id,
            origin: l.meta.origin,
            status: l.meta.status
          },
          source: l.sources,
          target: l.targets
        } as AlignmentRecord))
    };
    setFile(tmpFile);
    cleanupRequest();
  }, []);
  const syncLinks = useCallback(async (alignmentProjectId?: string, controller?: AbortController) => {
    const signal = (controller ?? new AbortController()).signal;
    try {
      await sendJournal(signal, alignmentProjectId);
      await fetchLinks(signal, alignmentProjectId);
      return true;
    } catch (x) { }
  }, [projectId]);


  useEffect(() => {
    if (lastCancelKey === cancelSyncKey || manuallySync) {
      return;
    }
    abortController.current?.abort('cancel');
    cleanupRequest();
  }, [abortController, lastCancelKey, setLastCancelKey, cancelSyncKey, cleanupRequest]);

  useEffect(() => {
    if (lastSyncKey === syncLinksKey || manuallySync) {
      return;
    }

    if (progress === SyncProgress.IN_PROGRESS) {
      abortController.current?.abort('retry');
    }
    abortController.current = new AbortController();
    setLastSyncKey(syncLinksKey);
    setProgress(SyncProgress.IN_PROGRESS);
    void syncLinks(projectId, abortController.current);
  }, [abortController, setProgress, progress, lastSyncKey, setLastSyncKey, syncLinksKey, cleanupRequest, projectId, dbApi]);

  return {
    file,
    progress,
    sync: syncLinks
  };
}
