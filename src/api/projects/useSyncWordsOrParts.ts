import { useCallback, useRef, useState } from 'react';
import { SERVER_URL } from '../../common';
import { generateJsonString } from '../../common/generateJsonString';
import { mapWordOrPartToWordOrPartDTO } from '../../common/data/project/wordsOrParts';
import { Project } from 'state/projects/tableManager';
import { Progress } from 'api/ApiModels';

export interface SyncState {
  sync: (project: Project) => Promise<unknown>;
  progress: Progress;
}

/**
 * hook to sync words or parts for a specified project from the server.
 */
export const useSyncWordsOrParts = (): SyncState => {

  const [ progress, setProgress ] = useState<Progress>(Progress.IDLE);
  const abortController = useRef<AbortController|undefined>();

  const cleanupRequest = useCallback(() => {
    abortController.current = undefined;
  }, []);

  const syncWordsOrParts = async (project: Project) => {
    try {
      console.log("syncing words: ", project)
      setProgress(Progress.IN_PROGRESS);
      const res = await fetch(`${SERVER_URL ? SERVER_URL : 'http://localhost:8080'}/api/projects/${project.id}/tokens`, {
        signal: abortController.current?.signal,
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: generateJsonString([
          ...(project.sourceCorpora?.corpora ?? []),
          ...(project.targetCorpora?.corpora ?? [])
        ].flatMap(c => c.words).map(mapWordOrPartToWordOrPartDTO))
      });
      console.log("token res: ", res)
      let syncProgress = Progress.FAILED;
      if(res.ok) {
        syncProgress = Progress.SUCCESS;
      }
      setProgress(syncProgress)
      return res;
    } catch (x) {
      cleanupRequest();
      setProgress(Progress.FAILED);
      setTimeout(() => {
        setProgress(Progress.IDLE);
      }, 5000);
    }
  };
  return {
    sync: syncWordsOrParts,
    progress
  };
}
