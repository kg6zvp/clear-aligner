import React, { useCallback, useContext, useMemo } from 'react';
import { useCorpusContainers } from '../../hooks/useCorpusContainers';
import { ADMIN_GROUP, useIsSignedIn } from '../../hooks/userInfoHooks';
import { useDownloadProject } from '../../api/projects/useDownloadProject';
import { SyncProgress, useSyncProject } from '../../api/projects/useSyncProject';
import { AppContext } from '../../App';
import { userState } from '../profileAvatar/profileAvatar';
import { UserPreference } from '../../state/preferences/tableManager';
import { InitializationStates } from '../../workbench/query';
import { Button, Card, CardActionArea, CardContent, Grid, Theme, Tooltip, Typography } from '@mui/material';
import { SystemStyleObject } from '@mui/system/styleFunctionSx/styleFunctionSx';
import { ProjectLocation } from '../../common/data/project/project';
import {
  CloudDoneOutlined,
  CloudOff,
  CloudOutlined,
  CollectionsBookmark,
  Computer,
  Download,
  Settings,
  Sync,
  Upload
} from '@mui/icons-material';
import { grey } from '@mui/material/colors';
import { RemovableTooltip } from '../../components/removableTooltip';
import ProjectSettings from './projectSettings';
import { Box } from '@mui/system';
import { DateTime } from 'luxon';
import ProjectCreationDialog from './projectCreationDialog';
import { Project } from '../../state/projects/tableManager';
import { currentProjectBorderIndicatorHeight, projectCardHeight, projectCardMargin, projectCardWidth } from './index';

/**
 * props for the project card component
 */
export interface ProjectCardProps {
  /**
   * project being represented by the project card
   */
  project: Project;
  /**
   * groups the current user belongs to
   */
  groups?: string[];
  /**
   * the currently open project
   */
  currentProject: Project | undefined;
  /**
   * callback when the user requests to open the project settings display (the {@link ProjectCard} component does not keep track of whether the dialog is open)
   * @param project project to open the settings dialog for
   */
  onOpenProjectSettings: (project?: Project) => void;
  /**
   * project names this can't be set to because they already exist
   */
  unavailableProjectNames: string[];
  /**
   * whether the project action buttons should be disabled (import/export/etc.)
   */
  disableProjectButtons: boolean;
  /**
   * whether the project settings display is currently enabled
   */
  isProjectDialogOpen: boolean;
}

/**
 * component displaying a project
 * @param project project being displayed
 * @param groups current groups the user belongs to
 * @param currentProject current project
 * @param onOpenProjectSettings callback for the project settings display
 * @param unavailableProjectNames unavailable names
 * @param disableProjectButtons whether project buttons should be disabled
 * @param isProjectDialogOpen whether the project settings display is being shown
 */
