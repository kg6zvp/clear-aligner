/**
 * This file contains the ProjectsView Component which is responsible for the
 * Project Mode of the CA application.
 */
import { Button, Card, CardContent, Grid, Typography } from '@mui/material';
import React, { useContext, useEffect, useMemo } from 'react';
import ProjectDialog from './projectDialog';
import { Project } from '../../state/projects/tableManager';
import UploadAlignmentGroup from '../controlPanel/uploadAlignmentGroup';
import { DefaultProjectName } from '../../state/links/tableManager';
import { AppContext } from '../../App';
import { UserPreference } from '../../state/preferences/tableManager';
import { useCorpusContainers } from '../../hooks/useCorpusContainers';
import { InitializationStates } from '../../workbench/query';
import { LayoutContext } from '../../AppLayout';
import { Cloud, CloudSync, Computer } from '@mui/icons-material';
import { useProjectsFromServer } from '../../api/projects/useProjectsFromServer';
import { ProjectDTO } from '../../common/data/project/project';
import { SyncProgress, useSyncProjects } from '../../api/projects/useSyncProject';
import { DateTime } from 'luxon';
import useBusyDialog from '../../utils/useBusyDialog';

export interface LocalAndRemoteProject {
  local?: Project;
  remote?: ProjectDTO;
}

interface ProjectsViewProps {
}

const ProjectsView: React.FC<ProjectsViewProps> = () => {
  const { projects: localProjects, preferences } = React.useContext(AppContext);
  const [openProjectDialog, setOpenProjectDialog] = React.useState(false);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const selectProject = React.useCallback((project: LocalAndRemoteProject) => {
    if (project.local) {
      setSelectedProjectId(project.local.id);
      setOpenProjectDialog(true);
    }
  }, [setSelectedProjectId, setOpenProjectDialog]);
  const layoutCtx = useContext(LayoutContext);

  const { projects: allRemoteProjects, refetch: refetchRemoteProjects } = useProjectsFromServer({});

  const projects = useMemo<LocalAndRemoteProject[]>(() => {
    const projectMap: Map<string, LocalAndRemoteProject> = new Map();

    localProjects
      .forEach((local) => {
        projectMap.set(local.id, { local });
      });
    allRemoteProjects
      .filter(remote => remote.id)
      .forEach((remote) => {
        projectMap.set(remote.name === 'default' ? remote.name : remote.id!, {
          ...(projectMap.get(remote.name === 'default' ? remote.name : remote.id!) || {}),
          remote
        });
      });
    return Array.from(projectMap.values());
  }, [localProjects, allRemoteProjects]);

  const unavailableProjectNames: string[] = React.useMemo(() => (
    Array.from(new Set([...localProjects, ...allRemoteProjects].map(p => (p.name || '').trim())))
  ), [localProjects, allRemoteProjects]);

  useEffect(() => {
    layoutCtx.setMenuBarDelegate(
      <Typography sx={{ textAlign: 'center' }}>
        Projects
      </Typography>
    );
  }, [layoutCtx, preferences?.currentProject]);

  return (
    <>
      <Grid container flexDirection="column" flexWrap={'nowrap'}
            sx={{ height: '100%', width: '100%', paddingTop: '.1rem', overflow: 'hidden' }}>
        <Grid container sx={{ marginBottom: '.25rem', paddingX: '1.1rem', marginLeft: '1.1rem' }}>
          <Typography variant="h4" sx={{ marginRight: 5, fontWeight: 'bold' }}>Projects</Typography>
          <Button
            variant="contained"
            onClick={() => setOpenProjectDialog(true)}
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          >Create New</Button>
        </Grid>
        <Grid container sx={{ width: '100%', paddingX: '1.1rem', overflow: 'auto' }}>
          {projects
            .sort((p1: LocalAndRemoteProject) => p1.local?.id === DefaultProjectName ? -1 : projects.indexOf(p1))
            .map((project: LocalAndRemoteProject) => (
              <ProjectCard
                key={`${project.local?.id ?? project.remote?.name}-${(project.local?.targetCorpora?.corpora ?? [])?.find(c => c.lastSyncTime)?.lastSyncTime}`}
                project={project}
                onClick={selectProject}
                refetchRemoteProjects={refetchRemoteProjects}
                currentProject={projects.filter(({ local }) => !!local)
                  .find((p: LocalAndRemoteProject) =>
                    p.local?.id === preferences?.currentProject) ?? projects?.[0]}
              />
            ))}
        </Grid>
      </Grid>
      <ProjectDialog
        open={openProjectDialog}
        projectId={selectedProjectId}
        closeCallback={() => {
          setOpenProjectDialog(false);
          setSelectedProjectId(null);
        }}
        unavailableProjectNames={unavailableProjectNames}
      />
    </>
  );
};

