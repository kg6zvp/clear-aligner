import { useCallback, useRef, useState } from 'react';
import { generateJsonString } from '../../common/generateJsonString';
import { useDatabase } from '../../hooks/useDatabase';
import { SERVER_URL } from '../../common';
import { mapProjectEntityToProjectDTO } from '../../common/data/project/project';
import { Project } from '../../state/projects/tableManager';
import { useSyncAlignments } from '../alignments/useSyncAlignments';

export enum SyncProgress {
  IDLE,
  IN_PROGRESS,
  SUCCESS,
  FAILED
}

export interface SyncState {
  sync: (project: Project) => Promise<unknown>;
  progress: SyncProgress;
}

/**
 * hook to synchronize projects. Updating the syncProjectKey or cancelSyncKey will perform that action as in our other hooks.
 * @param syncProjectKey update this value to perform a sync
 * @param cancelSyncKey update this value to cancel a sync
 */
export const useSyncProjects = (syncProjectKey?: string, cancelSyncKey?: string): SyncState => {
  const {sync: syncAlignments} = useSyncAlignments({manuallySync: true})
  const [ lastSyncKey, setLastSyncKey ] = useState(syncProjectKey);
  const [ lastCancelKey, setLastCancelKey ] = useState(cancelSyncKey);

  const [ progress, setProgress ] = useState<SyncProgress>(SyncProgress.IDLE);
  const abortController = useRef<AbortController|undefined>();
  const dbApi = useDatabase();

  const cleanupRequest = useCallback(() => {
    abortController.current = undefined;
  }, []);

  const syncProject = async (project: Project) => {
    try {
      console.log("api request payload: ", project, mapProjectEntityToProjectDTO(project))
      setProgress(SyncProgress.IN_PROGRESS);
      const res = await fetch(`${SERVER_URL ? SERVER_URL : 'http://localhost:8080'}/api/projects/`, {
        signal: abortController.current?.signal,
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: generateJsonString(mapProjectEntityToProjectDTO(project))
      });
      let syncProgress = SyncProgress.FAILED;
      // If the project request was successful, update the alignments for the project.
      if(res.ok) {
        const persistedProject = await res.json();
        const alignmentsSynced = await syncAlignments(persistedProject.id);
        if(alignmentsSynced) {
          syncProgress = SyncProgress.SUCCESS;
        }
      }
      setProgress(syncProgress)
      return res;
    } catch (x) {
      cleanupRequest();
      setProgress(SyncProgress.FAILED);
      setTimeout(() => {
        setProgress(SyncProgress.IDLE);
      }, 5000);
    }
  };
  return {
    sync: syncProject,
    progress
  };
}