export const ProjectCard: React.FC<ProjectCardProps> = ({
                                                          project,
                                                          groups,
                                                          currentProject,
                                                          onOpenProjectSettings,
                                                          unavailableProjectNames,
                                                          disableProjectButtons,
                                                          isProjectDialogOpen
                                                        }) => {
  useCorpusContainers();

  const isAdmin = useMemo<boolean>(() => (groups ?? []).includes(ADMIN_GROUP), [groups]);

  const { downloadProject, dialog: downloadProjectDialog } = useDownloadProject();
  const {
    sync: syncProject,
    progress: syncingProject,
    dialog: syncDialog,
    uniqueNameError,
    setUniqueNameError
  } = useSyncProject();

  const { setPreferences, projectState, preferences, userStatus } = useContext(AppContext);
  const isCurrentProject = useMemo(() => project.id === currentProject?.id, [project.id, currentProject?.id]);

  const isSignedIn = useIsSignedIn();
  const usingCustomEndpoint = useMemo(() => userStatus === userState.CustomEndpoint, [userStatus]);

  const updateCurrentProject = useCallback(() => {
    projectState.linksTable.reset().catch(console.error);
    projectState.linksTable.setSourceName(project.id);
    setPreferences((p: UserPreference | undefined) => ({
      ...(p ?? {}) as UserPreference,
      currentProject: project.id,
      initialized: InitializationStates.UNINITIALIZED
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPreferences, preferences, project.id, projectState.userPreferenceTable, projectState.linksTable]);

  const syncLocalProjectWithServer = useCallback(() => {
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
  }, [project.location]);

  const serverActionButton = useMemo(() => {
    const signedOutIcon = (
      <Grid container justifyContent="flex-end" alignItems="center">
        <Tooltip title="Sign in to connect to manage remote projects">
          <span>
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
          </span>
        </Tooltip>
      </Grid>
    );
    if (!(isSignedIn || usingCustomEndpoint)) {
      return signedOutIcon;
    }

    const tooltipText = (() => {
      switch (project.location) {
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
          const containers = [project.sourceCorpora, project.targetCorpora];
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
          if (!isAdmin) return (<></>);
          return (
            <Button variant="text"
                    disabled={buttonDisabled || !isAdmin}
                    sx={buttonStyle}
                    onClick={(e) => {
                      e.stopPropagation();
                      syncLocalProjectWithServer();
                    }}>
              <Upload sx={iconStyle} />
            </Button>
          );
        case ProjectLocation.REMOTE:
          return (
            <Button variant="text"
                    disabled={buttonDisabled}
                    sx={buttonStyle}
                    onClick={(e) => {
                      e.stopPropagation();
                      void downloadProject(project.id);
                    }}>
              <Download sx={iconStyle} />
            </Button>
          );
        case ProjectLocation.SYNCED:
          return (
            <Button variant="text"
                    disabled={buttonDisabled}
                    sx={buttonStyle}
                    onClick={(e) => {
                      e.stopPropagation();
                      syncProject(project);
                    }}>
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
  }, [isSignedIn, usingCustomEndpoint, syncingProject, disableProjectButtons, syncLocalProjectWithServer, downloadProject, syncProject, project, isAdmin]);

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
              e.stopPropagation();
              onOpenProjectSettings(project);
            }}
    ><Settings /></Button>
  ), [project, onOpenProjectSettings, disableProjectButtons]);

  const cardContents: JSX.Element = (
    <CardContent sx={{
      margin: projectCardMargin,
      display: 'flex',
      flexDirection: 'column',
      height: isCurrentProject ? `calc(100% + ${currentProjectBorderIndicatorHeight})` : '100%'
    }}>
      {isProjectDialogOpen ?
        (<>
          <ProjectSettings closeCallback={() => onOpenProjectSettings(undefined)} projectId={project.id}
                           isSignedIn={isSignedIn} />
        </>) : (
          <>
            <Box
              id={'project-title'}
              sx={{
                position: 'absolute',
                width: `calc(100% - 10 * ${projectCardMargin})`,
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
            <Grid container justifyContent="center" alignItems="center" sx={{ height: '100%' }}>
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
                ...(isCurrentProject ? {
                  transform: `translate(0, 7px)`
                } : {})
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
  );

  return (
    <>
      <Card
        variant={'outlined'}
        sx={theme => ({
          width: projectCardWidth,
          height: projectCardHeight,
          m: '3px',
          backgroundColor: theme.palette.primary.contrastText,
          ...(isCurrentProject ? {
            borderBottomWidth: currentProjectBorderIndicatorHeight,
            borderBottomStyle: 'solid',
            borderBottomColor: 'success.main'
          } : {}),
          position: 'relative'
        })}>
        {(project.location !== ProjectLocation.REMOTE && !isCurrentProject && !isProjectDialogOpen)
          ? <>
            <CardActionArea
              component={'div'}
              sx={{
                width: '100%',
                height: '100%'
              }}
              onClick={(e) => {
                e.preventDefault();
                !isCurrentProject && updateCurrentProject();
              }}>
              {cardContents}
            </CardActionArea>
          </>
          : <>
            {cardContents}
          </>
        }
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
