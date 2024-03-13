import React, { useEffect, useMemo, useState } from 'react';
import { Project, ProjectTable } from '../state/projects/tableManager';
import { UserPreference, UserPreferenceTable } from '../state/preferences/tableManager';
import { ProjectState } from '../state/databaseManagement';
import { LinksTable } from '../state/links/tableManager';
import { AppContextProps } from '../App';
import { useInterval } from 'usehooks-ts';

const useInitialization = () => {
  const isLoaded = React.useRef(false);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [preferences, setPreferences] = React.useState<UserPreference | undefined>()
  const [state, setState] = useState({} as ProjectState);
  const projectsIdList = useMemo<string>(() => JSON.stringify(projects.map(p => p.id).sort()), [projects]);

  useInterval(() => {
    state?.projectTable?.getProjects(true).then(res => {
      const newProjectsList = [...res!.values() ].sort();
      const newList = JSON.stringify(newProjectsList.map(p => p.id).sort());
      if (newList !== projectsIdList) {
        setProjects(newProjectsList);
      }
    });
  }, 5_000);

  useEffect(() => {
    if(!isLoaded.current) {
      const currLinksTable = state.linksTable ?? new LinksTable();
      const currProjectTable = state.projectTable ?? new ProjectTable();
      const currUserPreferenceTable = state.userPreferenceTable ?? new UserPreferenceTable();

      setState({
        ...state,
        linksTable: currLinksTable,
        projectTable: currProjectTable,
        userPreferenceTable: currUserPreferenceTable
      });
      const initializeProject = () => new Promise((resolve) => {
        let projects: Project[] = [];
        currProjectTable.getProjects(true).then(res => {
          projects = [...res!.values()];
          setProjects(projects);
          resolve(projects);
        });
      }).then(() => {
        currUserPreferenceTable.getPreferences(true).then((res: UserPreference | undefined) => {
          setPreferences({
            ...(res ?? {}) as UserPreference,
            currentProject: res?.currentProject ?? projects?.[0]?.id ?? ""
          });
          currLinksTable.setSourceName(res?.currentProject ?? projects?.[0]?.id ?? "default");
        });
      });
      initializeProject().catch(console.error);
      isLoaded.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    projectState: state,
    setProjectState: setState,
    preferences,
    setPreferences,
    projects,
    setProjects
  } as AppContextProps;
}

export default useInitialization;
