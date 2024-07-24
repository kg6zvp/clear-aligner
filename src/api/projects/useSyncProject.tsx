import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { mapProjectEntityToProjectDTO, ProjectLocation, ProjectState } from '../../common/data/project/project';
import { Project } from '../../state/projects/tableManager';
import { useSyncAlignments } from '../alignments/useSyncAlignments';
import { AppContext } from '../../App';
import { useSyncWordsOrParts } from './useSyncWordsOrParts';
import { InitializationStates } from '../../workbench/query';
import { Button, CircularProgress, Dialog, Grid, Typography } from '@mui/material';
import { useDeleteProject } from './useDeleteProject';
import { usePublishProject } from './usePublishProject';
import { DateTime } from 'luxon';
import { useProjectsFromServer } from './useProjectsFromServer';
import { ApiUtils } from '../utils';
import { UserPreference } from '../../state/preferences/tableManager';
import { useDatabase } from '../../hooks/useDatabase';

export enum SyncProgress {
  IDLE,
  IN_PROGRESS,
  SYNCING_LOCAL,
  SWITCH_TO_PROJECT,
  SYNCING_PROJECT,
  SYNCING_CORPORA,
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
  const dbApi = useDatabase();
  const { publishProject } = usePublishProject();
  const { refetch: getProjects } = useProjectsFromServer({enabled: false});
  const { sync: syncWordsOrParts } = useSyncWordsOrParts();
  const { sync: syncAlignments, upload: uploadAlignments, file } = useSyncAlignments();
  const { deleteProject } = useDeleteProject();
  const { projectState, containers, setSnackBarMessage, preferences, setPreferences } = useContext(AppContext);
  const [initialProjectState, setInitialProjectState] = useState<Project>();
  const [progress, setProgress] = useState<SyncProgress>(SyncProgress.IDLE);
  const [syncTime, setSyncTime] = useState<number>(0);
  const [canceled, setCanceled] = React.useState<boolean>(false);
  const [uniqueNameError, setUniqueNameError] = React.useState<boolean>(false);
  const abortController = useRef<AbortController | undefined>();
  const { setIsProjectDialogOpen, isBusyDialogOpen } = useContext(AppContext);

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
        case SyncProgress.SWITCH_TO_PROJECT: {
          if (preferences?.currentProject && preferences?.currentProject === project?.id && preferences?.initialized === InitializationStates.INITIALIZED) {
            setProgress(SyncProgress.SYNCING_PROJECT);
          } else {
            try {
              await projectState.linksTable.reset();
            } catch(x) {
              console.error(x);
            }
            projectState.linksTable.setSourceName(project.id);
            setPreferences((p: UserPreference | undefined) => ({
              ...(p ?? {}) as UserPreference,
              currentProject: project.id,
              initialized: InitializationStates.UNINITIALIZED,
              onInitialized: [ ...(p?.onInitialized ?? []), () => setProgress(SyncProgress.SYNCING_PROJECT) ]
            }));
          }
          break;
        }
        case SyncProgress.SYNCING_PROJECT: {
          const res = await ApiUtils.generateRequest({
            requestPath: '/api/projects',
            requestType: ApiUtils.RequestType.POST,
            signal: abortController.current?.signal,
            payload: mapProjectEntityToProjectDTO(project)
          });
          if(res.success) {
            setProgress(SyncProgress.SYNCING_CORPORA);
          } else {
            if((res.response?.message ?? "").includes("duplicate key")) {
              setUniqueNameError(true);
              setSnackBarMessage("Failed to sync project. Project name already exists");
            } else {
              setSnackBarMessage("Failed to sync project.");
            }
            console.error("Response failed: ", res.response);
            setProgress(SyncProgress.FAILED);
          }
          break;
        }
        case SyncProgress.SYNCING_CORPORA: {
          if (project.sourceCorpora?.corpora.some((c) => !c.words || c.words.length < 1) || !project.targetCorpora?.corpora.some((c) => !c.words || c.words.length < 1)) {
            if (project.id !== containers.projectId || containers.sourceContainer?.corpora.some((c) => !c.words || c.words.length < 1) || containers.targetContainer?.corpora.some((c) => !c.words || c.words.length < 1)) {
              setProgress(SyncProgress.FAILED);
              break;
            }
            project.sourceCorpora = containers.sourceContainer;
            project.targetCorpora = containers.targetContainer;
          }
          await syncWordsOrParts(project);
          setProgress(SyncProgress.SYNCING_ALIGNMENTS);
          break;
        }
        case SyncProgress.SYNCING_ALIGNMENTS: {
          if (project.location === ProjectLocation.LOCAL) {
            await uploadAlignments(project.id)
          } else {
            await syncAlignments(project.id);
          }
          setProgress(SyncProgress.UPDATING_PROJECT);
          break;
        }
        case SyncProgress.UPDATING_PROJECT: {
          project.updatedAt = DateTime.now().toMillis();
          project.lastSyncTime = DateTime.now().toMillis();
          project.location = ProjectLocation.SYNCED;
          await dbApi.toggleCorporaUpdatedFlagOff(project.id);
          await projectState.projectTable?.sync?.(project);
          // Update project state to Published.
          await publishProject(project, ProjectState.PUBLISHED);
          setProgress(SyncProgress.IDLE);
          break;
        }
      }
    } catch (x) {
      setProgress(SyncProgress.FAILED);
      console.error("Failed to sync this project: ", x);
      await publishProject(project, ProjectState.PUBLISHED);
    }
  }, [progress, projectState, cleanupRequest, publishProject,
    setSnackBarMessage, syncAlignments, syncWordsOrParts,
    preferences,
    containers,
    setPreferences,
    uploadAlignments,
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

  React.useEffect(() =>{
    // Prevent the Database busyDialog from showing concurrently
    // with this project dialog
    setIsProjectDialogOpen(![
      SyncProgress.IDLE,
      SyncProgress.SUCCESS,
      SyncProgress.FAILED
    ].includes(progress))
  }, [progress, setIsProjectDialogOpen])

  const dialog = React.useMemo(() => {
    let dialogMessage = 'Loading...';
    switch (progress) {
      case SyncProgress.SYNCING_LOCAL:
        dialogMessage = 'Syncing local project data...';
        break;
      case SyncProgress.SWITCH_TO_PROJECT:
        dialogMessage = 'Opening project';
        break;
      case SyncProgress.SYNCING_PROJECT:
      case SyncProgress.SYNCING_CORPORA:
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
        ].includes(progress) && !isBusyDialogOpen}
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
  }, [progress, onCancel, canceled, isBusyDialogOpen]);

  return {
    sync: (project) => {
      setCanceled(false);
      setInitialProjectState(project);
      setSyncTime(DateTime.now().toMillis());
      setProgress(SyncProgress.SWITCH_TO_PROJECT);
    },
    progress,
    dialog: dialog,
    file,
    uniqueNameError,
    setUniqueNameError
  };
};
