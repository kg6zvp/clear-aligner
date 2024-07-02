import React, { useCallback, useRef, useState } from 'react';
import { SERVER_URL } from '../../common';
import { Button, CircularProgress, Dialog, Grid, Typography } from '@mui/material';
import { Progress } from '../ApiModels';
import useCancelTask, { CancelToken } from '../useCancelTask';

export interface DeleteState {
  deleteProject: (projectId: string) => Promise<unknown>;
  progress: Progress;
  dialog: any;
}

/**
 * hook to delete a specified project from the server.
 */
export const useDeleteProject = (): DeleteState => {
  const {cancel, cancelToken} = useCancelTask();
  const [ progress, setProgress ] = useState<Progress>(Progress.IDLE);
  const abortController = useRef<AbortController|undefined>();

  const cleanupRequest = useCallback(() => {
    cancel();
    abortController.current?.abort?.();
    abortController.current = undefined;
  }, []);

  const deleteProject = async (projectId: string, cancelToken: CancelToken) => {
    try {
      if(cancelToken.canceled) return;
      setProgress(Progress.IN_PROGRESS);
      const res = await fetch(`${SERVER_URL ? SERVER_URL : 'http://localhost:8080'}/api/projects/${projectId}`, {
        signal: abortController.current?.signal,
        method: 'DELETE',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json'
        },
      });
      let syncProgress = Progress.FAILED;
      // If the project request was successful, update the alignments for the project.
      if(res.ok) {
        syncProgress = Progress.SUCCESS;
      }
      if(cancelToken.canceled) return;
      setProgress(syncProgress)
      return res;
    } catch (x) {
      cleanupRequest();
      setProgress(Progress.FAILED);
      setTimeout(() => {
        setProgress(Progress.IDLE);
      }, 5000);
    }
  };

  const dialog = React.useMemo(() => (
    <Dialog
      scroll="paper"
      open={progress === Progress.IN_PROGRESS}
      onClose={cleanupRequest}
    >
      <Grid container alignItems="center" justifyContent="space-between" sx={{minWidth: 500, height: 'fit-content', p: 2}}>
        <CircularProgress sx={{mr: 2, height: 10, width: 'auto'}}/>
        <Typography variant="subtitle1">
          Deleting project...
        </Typography>
        <Button variant="text" sx={{textTransform: 'none', ml: 2}} onClick={cleanupRequest}>Cancel</Button>
      </Grid>
    </Dialog>
  ), [progress]);



  return {
    deleteProject: projectId => new Promise(res =>
      setTimeout(() => res(deleteProject(projectId, cancelToken)), 2000)
    ),
    progress,
    dialog
  };
}
