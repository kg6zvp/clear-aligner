import { useCallback, useRef, useState } from 'react';
import { SERVER_URL } from '../../common';

export enum SyncProgress {
  IDLE,
  IN_PROGRESS,
  SUCCESS,
  FAILED
}

export interface DeleteState {
  deleteProject: (projectId: string) => Promise<unknown>;
  progress: SyncProgress;
}

/**
 * hook to delete a specified project from the server.
 */
export const useDeleteProject = (): DeleteState => {

  const [ progress, setProgress ] = useState<SyncProgress>(SyncProgress.IDLE);
  const abortController = useRef<AbortController|undefined>();

  const cleanupRequest = useCallback(() => {
    abortController.current = undefined;
  }, []);

  const deleteProject = async (projectId: string) => {
    try {
      setProgress(SyncProgress.IN_PROGRESS);
      const res = await fetch(`${SERVER_URL ? SERVER_URL : 'http://localhost:8080'}/api/projects/${projectId}`, {
        signal: abortController.current?.signal,
        method: 'DELETE',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json'
        },
      });
      let syncProgress = SyncProgress.FAILED;
      // If the project request was successful, update the alignments for the project.
      if(res.ok) {
        syncProgress = SyncProgress.SUCCESS;
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
    deleteProject,
    progress
  };
}
