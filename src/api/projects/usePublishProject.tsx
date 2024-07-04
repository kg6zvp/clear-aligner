import React, { useCallback, useContext, useRef, useState } from 'react';
import { SERVER_URL } from '../../common';
import { ProjectLocation, ProjectState } from '../../common/data/project/project';
import { Project } from '../../state/projects/tableManager';
import { AppContext } from '../../App';
import { Button, CircularProgress, Dialog, Grid, Typography } from '@mui/material';
import useCancelTask, { CancelToken } from '../useCancelTask';
import { useDeleteProject } from './useDeleteProject';
import { Progress } from '../ApiModels';
import { DateTime } from 'luxon';

export interface PublishState {
  publishProject: (project: Project, state: ProjectState) => Promise<unknown>;
  progress: Progress;
  dialog: any;
}

/**
 * Custom hook to publish/unpublish projects.
 */
export const usePublishProject = (): PublishState => {
  const {cancel, cancelToken, reset} = useCancelTask();
  const {deleteProject} = useDeleteProject();
  const { projectState, setProjects } = useContext(AppContext);
  const [publishState, setPublishState] = React.useState<ProjectState>();
  const [progress, setProgress] = useState<Progress>(Progress.IDLE);
  const abortController = useRef<AbortController | undefined>();

  const cleanupRequest = useCallback(() => {
    setProgress(Progress.IDLE);
    abortController.current = undefined;
    setPublishState(undefined);
    reset();
  }, [reset]);

  const publishProject = useCallback(async (project: Project, state: ProjectState, cancelToken: CancelToken) => {
    setPublishState(state);
    try {
      setProgress(Progress.IN_PROGRESS);
      if(cancelToken.canceled) return;
      // Update project state to Published.
      await fetch(`${SERVER_URL ? SERVER_URL : 'http://localhost:8080'}/api/projects/${project.id}/state`, {
        signal: abortController.current?.signal,
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(state)
      });
      project.state = state;
      if(state === ProjectState.PUBLISHED) {
        const syncTime = DateTime.now().toMillis();
        project.location = ProjectLocation.SYNCED;
        project.lastUpdated = syncTime;
        project.lastSyncTime = syncTime;
        await projectState?.projectTable?.update(project, false);
      } else {
        await deleteProject(project.id);
        project.location = ProjectLocation.LOCAL;
        project.lastSyncTime = 0;
        await projectState?.projectTable?.update(project, false);
      }
      const updatedProjects = await projectState.projectTable?.getProjects?.(true) ?? new Map();
      setProjects(p => Array.from(updatedProjects.values() ?? p));
      setProgress(Progress.SUCCESS);
    } catch (x) {
      cleanupRequest();
      setProgress(Progress.FAILED);
      setTimeout(() => {
        setProgress(Progress.IDLE);
      }, 5000);
    }
  }, [projectState, cleanupRequest, deleteProject, setProjects]);

  React.useEffect(() => {
    if(progress === Progress.CANCELED) {
      cancel();
      abortController.current?.abort?.();
      cleanupRequest();
    }
  }, [progress, cleanupRequest, cancel]);

  const onCancel = React.useCallback(() => {
    setProgress(Progress.CANCELED);
  }, []);

  const dialog = React.useMemo(() => {
    return (
      <Dialog
        scroll="paper"
        open={![
          Progress.IDLE,
          Progress.SUCCESS,
          Progress.FAILED,
          Progress.CANCELED
        ].includes(progress) && !!publishState}
        onClose={onCancel}
      >
        <Grid container alignItems="center" justifyContent="space-between" sx={{minWidth: 500, height: 'fit-content', p: 2}}>
          <CircularProgress sx={{mr: 2, height: 10, width: 'auto'}}/>
          <Typography variant="subtitle1">
            {publishState === ProjectState.PUBLISHED ? "Publishing project..." : "Unpublishing project..."}
          </Typography>
          <Button variant="text" sx={{textTransform: 'none', ml: 2}} onClick={onCancel}>Cancel</Button>
        </Grid>
      </Dialog>
    );
  }, [progress, onCancel, publishState]);


  return {
    publishProject: (projectId, state) => new Promise(res => setTimeout(() => res(publishProject(projectId, state, cancelToken)), 2000)),
    progress,
    dialog,
  };
};
