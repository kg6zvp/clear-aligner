import { useCallback, useRef, useState } from 'react';
import { mapWordOrPartToWordOrPartDTO } from '../../common/data/project/wordsOrParts';
import { Project } from 'state/projects/tableManager';
import { Progress } from 'api/ApiModels';
import { ApiUtils } from '../utils';
import { AlignmentSide } from '../../common/data/project/corpus';

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

  const syncWordsOrParts = async (project: Project, side?: AlignmentSide) => {
    try {
      setProgress(Progress.IN_PROGRESS);
      const tokensToUpload = [
        ...(side === AlignmentSide.TARGET ? [] : (project.sourceCorpora?.corpora ?? [])),
        ...(side === AlignmentSide.SOURCE ? [] : (project.targetCorpora?.corpora ?? []))
      ].flatMap(c => c.words)
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