interface ProjectCardProps {
  project: LocalAndRemoteProject;
  currentProject: LocalAndRemoteProject | undefined;
  onClick: (project: LocalAndRemoteProject) => void;
  refetchRemoteProjects: CallableFunction;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, currentProject, refetchRemoteProjects, onClick }) => {
  useCorpusContainers();


  const { sync: syncProject, progress: syncingProjects } = useSyncProjects();

  const busyDialog = useBusyDialog(
    syncingProjects === SyncProgress.IN_PROGRESS ? 'Syncing projects...' : undefined
  );

  const { setPreferences, projectState, preferences } = React.useContext(AppContext);
  const isCurrentProject = React.useMemo(() => project.local?.id === currentProject?.local?.id, [project.local?.id, currentProject?.local?.id]);

  const updateCurrentProject = React.useCallback(() => {
    projectState.linksTable.reset().catch(console.error);
    projectState.linksTable.setSourceName(project.local!.id);
    setPreferences((p: UserPreference | undefined) => ({
      ...(p ?? {}) as UserPreference,
      currentProject: project.local!.id,
      initialized: InitializationStates.UNINITIALIZED
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPreferences, preferences, project.local?.id, projectState.userPreferenceTable, projectState.linksTable]);

  const syncLocalProjectWithServer = React.useCallback(() => {
    if (project.local) {
      syncProject(project.local).then(() => refetchRemoteProjects()).catch(console.error);
    }
  }, [project, refetchRemoteProjects, syncProject]);

  const lastSyncTime = React.useMemo(() => (
    (project.local?.targetCorpora?.corpora ?? []).find(c => !!c.lastSyncTime)?.lastSyncTime
  ), [project]);

  const cloudSyncInfo = useMemo(() => {
    if (!project.remote && !lastSyncTime) {
      return (
        <Grid container justifyContent="flex-end" alignItems="center">
          <Button variant="text" disabled={![SyncProgress.IDLE, SyncProgress.FAILED].includes(syncingProjects)} sx={{ textTransform: 'none' }} onClick={syncLocalProjectWithServer}>Sync
            Project</Button>
          <Computer sx={theme => ({ fill: theme.palette.text.secondary })} />
        </Grid>
      );
    } else if (!project.local && project.remote) {
      return (
        <Grid container justifyContent="flex-end" alignItems="center">
          <Typography variant="subtitle2" sx={{ mr: 1 }}>Remote Project</Typography>
          <Cloud sx={theme => ({ fill: theme.palette.text.secondary })} />
        </Grid>
      );
    } else {
      return (
        <Grid container flexDirection="column">
          <Grid container justifyContent="flex-end" alignItems="center">
            {
              lastSyncTime === (project.local?.targetCorpora?.corpora ?? []).find(c => !!c.lastUpdated)?.lastUpdated ? (
                <Typography variant="subtitle2" sx={{ mr: 1 }}>Project Synced</Typography>
              ) : (
                <Button variant="text" disabled={![SyncProgress.IDLE, SyncProgress.FAILED].includes(syncingProjects)} sx={{ textTransform: 'none' }} onClick={syncLocalProjectWithServer}>Sync
                  Project</Button>
              )
            }
            <CloudSync sx={theme => ({ fill: theme.palette.text.secondary })} />
          </Grid>
        </Grid>
      );
    }
  }, [project.local, project.remote, lastSyncTime, syncLocalProjectWithServer, syncingProjects]);

  const currentProjectIndicator = useMemo(() => {
    if (isCurrentProject) {
      return (<Typography variant="subtitle2">Current Project</Typography>);
    } else if (project.local) {
      return (<Button variant="text" size="small" sx={{ textTransform: 'none' }}
                      onClick={e => {
                        e.preventDefault();
                        updateCurrentProject();
                      }}
      >Open</Button>);
    } else if (!project.local && project.remote) {
      return (<Button variant="text" size="small" sx={{ textTransform: 'none' }}
                      onClick={e => {
                        throw new Error('NOT IMPLEMENTED: TODO');
                      }}
      >Open Remote</Button>);
    }
  }, [isCurrentProject, project.local, project.remote, updateCurrentProject]);

  return (
    <>
      <Card sx={theme => ({
        height: 250, width: 250, m: 2.5, '&:hover': {
          boxShadow: (theme.palette as unknown as { mode: string; }).mode === 'dark'
            ? '0px 2px 4px -1px rgba(255,255,255,0.2), 0px 4px 5px 0px rgba(255,255,255,0.14), 0px 1px 10px 0px rgba(255,255,255,0.12)'
            : '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)'
        }, transition: 'box-shadow 0.25s ease', '*': { cursor: 'pointer' },
        position: 'relative'
      })}>
        <CardContent sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          height: '100%'
        }}>
          {cloudSyncInfo}
          <Grid container justifyContent="center" alignItems="center" sx={{ height: '100%' }}
                onClick={() => onClick(project)}>
            <Typography variant="h6"
                        sx={{ textAlign: 'center', mt: 4 }}>{project.local?.name ?? project.remote?.name}</Typography>
          </Grid>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              {currentProjectIndicator}
            </Grid>
            <Grid item>
              {project.local ?
                <UploadAlignmentGroup
                  projectId={project.local!.id}
                  size="small"
                  containers={[
                    ...(project.local!.sourceCorpora ? [project.local!.sourceCorpora] : []),
                    ...(project.local!.targetCorpora ? [project.local!.targetCorpora] : [])
                  ]}
                  allowImport={isCurrentProject}
                />
                : <></>}
            </Grid>
          </Grid>
          {
            (lastSyncTime && syncingProjects !== SyncProgress.FAILED) && (
              <Typography variant="caption" color="text.secondary" sx={{ position: 'absolute', bottom: 0, left: 10 }}>
                Synced On:&nbsp;{DateTime.fromJSDate(new Date(lastSyncTime)).toFormat('MM/dd/yyyy hh:mm:ss a')}
              </Typography>
            )
          }
          {
            syncingProjects === SyncProgress.FAILED && (
              <Typography variant="caption" color="error" sx={{ position: 'absolute', bottom: 0, left: 10 }}>
                There was an error uploading this project.
              </Typography>
            )
          }
        </CardContent>
      </Card>
      {syncingProjects === SyncProgress.IN_PROGRESS && busyDialog}
    </>
  );
};

export default ProjectsView;
