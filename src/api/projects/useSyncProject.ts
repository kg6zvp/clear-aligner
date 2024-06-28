import { useCallback, useContext, useRef, useState } from 'react';
import { generateJsonString } from '../../common/generateJsonString';
import { SERVER_URL } from '../../common';
import { mapProjectEntityToProjectDTO, ProjectLocation } from '../../common/data/project/project';
import { Project } from '../../state/projects/tableManager';
import { useSyncAlignments } from '../alignments/useSyncAlignments';
import { AppContext } from '../../App';
import { DateTime } from 'luxon';
import { useDeleteProject } from './useDeleteProject';

export enum SyncProgress {
  IDLE,
  IN_PROGRESS,
  SUCCESS,
  FAILED,
  CANCELED
}

export interface SyncState {
  sync: (project: Project, location: ProjectLocation) => Promise<unknown>;
  progress: SyncProgress;
  cancelSync: (project?: Project) => void;
}

/**
 * hook to synchronize projects. Updating the syncProjectKey or cancelSyncKey will perform that action as in our other hooks.
 */
export const useSyncProjects = (): SyncState => {
  const { sync: syncAlignments } = useSyncAlignments({ manuallySync: true });
  const { deleteProject } = useDeleteProject();
  const { projectState, projects } = useContext(AppContext);

  const [progress, setProgress] = useState<SyncProgress>(SyncProgress.IDLE);
  const abortController = useRef<AbortController | undefined>();

  const cleanupRequest = useCallback(() => {
    abortController.current = undefined;
  }, []);

  const resetProject = useCallback(async (initialProject: Project, deleteFromServer = false) => {
    const resetProject = await projectState.projectTable?.update?.(initialProject, false);
    if (deleteFromServer) {
      await deleteProject(initialProject.id);
    }
    return resetProject;
  }, [projectState]);

  const syncProject = useCallback(async (project: Project, location: ProjectLocation) => {
    try {
      const currentProjectData = projects.find(p => p.id === project.id);
      const syncTime = DateTime.now().toUTC().toMillis();
      project.lastSyncTime = syncTime;
      project.lastUpdated = syncTime;
      if (progress === SyncProgress.CANCELED) return;
      await projectState.projectTable?.sync?.(project, location);
      if ((progress as SyncProgress) === SyncProgress.CANCELED) {
        currentProjectData && await resetProject(currentProjectData);
        return;
      }
      setProgress(SyncProgress.IN_PROGRESS);
      const res = await fetch(`${SERVER_URL ? SERVER_URL : 'http://localhost:8080'}/api/projects/`, {
        signal: abortController.current?.signal,
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: generateJsonString(mapProjectEntityToProjectDTO(project))
      });
      let syncProgress = SyncProgress.FAILED;
      // If the project request was successful, update the alignments for the project.
      if (res.ok) {
        const persistedProject = await res.json();
        const alignmentsSynced = await syncAlignments(persistedProject.id);
        if (alignmentsSynced) {
          syncProgress = SyncProgress.SUCCESS;
        }
      }
      setProgress(syncProgress);
      return res;
    } catch (x) {
      cleanupRequest();
      setProgress(SyncProgress.FAILED);
      setTimeout(() => {
        setProgress(SyncProgress.IDLE);
      }, 5000);
    }
  }, [progress, projects, projectState]);

  const cancelSync = useCallback(async (project?: Project) => {
    if (!project) return;
    setProgress(SyncProgress.CANCELED);
    project && await resetProject(project, true);
    setProgress(SyncProgress.IDLE);
  }, [projects]);

  return {
    sync: syncProject,
    progress,
    cancelSync
  };
};
