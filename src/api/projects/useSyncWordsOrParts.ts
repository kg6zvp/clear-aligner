import { useCallback, useRef, useState } from 'react';
import { mapWordOrPartToWordOrPartDTO } from '../../common/data/project/wordsOrParts';
import { Project } from 'state/projects/tableManager';
import { Progress } from 'api/ApiModels';
import { ApiUtils } from '../utils';
import { AlignmentSide } from '../../common/data/project/corpus';
import { Corpus } from '../../structs';

export interface SyncState {
  sync: (project: Project, side?: AlignmentSide) => Promise<unknown>;
  progress: Progress;
}

/**
 * hook to sync tokens for a specified project from the server.
 */
export const useSyncWordsOrParts = (): SyncState => {

  const [progress, setProgress] = useState<Progress>(Progress.IDLE);
  const abortController = useRef<AbortController | undefined>();

  const cleanupRequest = useCallback(() => {
    abortController.current = undefined;
  }, []);

  const syncWordsOrParts = async (project: Project) => {
    try {
      setProgress(Progress.IN_PROGRESS);
      const corporaToUpdate: Corpus[] = [
        ...(project.sourceCorpora?.corpora ?? []),
        ...(project.targetCorpora?.corpora ?? [])
      ].filter((corpus: Corpus) => !!corpus.updatedSinceSync);
      /*
       * remove tokens in corpora requiring sync
       */
      for (const corpusToUpdate of corporaToUpdate) {
        await ApiUtils.generateRequest({
          requestPath: `/api/projects/${project.id}/tokens/${corpusToUpdate.id}/tokens`,
          requestType: ApiUtils.RequestType.DELETE,
          signal: abortController.current?.signal
        });
      }

      const tokensToUpload = corporaToUpdate
        .flatMap(c => c.words)
        .map(mapWordOrPartToWordOrPartDTO);

      const tokenResponse = await ApiUtils.generateRequest({
        requestPath: `/api/projects/${project.id}/tokens`,
        requestType: ApiUtils.RequestType.POST,
        signal: abortController.current?.signal,
        payload: tokensToUpload
      });
      setProgress(tokenResponse.success ? Progress.SUCCESS : Progress.FAILED);
      return tokenResponse;
    } catch (x) {
      console.error(x);
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
};
