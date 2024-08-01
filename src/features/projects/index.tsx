/**
 * This file contains the ProjectsView Component which is responsible for the
 * Project Mode of the CA application.
 */
import {
  Button,
  Card, CardActionArea, CardActions,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select, Stack,
  Theme, Tooltip,
  Typography
} from '@mui/material';
import React, { useContext, useEffect, useMemo } from 'react';
import ProjectCreationDialog from './projectCreationDialog';
import { Project } from '../../state/projects/tableManager';
import { DefaultProjectId } from '../../state/links/tableManager';
import { AppContext, THEME_PREFERENCE } from '../../App';
import { useCorpusContainers } from '../../hooks/useCorpusContainers';
import { LayoutContext } from '../../AppLayout';
import { Box } from '@mui/system';
import {
  CloudDoneOutlined,
  CloudOff,
  CloudOutlined,
  CollectionsBookmark,
  Computer, Download, LibraryAdd,
  Refresh, Settings, Sync, Upload
} from '@mui/icons-material';
import { useProjectsFromServer } from '../../api/projects/useProjectsFromServer';
import { ProjectLocation } from '../../common/data/project/project';
import { SyncProgress, useSyncProject } from '../../api/projects/useSyncProject';
import { DateTime } from 'luxon';
import { Progress } from '../../api/ApiModels';
import { ProfileAvatar, userState } from '../profileAvatar/profileAvatar';
import { grey } from '@mui/material/colors';
import { useDownloadProject } from '../../api/projects/useDownloadProject';
import { UserPreference } from '../../state/preferences/tableManager';
import { InitializationStates } from '../../workbench/query';
import { SystemStyleObject } from '@mui/system/styleFunctionSx/styleFunctionSx';
import { RemovableTooltip } from '../../components/removableTooltip';
import ProjectSettings from './projectSettings';

export interface ProjectsViewProps {
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

  const selectProject = React.useCallback((project?: Project) => {
    if (project) {
      setSelectedProjectId(project.id);
      setOpenProjectDialog(true);
    } else {
      setSelectedProjectId(null);
      setOpenProjectDialog(false);
    }
  }, [setSelectedProjectId, setOpenProjectDialog]);
  const unavailableProjectNames: string[] = React.useMemo(() => (
    projects.map(p => (p.name || '').trim())
  ), [projects]);

  return (
    <>
      <Grid container flexDirection="column" flexWrap={'nowrap'}
            sx={{ height: '100%', width: '100%', paddingTop: '.1rem', overflow: 'hidden' }}>
        <Grid container justifyContent="space-between" alignItems="center"
              sx={{ marginBottom: '.25rem', paddingX: '1.1rem', paddingLeft: projectCardMargin, width: `calc(100% + ${projectCardMargin})` }}>
          <Grid container sx={{ width: 'fit-content' }}>
            <Typography
              variant="h4"
              color={'primary'}
              sx={{ marginRight: 5, fontWeight: 'bold' }}>Projects</Typography>
          </Grid>
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
            <ProfileAvatar/>
          </Grid>
        </Grid>
        <Grid
          container
          sx={{
            width: `100%`,
            overflowX: 'hidden',
            overflowY: 'auto',
        }}>
          <Grid
            container
            sx={{
              display: 'flex',
              flexDirection: 'row',
              maxWidth: '1400px',
              letterSpacing: '12px',
            }}>
            <CreateProjectCard
              projectId={selectedProjectId}
              onClick={(e) => {
                e.preventDefault();
                setSelectedProjectId(null);
                setOpenProjectDialog(true);
              }}
              unavailableProjectNames={
                unavailableProjectNames.filter(name =>
                  name !== projects.find(p => p.id === selectedProjectId)?.name)
              }
              open={openProjectDialog}
              closeCallback={() => {
                setOpenProjectDialog(false);
                setSelectedProjectId(null);
              }}
              isSignedIn={isSignedIn}
            />
            {projects
              .sort((p1: Project) => p1?.id === DefaultProjectId ? -1 : projects.indexOf(p1))
              .map((project: Project) => (
                <ProjectCard
                  key={`${project?.id ?? project?.name}-${project?.lastSyncTime}-${project?.updatedAt}`}
                  project={project}
                  onOpenProjectSettings={disableProjectButtons ? () => {} : selectProject}
                  currentProject={projects.find((p: Project) =>
                    p.id === preferences?.currentProject) ?? projects?.[0]}
                  unavailableProjectNames={unavailableProjectNames}
                  disableProjectButtons={disableProjectButtons}
                  isProjectDialogOpen={selectedProjectId === project.id}
                />
              ))}
          </Grid>
        </Grid>

        <Stack direction={'row'}>
          {/* Theme Preference */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            paddingTop: '8px',
            paddingBottom: projectCardMargin,
            paddingLeft: projectCardMargin
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
        </Stack>
      </Grid>
    </>
  );
};

/**
 * margin used by project cards
 */
const projectCardMargin = '4px';

export const CreateProjectCard: React.FC<{
  onClick?: (e: React.MouseEvent) => void,
  projectId: string | null,
  unavailableProjectNames?: string[],
  open: boolean,
  closeCallback: () => void,
  isSignedIn: boolean
}> = ({ onClick, projectId, unavailableProjectNames, open, closeCallback, isSignedIn }) => {
  return (<>
    <Card
      onClick={(e) => onClick?.(e)}
      sx={theme => ({
        width: 394,
        height: 320,
        m: projectCardMargin,
        '&:hover': {
          boxShadow: (theme.palette as unknown as { mode: string; }).mode === 'dark'
            ? '0px 2px 4px -1px rgba(255,255,255,0.2), 0px 4px 5px 0px rgba(255,255,255,0.14), 0px 1px 10px 0px rgba(255,255,255,0.12)'
            : '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)'
        },
        transition: 'box-shadow 0.25s ease',
        '*': {
          cursor: 'default'
        },
        position: 'relative'
      })}>
      <CardContent sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyItems: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%'
      }}>
        <Grid container justifyContent="center" alignItems="center" sx={{
          height: '100%',
          margin: '0 auto'
        }}>
          <LibraryAdd color={'primary'} />
        </Grid>
      </CardContent>
    </Card>

