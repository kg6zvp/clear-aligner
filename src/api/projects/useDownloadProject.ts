import { useCallback, useContext, useRef, useState } from 'react';
import { SERVER_URL } from '../../common';
import { Progress } from 'api/ApiModels';
import { WordOrPartDTO } from '../../common/data/project/wordsOrParts';
import { Project } from '../../state/projects/tableManager';
import {
  mapProjectDtoToProject,
  ProjectDTO,
  ProjectLocation
} from '../../common/data/project/project';
import { AppContext, AppContextProps } from '../../App';
import { DateTime } from 'luxon';
import { getAvailableCorporaContainers } from '../../workbench/query';

export interface SyncState {
  downloadProject: (projectId: string) => Promise<unknown>;
  progress: Progress;
}

/**
 * hook to download a specified project from the server.
 */
export const useDownloadProject = (): SyncState => {
  const {projectState, setProjects, ...appCtx} = useContext(AppContext);
  const [ progress, setProgress  ] = useState<Progress>(Progress.IDLE);
  const abortController = useRef<AbortController|undefined>();

  const cleanupRequest = useCallback(() => {
    abortController.current = undefined;
  }, []);

  const downloadProject = async (projectId: string) => {
    try {
      setProgress(Progress.IN_PROGRESS);
      const projectResponse = await fetch(`${SERVER_URL ? SERVER_URL : 'http://localhost:8080'}/api/projects/${projectId}`, {
        signal: abortController.current?.signal,
        method: 'GET',
        headers: {
          accept: 'application/json',
        },
      });
      const tokenResponse = await fetch(`${SERVER_URL ? SERVER_URL : 'http://localhost:8080'}/api/projects/${projectId}/tokens`, {
        signal: abortController.current?.signal,
        method: 'GET',
        headers: {
          accept: 'application/json',
        },
      });

      let downloadProgress = Progress.FAILED;
      if(projectResponse.ok) {
        const projectData: ProjectDTO = await projectResponse.json();
        ((await tokenResponse.json())?.tokens ?? []).forEach((t: WordOrPartDTO) => {
          projectData.corpora = (projectData.corpora || []).map(c => c.id === t.corpusId ? {
            ...c,
            words: [...(c.words || []).filter(w => w.id !== t.id), t]
          } : c);
        });
        const currentTime = DateTime.now().toMillis();
        projectData.lastUpdated = currentTime;
        projectData.lastSyncTime = currentTime;
        const project: Project | undefined = projectData ? mapProjectDtoToProject(projectData, ProjectLocation.SYNCED) : undefined;
        console.log("project: ", project, projectData)
        if(!project) {
          setProgress(Progress.FAILED);
          return;
        }

        Array.from((await projectState.projectTable?.getProjects(true))?.values?.() ?? [])
          .map(p => p.id).includes(project.id)
          ? await projectState.projectTable?.update?.(project, true)
          : await projectState.projectTable?.save?.(project, true);

        downloadProgress = Progress.SUCCESS;
        const localProjects = await projectState.projectTable?.getProjects?.(true);
        setProjects(p => Array.from(localProjects?.values?.() ?? p));
        appCtx.setContainers((await getAvailableCorporaContainers({ projectState, setProjects, ...appCtx })));
      }
      setProgress(downloadProgress)
      return projectResponse;
    } catch (x) {
      cleanupRequest();
      setProgress(Progress.FAILED);
      setTimeout(() => {
        setProgress(Progress.IDLE);
      }, 5000);
    }
  };
  return {
    downloadProject,
    progress
  };
}
