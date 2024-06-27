import { ProjectDTO } from '../../common/data/project/project';
import { useCallback, useEffect, useState } from 'react';
import { SERVER_URL } from '../../common';

export interface UseProjectsFromServerProps {
  syncProjectsKey?: string;
}

export const useProjectsFromServer = ({ syncProjectsKey }: UseProjectsFromServerProps): {
  projects: ProjectDTO[],
  refetch: CallableFunction
} => {
  const [ projects, setProjects ] = useState<ProjectDTO[]>([]);
  const getProjects = useCallback(async () => {
    try {
      const projectsResponse = await fetch(`${SERVER_URL ?? 'http://localhost:8080'}/api/projects/`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json'
        }
      });
      const projects = await projectsResponse.json();
      Array.isArray(projects) && setProjects(projects as ProjectDTO[]);
    } catch (x) {
      console.error(x);
    }
  }, []);

  useEffect(() => {
    void getProjects();
  }, [getProjects, syncProjectsKey, setProjects]);

  return { projects, refetch: getProjects };
}
