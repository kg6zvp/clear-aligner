import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { generateJsonString } from '../../common/generateJsonString';
import { mapProjectEntityToProjectDTO, ProjectLocation, ProjectState } from '../../common/data/project/project';
import { Project } from '../../state/projects/tableManager';
import { useSyncAlignments } from '../alignments/useSyncAlignments';
import { AppContext } from '../../App';
import { useSyncWordsOrParts } from './useSyncWordsOrParts';
import { getCorpusFromDatabase } from '../../workbench/query';
import { Button, CircularProgress, Dialog, Grid, Typography } from '@mui/material';
import { useDeleteProject } from './useDeleteProject';
import { AlignmentSide } from '../../structs';
import { usePublishProject } from './usePublishProject';
import { DateTime } from 'luxon';
import { useProjectsFromServer } from './useProjectsFromServer';
import {
  ClearAlignerApi,
  getApiOptionsWithAuth,
  OverrideCaApiEndpoint
} from '../../server/amplifySetup';
import { post } from 'aws-amplify/api';

export enum SyncProgress {
  IDLE,
  IN_PROGRESS,
  SYNCING_LOCAL,
  RETRIEVING_TOKENS,
  SYNCING_PROJECT,
  SYNCING_TOKENS,
  SYNCING_ALIGNMENTS,
  UPDATING_PROJECT,
  SUCCESS,
  FAILED,
  CANCELED
}

