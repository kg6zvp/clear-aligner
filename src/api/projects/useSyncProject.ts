import { useCallback, useEffect, useRef, useState } from 'react';
import { generateJsonString } from '../../common/generateJsonString';
import { useDatabase } from '../../hooks/useDatabase';
import { SERVER_URL } from '../../common';
import { Project } from '../../structs';
import { mapProjectEntityToProjectDTO, ProjectEntity } from '../../common/data/project/project';

export enum SyncProgress {
  IDLE,
  IN_PROGRESS
}

export interface SyncState {
  project?: Project;
  progress: SyncProgress;
}

/**
 * hook to synchronize projects. Updating the syncLinksKey or cancelSyncKey will perform that action as in our other hooks.
 * @param entity The project entity to sync
 * @param syncLinksKey update this value to perform a sync
 * @param cancelSyncKey update this value to cancel a sync
 */
export const useSyncProjects = (entity: ProjectEntity, syncLinksKey?: string, cancelSyncKey?: string): SyncState => {
  const [ lastSyncKey, setLastSyncKey ] = useState(syncLinksKey);
  const [ lastCancelKey, setLastCancelKey ] = useState(cancelSyncKey);

  const [ progress, setProgress ] = useState<SyncProgress>(SyncProgress.IDLE);
  const abortController = useRef<AbortController|undefined>();
  const dbApi = useDatabase();

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
    const sendJournal = async (signal: AbortSignal) => {
      try {
        await fetch(`${SERVER_URL ? SERVER_URL : 'http://localhost:8080'}/api/projects`, {
          signal,
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: generateJsonString(mapProjectEntityToProjectDTO(entity))
        });
      } catch (x) {
        cleanupRequest();
        throw new Error('Aborted');
      }
    };

    if (progress === SyncProgress.IN_PROGRESS) {
      abortController.current?.abort('retry');
    }
    abortController.current = new AbortController();
    setLastSyncKey(syncLinksKey);
    setProgress(SyncProgress.IN_PROGRESS);
  }, [abortController, setProgress, progress, lastSyncKey, setLastSyncKey, syncLinksKey, cleanupRequest, dbApi]);

  return {
    progress
  };
}
