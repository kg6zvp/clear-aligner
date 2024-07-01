import React, { useCallback, useContext, useRef, useState } from 'react';
import { SERVER_URL } from '../../common';
import { WordOrPartDTO } from '../../common/data/project/wordsOrParts';
import { Project } from '../../state/projects/tableManager';
import {
  mapProjectDtoToProject,
  ProjectDTO,
  ProjectLocation
} from '../../common/data/project/project';
import { AppContext } from '../../App';
import { DateTime } from 'luxon';
import { getAvailableCorporaContainers } from '../../workbench/query';
import { Box, Button, CircularProgress, Dialog, Grid, Stack, Typography } from '@mui/material';

enum ProjectDownloadProgress {
  IDLE,
  RETRIEVING_PROJECT,
  RETRIEVING_TOKENS,
  FORMATTING_RESPONSE,
  UPDATING,
  REFRESHING_CONTAINERS,
  SUCCESS,
  FAILED,
  CANCELED
}

export interface SyncState {
  downloadProject: (projectId: string) => Promise<unknown>;
  progress: ProjectDownloadProgress;
  dialog: any;
}

/**
 * hook to download a specified project from the server.
 */
export const useDownloadProject = (): SyncState => {
  const { projectState, setProjects, ...appCtx } = useContext(AppContext);
  const [progress, setProgress] = useState<ProjectDownloadProgress>(ProjectDownloadProgress.IDLE);
  const abortController = useRef<AbortController | undefined>();

  const cleanupRequest = useCallback(() => {
    abortController.current = undefined;
  }, []);

  const downloadProject = async (projectId: string) => {
    try {
      setProgress(ProjectDownloadProgress.RETRIEVING_PROJECT);
      const projectResponse = await fetch(`${SERVER_URL ? SERVER_URL : 'http://localhost:8080'}/api/projects/${projectId}`, {
        signal: abortController.current?.signal,
        method: 'GET',
        headers: {
          accept: 'application/json'
        }
      });
      setProgress(ProjectDownloadProgress.RETRIEVING_TOKENS);
      const tokenResponse = await fetch(`${SERVER_URL ? SERVER_URL : 'http://localhost:8080'}/api/projects/${projectId}/tokens`, {
        signal: abortController.current?.signal,
        method: 'GET',
        headers: {
          accept: 'application/json'
        }
      });

      if (projectResponse.ok) {
        const projectData: ProjectDTO = await projectResponse.json();
        const tokens = ((await tokenResponse.json())?.tokens ?? []);
        setProgress(ProjectDownloadProgress.FORMATTING_RESPONSE);
        tokens.forEach((t: WordOrPartDTO, idx: number) => {
          projectData.corpora = (projectData.corpora || []).map(c => c.id === t.corpusId ? {
            ...c,
            words: [...(c.words || []).filter(w => w.id !== t.id), t]
          } : c);
        });
        const currentTime = DateTime.now().toMillis();
        projectData.lastUpdated = currentTime;
        projectData.lastSyncTime = currentTime;
        const project: Project | undefined = projectData ? mapProjectDtoToProject(projectData, ProjectLocation.SYNCED) : undefined;
        console.log('project: ', project, projectData);
        if (!project) {
          setProgress(ProjectDownloadProgress.FAILED);
          return;
        }
        setProgress(ProjectDownloadProgress.UPDATING);
        Array.from((await projectState.projectTable?.getProjects(true))?.values?.() ?? [])
          .map(p => p.id).includes(project.id)
          ? await projectState.projectTable?.update?.(project, true)
          : await projectState.projectTable?.save?.(project, true);

        setProgress(ProjectDownloadProgress.REFRESHING_CONTAINERS);
        const localProjects = await projectState.projectTable?.getProjects?.(true);
        setProjects(p => Array.from(localProjects?.values?.() ?? p));
        appCtx.setContainers((await getAvailableCorporaContainers({ projectState, setProjects, ...appCtx })));
      }
      setProgress(ProjectDownloadProgress.SUCCESS);
      return projectResponse;
    } catch (x) {
      cleanupRequest();
      setProgress(ProjectDownloadProgress.FAILED);
      setTimeout(() => {
        setProgress(ProjectDownloadProgress.IDLE);
      }, 5000);
    }
  };

  const onCancel = React.useCallback(() => {
    setProgress(ProjectDownloadProgress.CANCELED);
    abortController.current?.abort?.();
  }, []);

  const dialog = React.useMemo(() => {
    let dialogMessage = "Loading...";
    switch (progress) {
      case ProjectDownloadProgress.RETRIEVING_PROJECT:
        dialogMessage = "Retrieving project from server...";
        break;
      case ProjectDownloadProgress.RETRIEVING_TOKENS:
        dialogMessage = "Retrieving tokens from server...";
        break;
      case ProjectDownloadProgress.FORMATTING_RESPONSE:
        dialogMessage = "Preparing to update the local database...";
        break;
      case ProjectDownloadProgress.UPDATING:
        dialogMessage = "Updating the local database...";
        break;
      case ProjectDownloadProgress.REFRESHING_CONTAINERS:
        dialogMessage = "Refreshing corpora...";
        break;
    }

    return (
      <Dialog
        scroll="paper"
        open={![
          ProjectDownloadProgress.IDLE,
          ProjectDownloadProgress.SUCCESS,
          ProjectDownloadProgress.FAILED,
          ProjectDownloadProgress.CANCELED
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
    )
  }, [progress]);

  console.log('progress: ', progress);

  return {
    downloadProject,
    progress,
    dialog
  };
};
