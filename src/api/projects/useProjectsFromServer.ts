import {
  mapProjectDtoToProject,
  ProjectLocation, ProjectState
} from '../../common/data/project/project';
import { useCallback, useContext, useEffect, useState } from 'react';
import { SERVER_URL } from '../../common';
import { AppContext } from '../../App';
import { Progress } from '../ApiModels';
import { Project } from '../../state/projects/tableManager';
import { DateTime } from 'luxon';

export interface UseProjectsFromServerProps {
  syncProjectsKey?: string;
  enabled?: boolean;
}

export const useProjectsFromServer = ({ syncProjectsKey, enabled = true }: UseProjectsFromServerProps): {
  refetch: (args?: { persist: boolean; currentProjects: any }) => Promise<void>,
  progress: Progress
} => {
  const { projectState, setProjects } = useContext(AppContext);
  const [progress, setProgress] = useState<Progress>(Progress.IDLE);

  const getProjects = useCallback(async ({ persist, currentProjects } = { persist: false, currentProjects: [] }) => {
    try {
      setProgress(Progress.IN_PROGRESS);
      const projectsResponse = await fetch(`${SERVER_URL ?? 'http://localhost:8080'}/api/projects`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json'
        }
      });
      const projectDtos = await projectsResponse.json();
      const projects = (
        Array.isArray(projectDtos)
          ? projectDtos
            .filter(p => p.state === ProjectState.PUBLISHED)
            .map(p => mapProjectDtoToProject(p, ProjectLocation.REMOTE))
          : []
      ).filter(p => p?.targetCorpora?.corpora) as Project[];

      // Save in local database if persist is specified.
      if (persist) {
        const localProjects = await projectState.projectTable?.getProjects?.(true) ?? new Map();
        for (const project of projects.filter(p => p?.targetCorpora?.corpora?.length)) {
          project.sourceCorpora = undefined;
          const localProject: Project = localProjects.get(project.id);
          if (localProject && localProject.targetCorpora?.corpora?.[0]) {
            project.lastSyncTime = DateTime.now().toMillis();
            project.lastUpdated = DateTime.now().toMillis();
            project.location = ProjectLocation.SYNCED;
            await projectState.projectTable?.update?.(project, false);
          } else {
            await projectState.projectTable?.save?.(project, false);
          }
        }
        const removedProjects: Project[] = Array.from(localProjects.values()).filter((lp: Project) =>
          !projects.some(p => lp.id === p.id) && lp.targetCorpora?.corpora?.reduce((a, b) => a && b)
        );
        for (const removedProject of removedProjects) {
          removedProject.location = ProjectLocation.LOCAL;
          removedProject.lastSyncTime = 0;
          removedProject.lastUpdated = DateTime.now().toMillis();
          await projectState.projectTable?.update?.(removedProject, false);
        }
      }
      const updatedProjects = await projectState.projectTable?.getProjects?.(true) ?? new Map();
      setProjects(p => Array.from(updatedProjects.values() ?? p));
      setProgress(Progress.SUCCESS);
    } catch (x) {
      console.error(x);
      setProgress(Progress.FAILED);
    } finally {
      setTimeout(() => setProgress(Progress.IDLE), 5000);
    }
  }, [projectState, setProjects]);

  useEffect(() => {
    enabled && void getProjects();
  }, [getProjects, syncProjectsKey, enabled]);

  return { refetch: getProjects, progress };
};
