import React, { useCallback, useRef, useState } from 'react';
import { Button, CircularProgress, Dialog, Grid, Typography } from '@mui/material';
import { Progress } from '../ApiModels';
import useCancelTask, { CancelToken } from '../useCancelTask';
import { ApiUtils } from '../utils';

export interface DeleteState {
  deleteProject: (projectId: string) => Promise<unknown>;
  progress: Progress;
  dialog: any;
}

/**
 * hook to delete a specified project from the server.
 */
export const useDeleteProject = (): DeleteState => {
  const [ progress, setProgress ] = useState<Progress>(Progress.IDLE);
  const abortController = useRef<AbortController|undefined>();

  const cleanupRequest = useCallback(() => {
    abortController.current?.abort?.();
    abortController.current = undefined;
  }, []);

  const deleteProject = async (projectId: string) => {
    try {
      setProgress(Progress.IN_PROGRESS);
      const res = await ApiUtils.generateRequest({
        requestPath: `/api/projects/${projectId}`,
        requestType: ApiUtils.RequestType.DELETE,
        signal: abortController.current?.signal
      });
      if(cancelToken.canceled) return;
      setProgress(res.success ? Progress.SUCCESS : Progress.FAILED);
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
  ), [progress, cleanupRequest]);



  return {
    deleteProject,
    progress,
    dialog
  };
}
