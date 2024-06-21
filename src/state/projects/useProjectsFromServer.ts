import { ProjectDTO, ProjectState } from '../../common/data/user/project';
import { useEffect, useState } from 'react';
import uuid from 'uuid-random';
import { SERVER_URL } from '../../common';
import { useDatabase } from '../../hooks/useDatabase';

export interface UseProjectsFromServerProps {
  syncProjectsKey?: string;
}

export const useProjectsFromServer = ({ syncProjectsKey }: UseProjectsFromServerProps): ProjectDTO[] => {
  const [ projects, setProjects ] = useState<ProjectDTO[]>([]);
  const [ lastSyncKey, setLastSyncKey ] = useState(syncProjectsKey ?? uuid());
  const dbApi = useDatabase();

  useEffect(() => {
    const syncProjects = async () => {
      try {
        const projectsResponse = await fetch(`${SERVER_URL ? SERVER_URL : 'http://localhost:8080'}/api/projects/`, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json'
          }
        });
        const projects = await projectsResponse.json()
        setProjects(projects as ProjectDTO[]);
      } catch (x) {
        console.error(x);
      }
    }
    void syncProjects();
  }, [lastSyncKey, setProjects]);

  return projects;
}
