import { Grid, Card, CardContent, Typography, Button } from '@mui/material';
import React from 'react';
import { AppContext } from '../../App';
import ProjectDialog from './projectDialog';
import { Project } from '../../state/projects/tableManager';
import UploadAlignmentGroup from '../controlPanel/uploadAlignmentGroup';

interface ProjectsViewProps {

}

const ProjectsView: React.FC<ProjectsViewProps> = () => {
  const {appState: {projects}} = React.useContext(AppContext);
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
          <Button variant="contained" onClick={() => setOpenProjectDialog(true)} sx={{textTransform: 'none', fontWeight: 'bold'}}>Create New</Button>
        </Grid>
        <Grid container>
          {[...(projects.getProjects().values() || [])].map((project: Project) => (
            <ProjectCard key={project.id} project={project} onClick={selectProject} />
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
  onClick: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({project, onClick}) => {
  const { appState } = React.useContext(AppContext);

  return (
    <Card sx={{height: 250, width: 250, m: 2.5, "&:hover": {
      boxShadow: "0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)"
      }, transition: "box-shadow 0.25s ease", '*': {cursor: 'pointer'}}}>
      <CardContent sx={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', height: '100%'}}>
        <Grid container justifyContent="center" alignItems="center" sx={{height: '100%'}} onClick={() => onClick(project.id)}>
          <Typography variant="h6" sx={{textAlign: 'center', mt: 4}}>{project.name}</Typography>
        </Grid>
        <Grid item>
          <UploadAlignmentGroup
            size="small"
            containers={[
              ...(appState.sourceCorpora ? [appState.sourceCorpora] : []),
              ...(project.targetCorpora ? [project.targetCorpora] : [])
            ]}
          />
        </Grid>
      </CardContent>
    </Card>
  );
}

export default ProjectsView;