    {/* Project Dialog */}
    <ProjectCreationDialog
      projectId={null}
      unavailableProjectNames={unavailableProjectNames}
      open={!projectId && open}
      closeCallback={closeCallback}
      isSignedIn={isSignedIn}
    />
  </>);
}

export interface ProjectCardProps {
  project: Project;
  currentProject: Project | undefined;
  onOpenProjectSettings: (project?: Project) => void;
  unavailableProjectNames: string[];
  disableProjectButtons: boolean;
  isProjectDialogOpen: boolean;
}

const currentProjectBorderIndicatorHeight = '4px';

export const ProjectCard: React.FC<ProjectCardProps> = ({
                                                          project,
                                                          currentProject,
                                                          onOpenProjectSettings,
                                                          unavailableProjectNames,
                                                          disableProjectButtons,
                                                          isProjectDialogOpen
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

  const locationIndicator = useMemo<JSX.Element>(() => {
    const propCompute = (theme: Theme): SystemStyleObject<Theme> => ({
      fill: theme.palette.text.secondary,
      mt: .5
    });

    switch (project.location) {
      case ProjectLocation.LOCAL:
        return (<Computer sx={propCompute} />);
      case ProjectLocation.REMOTE:
        return (<CloudOutlined sx={propCompute} />);
      case ProjectLocation.SYNCED:
        return (<CloudDoneOutlined sx={propCompute} />);
    }
  }, [project.location, isCurrentProject]);

  const serverActionButton = useMemo(() => {
    const signedOutIcon = (
      <Grid container justifyContent="flex-end" alignItems="center">
        <Tooltip title="Sign in to connect to manage remote projects">
          <Button
            variant="text"
            disabled
            sx={{
              margin: 0,
              padding: 0,
              textTransform: 'none',
              minWidth: '0px !important'
            }}>
            <span style={{ color: grey['500'] }}>Unavailable</span>
            <CloudOff sx={theme => ({ fill: theme.palette.text.secondary, mb: .5, ml: .5 })} />
          </Button>
        </Tooltip>
      </Grid>
    );
    if (!(isSignedIn || usingCustomEndpoint)) {
      return signedOutIcon;
    }

    const tooltipText = (() => {
      switch(project.location) {
        case ProjectLocation.LOCAL:
          return `Upload ${project.name}`;
        case ProjectLocation.REMOTE:
          return `Download ${project.name}`;
        case ProjectLocation.SYNCED:
          return `Sync ${project.name}`;
        default:
          return '';
      }
    })();

    const buttonDisabled: boolean = (() => {
      switch (project.location) {
        case ProjectLocation.SYNCED:
          if (!project) {
            return true;
          }
          if (disableProjectButtons) {
            return true;
          }
          const containers = [ project.sourceCorpora, project.targetCorpora ];
          if (!isSignedIn || containers.length < 1) {
            return true;
          }
          if ((project.updatedAt ?? 0) > (project.lastSyncTime ?? 0)) {
            return false;
          }
          if ((project.serverUpdatedAt ?? 0) > (project.lastSyncServerTime ?? 0)) {
            return false;
          }
          return !([...(project.sourceCorpora?.corpora ?? []), ...(project.targetCorpora?.corpora ?? [])]
            .some((corpus) => !!corpus.updatedSinceSync));
        default:
          return ![SyncProgress.IDLE, SyncProgress.FAILED].includes(syncingProject) || disableProjectButtons;
      }
    })();

    const actionButton = (() => {
      const buttonStyle = {
        margin: 0,
        padding: 0,
        textTransform: 'none',
        minWidth: '0px !important'
      };
      const iconStyle = (theme: Theme) => ({
        fill: buttonDisabled ? theme.palette.text.secondary : theme.palette.primary.main
      });
      switch (project.location) {
        case ProjectLocation.LOCAL:
          return (
            <Button variant="text"
                    disabled={buttonDisabled}
                    sx={buttonStyle}
                    onClick={syncLocalProjectWithServer}>
              <Upload sx={iconStyle} />
            </Button>
          );
        case ProjectLocation.REMOTE:
          return (
            <Button variant="text"
                    disabled={buttonDisabled}
                    sx={buttonStyle}
                    onClick={() => downloadProject(project.id)}>
              <Download sx={iconStyle} />
            </Button>
          );
        case ProjectLocation.SYNCED:
          return (
            <Button variant="text"
                    disabled={buttonDisabled}
                    sx={buttonStyle}
                    onClick={() => syncProject(project)}>
              <Sync sx={iconStyle} />
            </Button>
          );
        default:
          return (<></>);
      }
    })();

    return (
      <RemovableTooltip
        removed={buttonDisabled}
        title={tooltipText}>
        {actionButton}
      </RemovableTooltip>
    );
  }, [isSignedIn, usingCustomEndpoint, syncingProject, disableProjectButtons, syncLocalProjectWithServer, downloadProject, syncProject, project, project.name]);

  const settingsButton = useMemo(() => (
    <Button variant="text"
            size="small"
            sx={{
              margin: 0,
              padding: 0,
              textTransform: 'none',
              minWidth: '0px !important'
            }}
            disabled={disableProjectButtons}
            onClick={e => {
              onOpenProjectSettings(project);
            }}
    ><Settings/></Button>
  ), [project, onOpenProjectSettings, disableProjectButtons]);

  return (
    <>
      <Card sx={theme => ({
        width: 394,
        height: 320,
        m: projectCardMargin,
        ...(isCurrentProject ? {
          borderBottomWidth: currentProjectBorderIndicatorHeight,
          borderBottomStyle: 'solid',
          borderBottomColor: 'success.main'
        } : {}),
        '&:hover': {
          boxShadow: (theme.palette as unknown as { mode: string; }).mode === 'dark'
            ? '0px 2px 4px -1px rgba(255,255,255,0.2), 0px 4px 5px 0px rgba(255,255,255,0.14), 0px 1px 10px 0px rgba(255,255,255,0.12)'
            : '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)'
        },
        transition: 'box-shadow 0.25s ease',
        '*': {
          cursor: disableProjectButtons ? 'default' : 'pointer'
        },
        position: 'relative'
      })}>
        <CardContent sx={{
          margin: 1.2,
          display: 'flex',
          flexDirection: 'column',
          height: isCurrentProject ? `calc(100% + ${currentProjectBorderIndicatorHeight})` : '100%',
          width: `calc(100% - 4 * ${projectCardMargin})`,
        }}>
          {isProjectDialogOpen ?
            (<>
              <ProjectSettings closeCallback={() => onOpenProjectSettings(undefined)} projectId={project.id} isSignedIn={isSignedIn} />
            </>) : (
              <>
                <Box
                  id={'project-title'}
                  sx={{
                    position: 'absolute',
                    width: `calc(100% - 12 * ${projectCardMargin})`,
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    fontWeight: 'fontWeightMedium'
                  }}>
                  <Typography
                    sx={{ color: 'text.primary' }}
                    variant={'h6'}>
                    {project.name}
                  </Typography>
                  {locationIndicator}
                </Box>
                <Grid container justifyContent="center" alignItems="center" sx={{ height: '100%' }}
                      onClick={(e) => {
                        e.preventDefault();
                        !isCurrentProject && updateCurrentProject();
                      }}>
                  <Typography variant="h6"
                              sx={{ textAlign: 'center', mt: 4 }}>
                    <CollectionsBookmark sx={theme => ({
                      color: theme.palette.text.secondary
                    })} />
                  </Typography>
                </Grid>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    fontWeight: 'fontWeightMedium',
                    marginBottom: `calc(${projectCardMargin}/2)`,
                  }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'flex-end',
                      alignItems: 'initial'
                    }}>
                    {settingsButton}
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'flex-end',
                      alignItems: 'initial'
                    }}>
                    <Box
                      sx={{
                        height: '100%',
                        marginRight: '1em'
                      }}>
                      {
                        (!!project.lastSyncTime && syncingProject !== SyncProgress.FAILED) && (
                          <Typography
                            variant="caption"
                            color="text.secondary">
                            <span style={{ fontWeight: 'bold' }}>Last sync</span>
                            &nbsp;{DateTime.fromJSDate(new Date(project.lastSyncTime)).toFormat('MMMM dd yyyy, hh:mm:ss a')}
                          </Typography>
                        )
                      }
                      {
                        syncingProject === SyncProgress.FAILED && (
                          <Typography
                            variant="caption"
                            color="error">
                            There was an error uploading this project.
                          </Typography>
                        )
                      }
                    </Box>
                    {serverActionButton}
                  </Box>
                </Box>
              </>
            )}
        </CardContent>
      </Card>
      {syncDialog}
      {downloadProjectDialog}
      <ProjectCreationDialog
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
