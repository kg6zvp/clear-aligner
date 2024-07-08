import { useCallback, useRef, useState } from 'react';
import { generateJsonString } from '../../common/generateJsonString';
import { mapWordOrPartToWordOrPartDTO } from '../../common/data/project/wordsOrParts';
import { Project } from 'state/projects/tableManager';
import { Progress } from 'api/ApiModels';
import { AlignmentSide } from '../../structs';
import {
  ClearAlignerApi,
  getApiOptionsWithAuth,
  OverrideCaApiEndpoint,
  TokenUploadChunkSize
} from '../../server/amplifySetup';
import _ from 'lodash';
import { post } from 'aws-amplify/api';

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
      const requestPath = `/api/projects/${project.id}/tokens`;
      let lastProgress = Progress.SUCCESS;
      if (OverrideCaApiEndpoint) {
        const response = (await fetch(`${OverrideCaApiEndpoint}${requestPath}`, {
          signal: abortController.current?.signal,
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: generateJsonString(tokensToUpload)
        }));
        lastProgress = response.ok ? Progress.SUCCESS : Progress.FAILED;
      } else {
        for (const tokenChunk of _.chunk(tokensToUpload, TokenUploadChunkSize)) {
          const requestOperation = post({
            apiName: ClearAlignerApi,
            path: requestPath,
            options: getApiOptionsWithAuth(tokenChunk)
          });
          if (abortController.current?.signal?.aborted) {
            requestOperation.cancel();
            break;
          }
          await requestOperation.response;
          if (abortController.current?.signal?.aborted) {
            break;
          }
        }
      }
      setProgress(lastProgress);
      return lastProgress;
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
