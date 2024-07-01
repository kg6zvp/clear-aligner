import React, { useCallback, useContext, useRef, useState } from 'react';
import { generateJsonString } from '../../common/generateJsonString';
import { SERVER_URL } from '../../common';
import { mapProjectEntityToProjectDTO, ProjectLocation } from '../../common/data/project/project';
import { Project } from '../../state/projects/tableManager';
import { useSyncAlignments } from '../alignments/useSyncAlignments';
import { AppContext } from '../../App';
import { DateTime } from 'luxon';
import { useSyncWordsOrParts } from './useSyncWordsOrParts';
import { getCorpusFromDatabase } from '../../workbench/query';
import { Button, CircularProgress, Dialog, Grid, Typography } from '@mui/material';

export enum SyncProgress {
  IDLE,
  IN_PROGRESS,
  SYNCING_LOCAL,
  RETRIEVING_TOKENS,
  SYNCING_PROJECT,
  SYNCING_TOKENS,
  SYNCING_ALIGNMENTS,
  SUCCESS,
  FAILED,
  CANCELED
}

export interface SyncState {
  sync: (project: Project) => Promise<unknown>;
  progress: SyncProgress;
  dialog: any;
}

/**
 * hook to synchronize projects. Updating the syncProjectKey or cancelSyncKey will perform that action as in our other hooks.
 */
export const useSyncProject = (): SyncState => {
  const { sync: syncWordsOrParts } = useSyncWordsOrParts();
  const { sync: syncAlignments } = useSyncAlignments({ manuallySync: true });
  const { projectState, projects } = useContext(AppContext);

  const [progress, setProgress] = useState<SyncProgress>(SyncProgress.IDLE);
  const abortController = useRef<AbortController | undefined>();

  const cleanupRequest = useCallback((project: Project, syncTime?: number) => {
    project.lastSyncTime = syncTime ?? 0;
    projectState.projectTable?.update?.(project, false);
    abortController.current = undefined;
  }, []);

  const syncProject = useCallback(async (project: Project) => {
    const previousSyncTime = project.lastSyncTime;
    try {
      const syncTime = DateTime.now().toUTC().toMillis();
      project.lastSyncTime = syncTime;
      project.lastUpdated = syncTime;
      project.location = ProjectLocation.SYNCED;
      if (progress === SyncProgress.CANCELED) return;
      setProgress(SyncProgress.SYNCING_LOCAL);
      await projectState.projectTable?.sync?.(project);
      if ((progress as SyncProgress) === SyncProgress.CANCELED) {
        return;
      }
      setProgress(SyncProgress.RETRIEVING_TOKENS);

      for (const container of [project.targetCorpora, project.sourceCorpora]) {
        for (const corpus of (container?.corpora ?? [])) {
          const corpusFromDB = await getCorpusFromDatabase(corpus, project.id);
          corpus.words = corpusFromDB.words;
          corpus.wordsByVerse = corpusFromDB.wordsByVerse;
          console.log("corpusFromDB: ", corpusFromDB)
        }
      }

      console.log('project in sync: ', project);
      setProgress(SyncProgress.SYNCING_PROJECT);
      const res = await fetch(`${SERVER_URL ? SERVER_URL : 'http://localhost:8080'}/api/projects/`, {
        signal: abortController.current?.signal,
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: generateJsonString(mapProjectEntityToProjectDTO(project))
      });
      // If the project request was successful, update the alignments for the project.
      if (res.ok) {
        setProgress(SyncProgress.SYNCING_TOKENS);
        const syncedWords = await syncWordsOrParts(project);
        console.log('syncedWords: ', syncedWords);
        setProgress(SyncProgress.SYNCING_ALIGNMENTS);
        await syncAlignments(project.id);
      }
      setProgress(SyncProgress.SUCCESS);
      return res;
    } catch (x) {
      cleanupRequest(project, previousSyncTime);
      setProgress(SyncProgress.FAILED);
      setTimeout(() => {
        setProgress(SyncProgress.IDLE);
      }, 5000);
    }
  }, [progress, projects, projectState]);

  const onCancel = React.useCallback(() => {
    setProgress(SyncProgress.CANCELED);
    abortController.current?.abort?.();
  }, []);

  const dialog = React.useMemo(() => {
    let dialogMessage = 'Loading...';
    switch (progress) {
      case SyncProgress.SYNCING_LOCAL:
        dialogMessage = 'Syncing local project data...';
        break;
      case SyncProgress.RETRIEVING_TOKENS:
        dialogMessage = 'Retrieving tokens from the local database...';
        break;
      case SyncProgress.SYNCING_PROJECT:
        dialogMessage = 'Syncing project with the server...';
        break;
      case SyncProgress.SYNCING_TOKENS:
        dialogMessage = 'Syncing words and parts with the server...';
        break;
      case SyncProgress.SYNCING_ALIGNMENTS:
        dialogMessage = 'Syncing alignments with the server...';
        break;
    }

    return (
      <Dialog
        scroll="paper"
        open={![
          SyncProgress.IDLE,
          SyncProgress.SUCCESS,
          SyncProgress.FAILED,
          SyncProgress.CANCELED
        ].includes(progress)}
        onClose={onCancel}
      >
        <Grid container alignItems="center" justifyContent="space-between" sx={{minWidth: 500, height: 'fit-content', p: 2}}>
          <CircularProgress sx={{mr: 2, height: 10, width: 'auto'}}/>
          <Typography variant="subtitle1">
            {dialogMessage}
          </Typography>
          <Button variant="text" sx={{textTransform: 'none', ml: 2}} onClick={onCancel}>Cancel</Button>
        </Grid>
      </Dialog>
    );
  }, [progress]);


  return {
    sync: syncProject,
    progress,
    dialog
  };
};
