import { AlignmentFile, AlignmentRecord } from '../../structs/alignmentFile';
import { useMemo, useCallback, useRef, useState } from 'react';
import { ServerAlignmentLinkDTO } from '../../common/data/serverAlignmentLinkDTO';
import { useDatabase } from '../../hooks/useDatabase';
import { JournalEntryTableName } from '../../state/links/tableManager';
import { JournalEntryDTO, mapJournalEntryEntityToJournalEntryDTO } from '../../common/data/journalEntryDTO';
import { Progress } from '../ApiModels';
import { Button, CircularProgress, Dialog, Grid, Typography } from '@mui/material';
import { ApiUtils } from '../utils';

export interface SyncState {
  file?: AlignmentFile;
  progress: Progress;
  sync: (projectId?: string, controller?: AbortController) => Promise<unknown>;
  dialog: any;
}

const mapJournalEntryEntityToJournalEntryDTOHelper = (journalEntry: any): JournalEntryDTO => mapJournalEntryEntityToJournalEntryDTO(journalEntry);

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
      const journalEntriesToUpload =
        (await dbApi.getAll(projectId!, JournalEntryTableName))
          .map(mapJournalEntryEntityToJournalEntryDTOHelper);
      await ApiUtils.generateRequest({
        requestPath: `/api/projects/${projectId}/alignment_links`,
        requestType: ApiUtils.RequestType.PATCH,
            signal,
        payload: journalEntriesToUpload
          });
      await dbApi.deleteByIds({
        projectId: projectId!,
        table: JournalEntryTableName,
        itemIdOrIds: journalEntriesToUpload.map((journalEntry) => journalEntry.id!)
      });
    } catch (x) {
      cleanupRequest();
      throw new Error('Aborted');
    }
  }, [cleanupRequest, dbApi]);

  const fetchLinks = useCallback(async (signal: AbortSignal, projectId?: string) => {
    let resultLinks: ServerAlignmentLinkDTO[] = [];
    try {
      const alignmentLinkResponse = await ApiUtils.generateRequest({
        requestPath: `/api/projects/${projectId}/alignment_links`,
        requestType: ApiUtils.RequestType.GET,
        signal: abortController.current?.signal
          });
      resultLinks = alignmentLinkResponse.response?.links ?? [];
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
