/**
 * This file contains the ProjectsView Component which is responsible for the
 * Project Mode of the CA application.
 */
import {
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select, Stack,
  Theme, Toolbar,
  Tooltip,
  Typography
} from '@mui/material';
import React, { useContext, useEffect, useMemo } from 'react';
import ProjectDialog from './projectDialog';
import { Project } from '../../state/projects/tableManager';
import UploadAlignmentGroup from '../controlPanel/uploadAlignmentGroup';
import { DefaultProjectId } from '../../state/links/tableManager';
import { AppContext, THEME_PREFERENCE } from '../../App';
import { useCorpusContainers } from '../../hooks/useCorpusContainers';
import { LayoutContext } from '../../AppLayout';
import { Box } from '@mui/system';
import { CloudDownload, CloudOff, CloudSync, Computer, Refresh } from '@mui/icons-material';
import { useProjectsFromServer } from '../../api/projects/useProjectsFromServer';
import { ProjectLocation } from '../../common/data/project/project';
import { SyncProgress, useSyncProject } from '../../api/projects/useSyncProject';
import { DateTime } from 'luxon';
import { Progress } from '../../api/ApiModels';
import { ProfileAvatar, userState } from '../profileAvatar/profileAvatar';
import AppBar from '@mui/material/AppBar';
import { grey } from '@mui/material/colors';
import { useDownloadProject } from '../../api/projects/useDownloadProject';
import { UserPreference } from '../../state/preferences/tableManager';
import { InitializationStates } from '../../workbench/query';

interface ProjectsViewProps {
  preferredTheme: 'night' | 'day' | 'auto';
  setPreferredTheme: Function;
}

const getPaletteFromProgress = (progress: Progress, theme: Theme) => {
  switch (progress) {
    case Progress.FAILED:
      return theme.palette.error.main;
    case Progress.IN_PROGRESS:
      return theme.palette.text.secondary;
    case Progress.IDLE:
    case Progress.SUCCESS:
    default:
      return theme.palette.primary.main;
  }
};

const ProjectsView: React.FC<ProjectsViewProps> = ({ preferredTheme, setPreferredTheme }) => {
  useContext(LayoutContext);
  const { preferences, projects: initialProjects, userStatus } = React.useContext(AppContext);
  const { refetch: refetchRemoteProjects, progress: remoteFetchProgress } = useProjectsFromServer({
    enabled: false // Prevents immediate and useEffect-based requerying
  });
  const [disableProjectButtons, setDisableProjectButtons] = React.useState(false);

  useEffect(() => {
    if (remoteFetchProgress === 0) {
      setDisableProjectButtons(false);
    } else {
      setDisableProjectButtons(true);
    }
  }, [remoteFetchProgress]);

  const isSignedIn = React.useMemo(() => (
    userStatus === userState.LoggedIn
  ), [userStatus]);

  const usingCustomEndpoint = useMemo(() => userStatus === userState.CustomEndpoint, [userStatus]);


  const projects = React.useMemo(() => initialProjects.filter(p => !!p?.name), [initialProjects]);

  const [openProjectDialog, setOpenProjectDialog] = React.useState(false);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);

  const selectProject = React.useCallback((project: Project) => {
    if (project) {
      setSelectedProjectId(project.id);
      setOpenProjectDialog(true);
    }
  }, [setSelectedProjectId, setOpenProjectDialog]);
  const unavailableProjectNames: string[] = React.useMemo(() => (
    projects.map(p => (p.name || '').trim())
  ), [projects]);

  return (
    <>
      <Grid container flexDirection="column" flexWrap={'nowrap'}
            sx={{ height: '100%', width: '100%', overflow: 'hidden' }}>
        <Box>

          {/* App Bar */}
          <AppBar
            position="static"
          >
            <Toolbar>
              <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
                Projects
              </Typography>
              <Grid item sx={{ px: 2 }}>
                {
                  (isSignedIn || usingCustomEndpoint) && (
                    <Button variant="text"
                            disabled={disableProjectButtons}
                            onClick={() => refetchRemoteProjects({ persist: true, currentProjects: projects })}>
                      <Grid container alignItems="center">
                        <Refresh sx={theme => ({
                          mr: 1,
                          mb: .5,
                          ...(disableProjectButtons ? {
                            '@keyframes rotation': {
                              from: { transform: 'rotate(0deg)' },
                              to: { transform: 'rotate(360deg)' }
                            },
                            animation: '2s linear infinite rotation',
                            fill: theme.palette.text.secondary
                          } : {})
                        })} />
                        <Typography variant="subtitle2" sx={theme => ({
                          textTransform: 'none',
                          fontWeight: 'bold',
                          color: disableProjectButtons ? theme.palette.text.secondary
                            : getPaletteFromProgress(remoteFetchProgress, theme)
                        })}>
                          {disableProjectButtons ? 'Refreshing Remote Projects...' : 'Refresh Remote Projects'}
                        </Typography>
                      </Grid>
                    </Button>
                  )
                }
              </Grid>
              <ProfileAvatar/>
            </Toolbar>
          </AppBar>
        </Box>

        {/* Projects */}
        <Grid container sx={{ width: '100%', paddingX: '1.1rem', overflow: 'auto' }}>
          {projects
            .sort((p1: Project) => p1?.id === DefaultProjectId ? -1 : projects.indexOf(p1))
            .map((project: Project) => (
              <ProjectCard
                key={`${project?.id ?? project?.name}-${project?.lastSyncTime}-${project?.updatedAt}`}
                project={project}
                onClick={disableProjectButtons ? () => {} : selectProject}
                currentProject={projects.find((p: Project) =>
                  p.id === preferences?.currentProject) ?? projects?.[0]}
                unavailableProjectNames={unavailableProjectNames}
                disableProjectButtons={disableProjectButtons}
              />
            ))}
        </Grid>

        <Stack direction={'row'}>
          {/* Theme Preference */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            paddingTop: '2.5rem',
            paddingLeft: '2.3rem'
          }}>
            <FormControl sx={{ width: 175 }}>
              <InputLabel id={'theme-label'}>Theme</InputLabel>
              <Select
                labelId={'theme-label'}
                id={'theme-select'}
                value={preferredTheme}
                label={'Theme'}
                onChange={({ target: { value } }) =>
                  setPreferredTheme(value as THEME_PREFERENCE)
                }
              >
                <MenuItem value={'auto' as THEME_PREFERENCE}>
                  Follow System
                </MenuItem>
                <MenuItem value={'night' as THEME_PREFERENCE}>Dark</MenuItem>
                <MenuItem value={'day' as THEME_PREFERENCE}>Light</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {/* Create New Button */}
          <Button
            variant="contained"
            onClick={() => setOpenProjectDialog(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 'bold',
              marginTop: '40px',
              marginLeft: '20px'
          }}
            disabled={disableProjectButtons}
          >Create New
          </Button>
        </Stack>
      </Grid>

      {/* Project Dialog */}
      <ProjectDialog
        open={openProjectDialog}
        projectId={selectedProjectId}
        closeCallback={() => {
          setOpenProjectDialog(false);
          setSelectedProjectId(null);
        }}
        unavailableProjectNames={
          unavailableProjectNames.filter(name =>
            name !== projects.find(p => p.id === selectedProjectId)?.name)
        }
        isSignedIn={isSignedIn}
      />
    </>
  );
};

