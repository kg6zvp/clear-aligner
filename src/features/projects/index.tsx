import { Grid, Card, CardContent, Typography, Button } from '@mui/material';
import React, { useState } from 'react';
import ProjectDialog from './projectDialog';
import { Project } from '../../state/projects/tableManager';
import UploadAlignmentGroup from '../controlPanel/uploadAlignmentGroup';
import uuid from 'uuid-random';
import { DefaultProjectName, useGetAllLinks } from '../../state/links/tableManager';
import { AppContext } from '../../App';
import { UserPreference } from '../../state/preferences/tableManager';

interface ProjectsViewProps {}

const ProjectsView: React.FC<ProjectsViewProps> = () => {
  const {projects, preferences} = React.useContext(AppContext);

  const [getAllLinksKey, setGetAllLinksKey] = useState<string>();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result: allLinks } = useGetAllLinks(getAllLinksKey);

  const [openProjectDialog, setOpenProjectDialog] = React.useState(false);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);

  const selectProject = React.useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    setOpenProjectDialog(true);
  }, [setSelectedProjectId, setOpenProjectDialog]);

  return (
    <>
      <Grid container flexDirection="column" sx={{height: '100%', width: '100%', px: 5, pt: 2}}>
        <Grid container sx={{mb: 5, ml: 2.5}}>
          <Typography variant="h4" sx={{mr: 5, fontWeight: 'bold'}}>Projects</Typography>
          <Button
            variant="contained"
            onClick={() => setOpenProjectDialog(true)}
            sx={{textTransform: 'none', fontWeight: 'bold'}}
          >Create New</Button>
        </Grid>
        <Grid container>
          {projects.sort((p1: Project, p2: Project) =>
            p1.id === DefaultProjectName ? -1 : (p1.id || "").localeCompare(p2.id)
          ).map((project: Project) => (
            <ProjectCard
              key={project.id ?? project.name}
              project={project}
              onClick={selectProject}
              currentProject={projects.find((p: Project) => p.id === preferences?.currentProject) ?? projects?.[0]}
              setGetAllLinksKey={setGetAllLinksKey}
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
      />
    </>
  )
}

interface ProjectCardProps {
  project: Project;
  currentProject: Project | undefined;
  onClick: (id: string) => void;
  setGetAllLinksKey: CallableFunction;
}

const ProjectCard: React.FC<ProjectCardProps> = ({project, currentProject, onClick, setGetAllLinksKey}) => {
  const {setPreferences, projectState, preferences} = React.useContext(AppContext);
  const isCurrentProject = React.useMemo(() => project.id === currentProject?.id, [currentProject, project]);

  const updateCurrentProject = React.useCallback(() => {
    setPreferences((p: UserPreference | undefined) => {
      const updatedPreference = {...(preferences ?? {}), currentProject: project.id} as UserPreference;
      projectState.userPreferenceTable?.saveOrUpdate?.(updatedPreference);
      return updatedPreference;
    })
  }, [setPreferences, preferences, project.id, projectState.userPreferenceTable]);

  return (
    <Card sx={{height: 250, width: 250, m: 2.5, "&:hover": {
      boxShadow: "0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)"
      }, transition: "box-shadow 0.25s ease", '*': {cursor: 'pointer'}}}>
      <CardContent sx={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', height: '100%'}}>
        <Grid container justifyContent="center" alignItems="center" sx={{height: '100%'}} onClick={() => onClick(project.id)}>
          <Typography variant="h6" sx={{textAlign: 'center', mt: 4}}>{project.name}</Typography>
        </Grid>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            {
              isCurrentProject ? (
                <Typography variant="subtitle2">Current Project</Typography>
                ) : (
                <Button variant="text" size="small" sx={{textTransform: 'none'}}
                  onClick={e => {
                    e.preventDefault();
                    updateCurrentProject();
                  }}
                >Open</Button>
              )
            }
          </Grid>
          <Grid item>
            <UploadAlignmentGroup
              size="small"
              containers={[
                ...(project.sourceCorpora ? [project.sourceCorpora] : []),
                ...(project.targetCorpora ? [project.targetCorpora] : [])
              ]}
              allowImport={isCurrentProject}
              setGetAllLinksKey={() => setGetAllLinksKey(uuid())}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default ProjectsView;
