import React, { useCallback, useEffect, useState } from 'react';
import { Project, ProjectTable } from '../state/projects/tableManager';
import { UserPreference, UserPreferenceTable } from '../state/preferences/tableManager';
import { ProjectState } from '../state/databaseManagement';
import { DefaultProjectName, LinksTable } from '../state/links/tableManager';
import { AppContextProps } from '../App';
import { Containers } from '../hooks/useCorpusContainers';
import { AlignmentSide } from '../structs';
import { getAvailableCorporaContainers } from '../workbench/query';

const useInitialization = () => {
  const isLoaded = React.useRef(false);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [preferences, setPreferences] = React.useState<UserPreference | undefined>();
  const [state, setState] = useState({} as ProjectState);
  const [ containers, setContainers ] = useState<Containers>({});

  const setUpdatedPreferences = useCallback((updatedPreferences?: UserPreference) => {
    updatedPreferences && state.userPreferenceTable?.saveOrUpdate(updatedPreferences);
  }, [state.userPreferenceTable]);

  useEffect(() => {
    setUpdatedPreferences(preferences);
  }, [preferences, setUpdatedPreferences]);

  useEffect(() => {
    const loadContainers = async () => {
      const newContainers = (await getAvailableCorporaContainers({
          projectState: state,
          setProjectState: setState,
          preferences,
          setPreferences,
          projects,
          setProjects
        } as AppContextProps))
        .reduce((container, currentValue): Containers => {
          if (currentValue.id === AlignmentSide.SOURCE) {
            container.sourceContainer = currentValue;
          } else if (currentValue.id === AlignmentSide.TARGET) {
            container.targetContainer = currentValue;
          }
          return container;
        }, { sourceContainer: undefined, targetContainer: undefined } as Containers);
      setContainers(newContainers);
    }
    void loadContainers();
  }, [preferences?.currentProject, setContainers]);

  useEffect(() => {
    if(!isLoaded.current && !projects.length) {
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
        currProjectTable.getProjects(true).then(res => {
          let projects: Project[] = [];
          projects = [...res!.values()];
          isLoaded.current = !!projects.length;
          setProjects(projects);
          resolve(projects);
        });
      }).then(() => {
        currUserPreferenceTable.getPreferences(true).then((res: UserPreference | undefined) => {
          setPreferences({
            ...(res ?? {}) as UserPreference,
            currentProject: res?.currentProject
              ?? projects?.[0]?.id
              ?? DefaultProjectName
          });
          currLinksTable.setSourceName(res?.currentProject
            ?? projects?.[0]?.id
            ?? DefaultProjectName);
        });
      });
      initializeProject().catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  return {
    projectState: state,
    setProjectState: setState,
    preferences,
    setPreferences,
    projects,
    setProjects,
    containers
  } as AppContextProps;
};

export default useInitialization;