export interface SyncState {
  sync: (project: Project) => void;
  progress: SyncProgress;
  dialog: any;
  file: any;
  uniqueNameError: boolean;
  setUniqueNameError: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * hook to synchronize projects. Updating the syncProjectKey or cancelSyncKey will perform that action as in our other hooks.
 */
export const useSyncProject = (): SyncState => {
  const {publishProject} = usePublishProject();
  const {refetch: getProjects} = useProjectsFromServer({enabled: false});
  const { sync: syncWordsOrParts } = useSyncWordsOrParts();
  const { sync: syncAlignments, file } = useSyncAlignments();
  const {deleteProject} = useDeleteProject();
  const { projectState, setIsSnackBarOpen, setSnackBarMessage } = useContext(AppContext);
  const [initialProjectState, setInitialProjectState] = useState<Project>();
  const [progress, setProgress] = useState<SyncProgress>(SyncProgress.IDLE);
  const [syncTime, setSyncTime] = useState<number>(0);
  const [canceled, setCanceled] = React.useState<boolean>(false);
  const [uniqueNameError, setUniqueNameError] = React.useState<boolean>(false);
  const abortController = useRef<AbortController | undefined>();

  const cleanupRequest = useCallback(async () => {
    if(initialProjectState) {
      const project = {...initialProjectState};
      if(project.location === ProjectLocation.LOCAL) {
        project.lastSyncTime = 0;
        // Remove the remote project if it exists on the server.
        const remoteProjects = await getProjects();
        if((remoteProjects ?? []).some(p => p.id === project.id)) {
          await deleteProject(project.id);
        }
      }
      await projectState.projectTable?.update?.(project, false);
      await projectState.projectTable?.sync(project);
    }
    setProgress(SyncProgress.IDLE);
    setInitialProjectState(undefined);
    setSyncTime(0);
    abortController.current = undefined;
  }, [initialProjectState, deleteProject, projectState.projectTable, getProjects]);

  const onCancel = React.useCallback(() => {
    setProgress(SyncProgress.CANCELED);
  }, []);

  const syncProject = useCallback(async () => {
    const project = {...(initialProjectState ?? {})} as Project;
    try {
      // Fallthrough cases are intentional
      /* eslint-disable no-fallthrough */
      switch (progress) {
        case SyncProgress.CANCELED:
          setCanceled(true);
        case SyncProgress.FAILED: {
          abortController.current?.abort?.();
          await cleanupRequest();
          break;
        }
        case SyncProgress.RETRIEVING_TOKENS:
          for (const container of [project.targetCorpora, project.sourceCorpora]) {
            for (const corpus of (container?.corpora ?? [])) {
              const corpusFromDB = await getCorpusFromDatabase(corpus, project.id);
              corpus.words = corpusFromDB.words;
              corpus.wordsByVerse = corpusFromDB.wordsByVerse;
            }
          }
          setProgress(SyncProgress.SYNCING_PROJECT);
          break;
        case SyncProgress.SYNCING_PROJECT: {
          const requestPath = '/api/projects';
          let res;
          if (OverrideCaApiEndpoint) {
            res = await fetch(`${OverrideCaApiEndpoint}${requestPath}`, {
              signal: abortController.current?.signal,
              method: 'POST',
              headers: {
                accept: 'application/json',
                'Content-Type': 'application/json'
              },
              body: generateJsonString(mapProjectEntityToProjectDTO(project))
            });
            if(res.ok) {
              setProgress(SyncProgress.SYNCING_TOKENS);
            } else {
              setSnackBarMessage(
                ((await res.json()).message ?? "").includes("duplicate key")
                  ? "Failed to sync project. Project name already exists"
                  : "Failed to sync project."
              );
              setIsSnackBarOpen(true);
              setUniqueNameError(true);
              setProgress(SyncProgress.FAILED);
            }
          } else {
            const responseOperation = post({
              apiName: ClearAlignerApi,
              path: requestPath,
              options: getApiOptionsWithAuth(mapProjectEntityToProjectDTO(project))
            });
            if(abortController.current?.signal) {
              abortController.current.signal.onabort = () => {
                responseOperation.cancel();
              };
            }
            await responseOperation.response;
          }
          break;
        }
        case SyncProgress.SYNCING_TOKENS: {
          await syncWordsOrParts(project, project.location === ProjectLocation.SYNCED ? AlignmentSide.TARGET : undefined);
          setProgress(SyncProgress.SYNCING_ALIGNMENTS);
          break;
        }
        case SyncProgress.SYNCING_ALIGNMENTS: {
          await syncAlignments(project.id);
          setProgress(SyncProgress.UPDATING_PROJECT);
          break;
        }
        case SyncProgress.UPDATING_PROJECT: {
          project.lastSyncTime = syncTime;
          project.location = ProjectLocation.SYNCED;
          await projectState.projectTable?.sync?.(project);
          // Update project state to Published.
          await publishProject(project, ProjectState.PUBLISHED);
          setProgress(SyncProgress.IDLE);
          break;
        }
      }
    } catch (x) {
      setProgress(SyncProgress.FAILED);
    }
  }, [progress, projectState, cleanupRequest, publishProject,
    setIsSnackBarOpen, setSnackBarMessage, syncAlignments, syncWordsOrParts,
    initialProjectState, syncTime]);

  useEffect(() => {
    if(syncTime && initialProjectState && !canceled) {
      syncProject().catch(console.error);
    } else if (canceled) {
      setProgress(SyncProgress.IDLE);
    }
    // The useEffect should only be called on progress changes,
    // allowing the single threaded process to be cancelable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

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
      case SyncProgress.CANCELED:
        dialogMessage = 'Resetting project changes...'
    }

    return (
      <Dialog
        scroll="paper"
        open={![
          SyncProgress.IDLE,
          SyncProgress.SUCCESS,
          SyncProgress.FAILED
        ].includes(progress)}
        onClose={() => progress !== SyncProgress.CANCELED && onCancel()}
      >
        <Grid container alignItems="center" justifyContent="space-between" sx={{minWidth: 500, height: 'fit-content', p: 2}}>
          <CircularProgress sx={{mr: 2, height: 10, width: 'auto'}}/>
          <Typography variant="subtitle1">
            {canceled ? 'Resetting project changes...' : dialogMessage}
          </Typography>
          {
            progress !== SyncProgress.CANCELED && !canceled
              ? <Button variant="text" sx={{textTransform: 'none', ml: 2}} onClick={onCancel}>Cancel</Button>
              : <Grid />
          }
        </Grid>
      </Dialog>
    );
  }, [progress, onCancel, canceled]);

  return {
    sync: project => {
      setCanceled(false);
      setInitialProjectState(project);
      setSyncTime(DateTime.now().toMillis());
      setProgress(SyncProgress.RETRIEVING_TOKENS);
    },
    progress,
    dialog: dialog,
    file,
    uniqueNameError,
    setUniqueNameError
  };
};