interface ProjectCardProps {
  project: Project;
  currentProject: Project | undefined;
  onClick: (project: Project) => void;
  unavailableProjectNames: string[];
  disableProjectButtons: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project,
                                                   currentProject,
                                                   onClick,
                                                   unavailableProjectNames,
                                                   disableProjectButtons
                                                 }) => {
  useCorpusContainers();

  const { downloadProject, dialog: downloadProjectDialog } = useDownloadProject();
  const {
    sync: syncProject,
    progress: syncingProject,
    dialog: syncDialog,
    uniqueNameError,
    setUniqueNameError
  } = useSyncProject();

  const { setPreferences, projectState, preferences, userStatus } = React.useContext(AppContext);
  const isCurrentProject = React.useMemo(() => project.id === currentProject?.id, [project.id, currentProject?.id]);

  const isSignedIn = React.useMemo(() => userStatus === userState.LoggedIn || userStatus === userState.CustomEndpoint, [userStatus]);
  const usingCustomEndpoint = useMemo(() => userStatus === userState.CustomEndpoint, [userStatus]);

  const updateCurrentProject = React.useCallback(() => {
    projectState.linksTable.reset().catch(console.error);
    projectState.linksTable.setSourceName(project.id);
    setPreferences((p: UserPreference | undefined) => ({
      ...(p ?? {}) as UserPreference,
      currentProject: project.id,
      initialized: InitializationStates.UNINITIALIZED
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPreferences, preferences, project.id, projectState.userPreferenceTable, projectState.linksTable]);

  const syncLocalProjectWithServer = React.useCallback(() => {
    syncProject(project);
  }, [project, syncProject]);

  const cloudSyncInfo = useMemo(() => {
    const signedOutIcon = (
      <Grid container justifyContent="flex-end" alignItems="center">
        <Tooltip title="Sign in to connect to manage remote projects">
        <Button variant="text" disabled sx={{ textTransform: 'none' }}>
          <span style={{ color: grey['500'] }}>Unavailable</span>
          <CloudOff sx={theme => ({ fill: theme.palette.text.secondary, mb: .5, ml: .5 })} />
        </Button>
        </Tooltip>
      </Grid>
    );
    switch (project.location) {
      case ProjectLocation.LOCAL:
        return (
          (isSignedIn || usingCustomEndpoint) ? <Grid container justifyContent="flex-end" alignItems="center">
            <Button variant="text" disabled={![SyncProgress.IDLE, SyncProgress.FAILED].includes(syncingProject) || disableProjectButtons}
                    sx={{ textTransform: 'none' }} onClick={syncLocalProjectWithServer}>
              Upload Project
              <Computer sx={theme => ({ fill: disableProjectButtons ? theme.palette.text.secondary
                  : theme.palette.primary.main, mb: .5, ml: .5})} />
            </Button>
          </Grid> : signedOutIcon
        );
      case ProjectLocation.REMOTE:
        return (isSignedIn || usingCustomEndpoint) ? (
          <Grid container justifyContent="flex-end" alignItems="center">
            <Button variant="text" disabled={![SyncProgress.IDLE, SyncProgress.FAILED].includes(syncingProject) || disableProjectButtons}
                    sx={{ textTransform: 'none' }} onClick={() => downloadProject(project.id)}>
              Download Project
              <CloudDownload sx={theme => ({ fill: disableProjectButtons ? theme.palette.text.secondary
                  : theme.palette.primary.main, mb: .5, ml: .5 })} />
            </Button>
          </Grid>
        ) : signedOutIcon;
      case ProjectLocation.SYNCED:
      default:
        return (
          <Grid container flexDirection="column">
            <Grid container justifyContent="flex-end" alignItems="center">
              <Tooltip title="Synced with remote project">
                <CloudSync sx={theme => ({ ml: 1, fill: theme.palette.text.secondary })} />
              </Tooltip>
            </Grid>
          </Grid>
        );
    }
  }, [project.location, project.id, isSignedIn, syncingProject, syncLocalProjectWithServer, downloadProject, disableProjectButtons, usingCustomEndpoint]);

  const currentProjectIndicator = useMemo(() => {
    if (isCurrentProject) {
      return (<Typography variant="subtitle2">Current Project</Typography>);
    } else if (project.location !== ProjectLocation.REMOTE) {
      return (
        <Button variant="text" size="small" sx={{ textTransform: 'none' }}
                disabled={disableProjectButtons}
                onClick={e => {
                  e.preventDefault();
                  updateCurrentProject();
                }}
        >Open</Button>
      );
    } else {
      return <></>;
    }
  }, [isCurrentProject, project, updateCurrentProject, disableProjectButtons]);

  return (
    <>
      <Card sx={theme => ({
        height: 250, width: 250, m: 2, '&:hover': {
          boxShadow: (theme.palette as unknown as { mode: string; }).mode === 'dark'
            ? '0px 2px 4px -1px rgba(255,255,255,0.2), 0px 4px 5px 0px rgba(255,255,255,0.14), 0px 1px 10px 0px rgba(255,255,255,0.12)'
            : '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)'
        }, transition: 'box-shadow 0.25s ease', '*': { cursor: disableProjectButtons ? 'default'  : 'pointer' },
        position: 'relative',
        backgroundColor: theme.palette.primary.contrastText,
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
                        sx={{ textAlign: 'center', mt: 4 }}>{project.name}</Typography>
          </Grid>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              {currentProjectIndicator}
            </Grid>
            <Grid container alignItems="center" sx={{ height: 75, width: 'fit-content' }}>
              {project.location !== ProjectLocation.REMOTE ?
                <UploadAlignmentGroup
                  project={project}
                  size="small"
                  containers={[
                    ...(project.sourceCorpora ? [project.sourceCorpora] : []),
                    ...(project.targetCorpora ? [project.targetCorpora] : [])
                  ]}
                  isCurrentProject={isCurrentProject}
                  isSignedIn={isSignedIn}
                  disableProjectButtons={disableProjectButtons}
                /> : <></>}
            </Grid>
          </Grid>
          {
            (!!project.lastSyncTime && syncingProject !== SyncProgress.FAILED) && (
              <Typography variant="caption" color="text.secondary" sx={{ position: 'absolute', bottom: 0, left: 10 }}>
                <span style={{ fontWeight: 'bold' }}>Last sync:</span>
                &nbsp;{DateTime.fromJSDate(new Date(project.lastSyncTime)).toFormat('MMMM dd yyyy, hh:mm:ss a')}
              </Typography>
            )
          }
          {
            syncingProject === SyncProgress.FAILED && (
              <Typography variant="caption" color="error" sx={{ position: 'absolute', bottom: 0, left: 10 }}>
                There was an error uploading this project.
              </Typography>
            )
          }
        </CardContent>
      </Card>
      {syncDialog}
      {downloadProjectDialog}
      <ProjectDialog
        open={uniqueNameError}
        projectId={project.id}
        closeCallback={() => setUniqueNameError(false)}
        unavailableProjectNames={[project.name, ...unavailableProjectNames]}
        isSignedIn={isSignedIn}
      />
    </>
  );
};

export default ProjectsView;
