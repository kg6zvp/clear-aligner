import { AlignmentFile, AlignmentRecord } from '../../structs/alignmentFile';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LinkOrigin, LinkStatus } from '../../structs';

export enum SyncProgress {
  IDLE,
  IN_PROGRESS
}

export interface SyncState {
  file?: AlignmentFile;
  progress: SyncProgress;
}

/**
 * hook to synchronize alignments. Updating the syncLinksKey or cancelSyncKey will perform that action as in our other hooks.
 * @param projectId project being synchronized
 * @param syncLinksKey update this value to perform a sync
 * @param cancelSyncKey update this value to cancel a sync
 */
export const useSyncAlignments = (projectId?: string, syncLinksKey?: string, cancelSyncKey?: string): SyncState => {
  const [ lastSyncKey, setLastSyncKey ] = useState(syncLinksKey);
  const [ lastCancelKey, setLastCancelKey ] = useState(cancelSyncKey);

  const [ progress, setProgress ] = useState<SyncProgress>(SyncProgress.IDLE);
  const [ file, setFile ] = useState<AlignmentFile|undefined>();
  const abortController = useRef<AbortController|undefined>();

  const cleanupRequest = useCallback(() => {
    abortController.current = undefined;
    setProgress(SyncProgress.IDLE);
    setLastSyncKey(syncLinksKey);
    setLastCancelKey(cancelSyncKey);
  }, [setProgress, abortController, setLastSyncKey, setLastCancelKey, syncLinksKey, cancelSyncKey]);

  useEffect(() => {
    if (lastCancelKey === cancelSyncKey) {
      return;
    }
    abortController.current?.abort('cancel');
    cleanupRequest();
  }, [abortController, lastCancelKey, setLastCancelKey, cancelSyncKey, cleanupRequest]);

  useEffect(() => {
    if (lastSyncKey === syncLinksKey) {
      return;
    }
    const fetchLinks = async ({ signal }: AbortController) => {
      let response;
      try {
        response = await fetch(`http://localhost:8080/api/projects/${projectId}/alignment_links/`, {
          signal,
          headers: { accept: 'application/json' }
        });
      } catch (x) {
        setProgress(SyncProgress.IDLE);
        abortController.current = undefined;
        return;
      }
      const linksBody: {
        links: {
          id: string,
          sources: string[],
          targets: string[],
          origin: LinkOrigin,
          status: LinkStatus
        }[]
      } = await response.json();
      const tmpFile = {
        type: 'translation',
        meta: { creator: 'api' },
        records: linksBody.links
          .map(l => ({
            meta: {
              id: l.id,
              origin: l.origin,
              status: l.status
            },
            source: l.sources,
            target: l.targets
          } as AlignmentRecord))
      };
      setFile(tmpFile);
      cleanupRequest();
    };
    if (progress === SyncProgress.IN_PROGRESS) {
      abortController.current?.abort('retry');
    }
    abortController.current = new AbortController();
    setLastSyncKey(syncLinksKey);
    setProgress(SyncProgress.IN_PROGRESS);
    void fetchLinks(abortController.current);
  }, [abortController, setProgress, progress, lastSyncKey, setLastSyncKey, syncLinksKey, cleanupRequest, projectId]);

  return {
    file,
    progress
  };
}
