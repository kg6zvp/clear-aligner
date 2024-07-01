import {
  mapProjectDtoToProject,
  ProjectLocation
} from '../../common/data/project/project';
import { useCallback, useContext, useEffect, useState } from 'react';
import { SERVER_URL } from '../../common';
import { AppContext } from '../../App';
import { Progress } from '../ApiModels';
import { Project } from '../../state/projects/tableManager';
import { getCorpusFromDatabase } from '../../workbench/query';

export interface UseProjectsFromServerProps {
  syncProjectsKey?: string;
  enabled?: boolean;
}

export const useProjectsFromServer = ({ syncProjectsKey, enabled = true }: UseProjectsFromServerProps): {
  refetch: (args?: { persist: boolean; }) => Promise<void>,
  progress: Progress
} => {
  const { projectState, setProjects } = useContext(AppContext);
  const [progress, setProgress] = useState<Progress>(Progress.IDLE);

  const getProjects = useCallback(async ({persist} = {persist: false}) => {
    try {
      setProgress(Progress.IN_PROGRESS);
      const projectsResponse = await fetch(`${SERVER_URL ?? 'http://localhost:8080'}/api/projects/`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json'
        }
      });
      const projectDtos = await projectsResponse.json();
      const projects = (Array.isArray(projectDtos) ? projectDtos.map(p => mapProjectDtoToProject(p, ProjectLocation.REMOTE)) : [])
        .filter(p => p?.targetCorpora?.corpora) as Project[];

      if(projects[0]) {
        const project = projects[0];
        for ( let c of [...(project.targetCorpora?.corpora ?? []), ...(project.sourceCorpora?.corpora ?? [])]) {
          console.log("corpus from database; ", await getCorpusFromDatabase(c, project.id), project);
        }
      }
      console.log("persist: ", persist, projects);
      // Save in local database if persist is specified.
      if(persist) {
        const localProjects = await projectState.projectTable?.getProjects?.(true) ?? new Map();
        for (const project of projects) {
          if(!project?.targetCorpora?.corpora?.length) continue;
          console.log("syncing project as: ", project, project, localProjects, Array.from(localProjects.keys()).includes(project.id))
          if(Array.from(localProjects.keys()).includes(project.id)) {
            let res = await projectState.projectTable?.update?.(project, false);
            console.log("update response: ", res)
          } else {
            let res = await projectState.projectTable?.save?.(project, false);
            console.log("save response: ", res)
          }
        }
      }
      setProjects(localProjects => [
        ...localProjects.filter(localProject =>
          !projects.map(p => p.id).includes(localProject.id)
        ),
        ...projects
      ]);
      setProgress(Progress.SUCCESS);
    } catch (x) {
      console.error(x);
      setProgress(Progress.FAILED);
    } finally {
      setTimeout(() => setProgress(Progress.IDLE), 5000);
    }
  }, []);

  useEffect(() => {
    enabled && void getProjects();
  }, [getProjects, syncProjectsKey]);

  return { refetch: getProjects, progress };
}
