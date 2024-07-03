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
import useCancelTask, { CancelToken } from '../useCancelTask';
import { useDeleteProject } from './useDeleteProject';
import { AlignmentSide } from '../../structs';

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
  file: any;
}

/**
 * hook to synchronize projects. Updating the syncProjectKey or cancelSyncKey will perform that action as in our other hooks.
 */
export const useSyncProject = (): SyncState => {
  const {cancel, cancelToken, reset} = useCancelTask();
  const { sync: syncWordsOrParts } = useSyncWordsOrParts();
  const { sync: syncAlignments, file } = useSyncAlignments();
  const {deleteProject} = useDeleteProject();
  const { projectState, projects } = useContext(AppContext);
  const [initialProjectState, setInitialProjectState] = useState<Project>();
  const [progress, setProgress] = useState<SyncProgress>(SyncProgress.IDLE);
  const abortController = useRef<AbortController | undefined>();

  const cleanupRequest = useCallback(() => {
    setProgress(SyncProgress.IDLE);
    if(initialProjectState) {
      if(initialProjectState.location === ProjectLocation.LOCAL) {
        initialProjectState.lastSyncTime = 0;
        void deleteProject(initialProjectState.id);
      }
      projectState.projectTable?.update?.(initialProjectState, false);
      projectState.projectTable?.sync(initialProjectState);
    }
    abortController.current = undefined;
    reset();
  }, [initialProjectState]);

  const syncProject = useCallback(async (project: Project, cancelToken: CancelToken) => {
    setInitialProjectState({...project});
    try {
      const syncTime = DateTime.now().toUTC().toMillis();
      if(cancelToken.canceled) return;

      setProgress(SyncProgress.RETRIEVING_TOKENS);
      for (const container of [project.targetCorpora, project.sourceCorpora]) {
        for (const corpus of (container?.corpora ?? [])) {
          if(cancelToken.canceled) return;
          const corpusFromDB = await getCorpusFromDatabase(corpus, project.id);
          corpus.words = corpusFromDB.words;
          corpus.wordsByVerse = corpusFromDB.wordsByVerse;
        }
      }

      if(cancelToken.canceled) return;
      setProgress(SyncProgress.SYNCING_PROJECT);
      project.lastUpdated = syncTime;
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
        if(cancelToken.canceled) return;
        setProgress(SyncProgress.SYNCING_TOKENS);
        await syncWordsOrParts(project, project.location === ProjectLocation.SYNCED ? AlignmentSide.TARGET : undefined);
        if(cancelToken.canceled) return;
        setProgress(SyncProgress.SYNCING_ALIGNMENTS);
        await syncAlignments(project.id);
      }
      project.lastSyncTime = syncTime;
      project.location = ProjectLocation.SYNCED;
      await projectState.projectTable?.sync?.(project);
      if(cancelToken.canceled) return;
      setProgress(SyncProgress.SUCCESS);
      return res;
    } catch (x) {
      cleanupRequest();
      setProgress(SyncProgress.FAILED);
      setTimeout(() => {
        setProgress(SyncProgress.IDLE);
      }, 5000);
    } finally {
      setInitialProjectState(undefined);
    }
  }, [progress, projects, projectState]);

  React.useEffect(() => {
    if(progress === SyncProgress.CANCELED) {
      cancel();
      abortController.current?.abort?.();
      cleanupRequest();
    }
  }, [progress]);

  const onCancel = React.useCallback(() => {
    setProgress(SyncProgress.CANCELED);
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
      case SyncProgress.SYNCING_TOKENS:
      case SyncProgress.SYNCING_ALIGNMENTS:
        dialogMessage = 'Syncing with the server...';
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
    sync: project => new Promise(res => setTimeout(() => res(syncProject(project, cancelToken)), 2000)),
    progress,
    dialog,
    file
  };
};
