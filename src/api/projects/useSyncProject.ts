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
 * hook to synchronize projects. Updating the syncProjectKey or cancelSyncKey will perform that action as in our other hooks.
 * @param entity The project entity to sync
 * @param syncProjectKey update this value to perform a sync
 * @param cancelSyncKey update this value to cancel a sync
 */
export const useSyncProjects = (entity: ProjectEntity, syncProjectKey?: string, cancelSyncKey?: string): SyncState => {
  const [ lastSyncKey, setLastSyncKey ] = useState(syncProjectKey);
  const [ lastCancelKey, setLastCancelKey ] = useState(cancelSyncKey);

  const [ progress, setProgress ] = useState<SyncProgress>(SyncProgress.IDLE);
  const abortController = useRef<AbortController|undefined>();
  const dbApi = useDatabase();

  const cleanupRequest = useCallback(() => {
    abortController.current = undefined;
    setProgress(SyncProgress.IDLE);
    setLastSyncKey(syncProjectKey);
    setLastCancelKey(cancelSyncKey);
  }, [setProgress, abortController, setLastSyncKey, setLastCancelKey, syncProjectKey, cancelSyncKey]);

  useEffect(() => {
    if (lastCancelKey === cancelSyncKey) {
      return;
    }
    abortController.current?.abort('cancel');
    cleanupRequest();
  }, [abortController, lastCancelKey, setLastCancelKey, cancelSyncKey, cleanupRequest]);

  useEffect(() => {
    if (lastSyncKey === syncProjectKey) {
      return;
    }
    const syncProject = async (signal: AbortSignal) => {
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
    setLastSyncKey(syncProjectKey);
    setProgress(SyncProgress.IN_PROGRESS);
  }, [abortController, setProgress, progress, lastSyncKey, setLastSyncKey, syncProjectKey, cleanupRequest, dbApi]);

  return {
    progress
  };
}
