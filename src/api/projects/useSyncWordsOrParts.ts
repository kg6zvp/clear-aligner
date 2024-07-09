import { useCallback, useRef, useState } from 'react';
import { generateJsonString } from '../../common/generateJsonString';
import { mapWordOrPartToWordOrPartDTO } from '../../common/data/project/wordsOrParts';
import { Project } from 'state/projects/tableManager';
import { Progress } from 'api/ApiModels';
import { Corpus } from '../../structs';
import {
  ClearAlignerApi,
  getApiOptionsWithAuth,
  OverrideCaApiEndpoint,
  TokenUploadChunkSize
} from '../../server/amplifySetup';
import _ from 'lodash';
import { post, del } from 'aws-amplify/api';
import { AlignmentSide } from '../../common/data/project/corpus';

export interface SyncState {
  sync: (project: Project, side?: AlignmentSide) => Promise<unknown>;
  progress: Progress;
}

/**
 * hook to sync words or parts for a specified project from the server.
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
      ].filter((corpus: Corpus) => (corpus.updatedAt?.getTime() ?? 0) > (project.lastSyncTime ?? 0));
      /*
       * remove tokens in corpora that require updates
       */
      for (const corpusToUpdate of corporaToUpdate) {
        const requestPath = `/api/projects/${project.id}/tokens/${corpusToUpdate.id}/tokens`;
        if (OverrideCaApiEndpoint) {
          const response = await fetch(`${OverrideCaApiEndpoint}${requestPath}`, {
            signal: abortController.current?.signal,
            method: 'DELETE',
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json'
            }
          });
        } else { // AWS
          const requestOperation = del({
            apiName: ClearAlignerApi,
            path: requestPath,
            options: getApiOptionsWithAuth()
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

      const tokensToUpload = corporaToUpdate
        .flatMap(c => c.words)
        .map(mapWordOrPartToWordOrPartDTO);

      let lastProgress = Progress.SUCCESS;
      if (tokensToUpload.length > 0) {
        const requestPath = `/api/projects/${project.id}/tokens`;
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
