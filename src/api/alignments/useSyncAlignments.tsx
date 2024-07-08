import { AlignmentFile, AlignmentRecord } from '../../structs/alignmentFile';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ServerAlignmentLinkDTO } from '../../common/data/serverAlignmentLinkDTO';
import { generateJsonString } from '../../common/generateJsonString';
import { useDatabase } from '../../hooks/useDatabase';
import { JournalEntryTableName } from '../../state/links/tableManager';
import {
  ClearAlignerApi,
  getApiOptionsWithAuth,
  JournalEntryDownloadChunkSize,
  OverrideCaApiEndpoint
} from '../../server/amplifySetup';
import { get, patch } from 'aws-amplify/api';
import { Progress } from '../ApiModels';
import { Button, CircularProgress, Dialog, Grid, Typography } from '@mui/material';

export enum SyncProgress {
  IDLE,
  IN_PROGRESS
}

export interface SyncState {
  file?: AlignmentFile;
  progress: Progress;
  sync: (projectId?: string, controller?: AbortController) => Promise<unknown>;
  dialog: any;
}

/**
 * hook to synchronize alignments. Updating the syncLinksKey or cancelSyncKey will perform that action as in our other hooks.
 */
export const useSyncAlignments = (): SyncState => {
  const [progress, setProgress] = useState<Progress>(Progress.IDLE);
  const [file, setFile] = useState<AlignmentFile | undefined>();
  const abortController = useRef<AbortController | undefined>();
  const dbApi = useDatabase();

  const cleanupRequest = useCallback(() => {
    setProgress(Progress.CANCELED);
    abortController.current?.abort?.();
  }, []);

  const sendJournal = useCallback(async (signal: AbortSignal, projectId?: string) => {
    try {
        const requestPath = `/api/projects/${projectId}/alignment_links`;
        if (OverrideCaApiEndpoint) {
          const journalEntriesToUpload = await dbApi.getAllJournalEntries(projectId!);
          (await fetch(`${OverrideCaApiEndpoint}${requestPath}`, {
            signal,
            method: 'PATCH',
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json'
            },
            body: generateJsonString(journalEntriesToUpload)
          }));
          await dbApi.deleteByIds({
            sourceName: projectId!,
            table: JournalEntryTableName,
            itemIdOrIds: journalEntriesToUpload.map((journalEntry) => journalEntry.id!)
          });
        } else {
          let remainingJournalEntries = await dbApi.getCount(projectId!, JournalEntryTableName);
          while (remainingJournalEntries > 0) {
            const journalEntryChunk = (await dbApi.getFirstJournalEntryUploadChunk(projectId!));
            const requestOperation = patch({
              apiName: ClearAlignerApi,
              path: requestPath,
              options: getApiOptionsWithAuth(journalEntryChunk)
            });
            if (signal.aborted) {
              requestOperation.cancel();
              break;
            }
            await requestOperation.response;
            if (signal.aborted) {
              break;
            }
            await dbApi.deleteByIds({
              sourceName: projectId!,
              table: JournalEntryTableName,
              itemIdOrIds: journalEntryChunk.map((journalEntry) => journalEntry.id!)
            });
            remainingJournalEntries = await dbApi.getCount(projectId!, JournalEntryTableName);
          }
        }
    } catch (x) {
      cleanupRequest();
      throw new Error('Aborted');
    }
  }, [cleanupRequest, dbApi]);

  const fetchLinks = useCallback(async (signal: AbortSignal, projectId?: string) => {
    const resultLinks: ServerAlignmentLinkDTO[] = [];
    try {
      const requestPath = `/api/projects/${projectId}/alignment_links`;
      if (OverrideCaApiEndpoint) {
        const responsePromise = (await fetch(`${OverrideCaApiEndpoint}${requestPath}`, {
          signal,
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json'
          }
        })).json();
        const responseLinks: {
          links: ServerAlignmentLinkDTO[]
        } = (await responsePromise);
        resultLinks.push(...responseLinks.links);
      } else {
        let pageCtr = 0;
        while (true) {
          const requestOperation = get({
            apiName: ClearAlignerApi,
            path: requestPath,
            options: {
              queryParams: {
                page: String(pageCtr),
                limit: String(JournalEntryDownloadChunkSize)
              },
              ...getApiOptionsWithAuth()
            }
          });
          if (signal.aborted) {
            requestOperation.cancel();
            break;
          }
          const responsePromise = (await requestOperation.response).body.json();
          if (signal.aborted) {
            break;
          }
          const responseLinks: {
            links: ServerAlignmentLinkDTO[]
          } = (await responsePromise) as any;
          if ((responseLinks?.links?.length ?? 0) === 0) {
            break;
          }
          resultLinks.push(...responseLinks.links);
          if (responseLinks.links.length < JournalEntryDownloadChunkSize) {
            break;
          }
          pageCtr++;
        }
      }
    } catch (x) {
      cleanupRequest();
      throw new Error('Aborted');
    }
    const tmpFile = {
      type: 'translation',
      meta: { creator: 'api' },
      records: resultLinks
        .map(l => ({
          meta: {
            id: l.id,
            origin: l.meta.origin,
            status: l.meta.status
          },
          source: l.sources,
          target: l.targets
        } as AlignmentRecord))
    };
    setFile(tmpFile);
    cleanupRequest();
  }, [cleanupRequest]);

  const syncLinks = useCallback(async (alignmentProjectId?: string, controller?: AbortController) => {
    const signal = (controller ?? new AbortController()).signal;
    try {
      await sendJournal(signal, alignmentProjectId);
      await fetchLinks(signal, alignmentProjectId);
      return true;
    } catch (x) {
    }
  }, [sendJournal, fetchLinks]);

  const dialog = useMemo(() => {
    return (
      <Dialog
        scroll="paper"
        open={![
          Progress.IDLE,
          Progress.SUCCESS,
          Progress.FAILED,
          Progress.CANCELED
        ].includes(progress)}
      >
        <Grid container alignItems="center" justifyContent="space-between"
              sx={{ minWidth: 500, height: 'fit-content', p: 2 }}>
          <CircularProgress sx={{ mr: 2, height: 10, width: 'auto' }} />
          <Typography variant="subtitle1">
            Syncing Alignments...
          </Typography>
          <Button variant="text" sx={{ textTransform: 'none', ml: 2 }} onClick={cleanupRequest}>Cancel</Button>
        </Grid>
      </Dialog>
    );
  }, [progress, cleanupRequest]);

  return {
    file,
    progress,
    sync: syncLinks,
    dialog
  };
};
