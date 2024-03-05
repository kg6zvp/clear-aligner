import React from 'react';
import {
  Autocomplete,
  Button,
  Dialog, DialogActions,
  DialogContent,
  DialogTitle,
  FormGroup,
  Grid,
  IconButton, MenuItem,
  TextField,
  Typography,
  Select,
  FormControl,
  Box, Modal
} from '@mui/material';
import { Close, DeleteOutline } from '@mui/icons-material';
import ISO6393 from 'utils/iso-639-3.json';
import { VirtualTableLinks } from '../../state/links/tableManager';
import { AppContext } from '../../App';
import { Project } from '../../state/projects/tableManager';
import { v4 as uuidv4 } from 'uuid';


enum TextDirection {
  LTR = "Left to Right",
  RTL = "Right to Left"
}

interface ProjectDialogProps {
  open: boolean;
  closeCallback: () => void;
  projectId: string | null;
}

const getInitialProjectState = (): Project => ({
  id: uuidv4(),
  name: "",
  abbreviation: "",
  languageCode: "eng",
  textDirection: "LTR",
  fileName: ""
});

const ProjectDialog: React.FC<ProjectDialogProps> = ({open, closeCallback, projectId}) => {
  const {appState} = React.useContext(AppContext);
  const [project, setProject] = React.useState<Project>(getInitialProjectState());
  const [uploadError, setUploadError] = React.useState("");
  const [openConfirmDelete, setOpenConfirmDelete] = React.useState(false);

  const handleClose = React.useCallback(() => {
    setProject(getInitialProjectState());
    closeCallback();
  }, [closeCallback, setProject]);

  const enableCreate = React.useMemo(() => (
    !uploadError
    && project.name.length
    && project.abbreviation.length
    && project.languageCode.length
    && Object.keys(TextDirection).includes(project.textDirection)
  ), [project, uploadError]);

  const handleSubmit = React.useCallback(() => {
    appState.projects.save({
      ...project,
      id: project.id ?? uuidv4()
    })
  }, [appState.projects, project]);

  const handleDelete = React.useCallback(() => {
    if(projectId) {
      appState.projects.remove(projectId);
      setOpenConfirmDelete(false);
      handleClose();
    }
  }, [projectId, appState.projects, setOpenConfirmDelete, handleClose]);

  React.useEffect(() => {
    console.log("appState.projects.getProjects().values(): ", appState.projects.getProjects().values(), projectId)
    const foundProject = Array.from(appState.projects.getProjects().values()).find(p => p.id === projectId);
    if(foundProject) {
      setProject(foundProject);
    }
  }, [projectId, appState.projects, setProject, project.id]);

  console.log("selected project: ", project);

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
      >
        <form onSubmit={e => {
          e.preventDefault();
          handleSubmit()
        }}>
          <DialogTitle>
            <Grid container justifyContent="space-between">
              <Typography variant="h6">
                {`${projectId ? 'Edit' : 'Create'} Project`}
              </Typography>
              <IconButton aria-label="close" onClick={handleClose} size="large">
                <Close sx={{ width: 18, height: 18 }} />
              </IconButton>
            </Grid>
          </DialogTitle>
          <DialogContent>
            <Grid container flexDirection="column" alignItems="center" justifyContent="space-between" sx={{width: 500, height: '100%', minHeight: 500, p: 2}}>
              <FormGroup sx={{width: '100%'}}>
                <FormControl>
                  <Typography variant="subtitle2">Name</Typography>
                  <TextField size="small" sx={{mb: 2}} fullWidth type="text" value={project.name} onChange={({target: {value: name}}) =>
                    setProject(p => ({...p, name}))} />
                </FormControl>
                <FormControl>
                  <Typography variant="subtitle2">Abbreviation</Typography>
                  <TextField size="small" sx={{mb: 2}} fullWidth type="text" value={project.abbreviation} onChange={({target: {value: abbreviation}}) =>
                    setProject(p => ({...p, abbreviation}))}
                  />
                </FormControl>
                <FormControl>
                  <Typography variant="subtitle2">Language</Typography>
                  <Autocomplete
                    size="small"
                    fullWidth
                    disablePortal
                    options={Object.keys(ISO6393).map((key: string) => ({label: ISO6393[key as keyof typeof ISO6393], id: key}))}
                    renderInput={(params: any) => <TextField {...params} />}
                    ListboxProps={{
                      style: {
                        maxHeight: 250
                      }
                    }}
                    sx={{mb: 2}}
                    value={{label: ISO6393[project.languageCode as keyof typeof ISO6393], id: project.languageCode}}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onChange={(_, languageCode) =>
                      setProject(p => ({
                        ...p,
                        languageCode: languageCode?.id ?? ""
                      }))}
                  />
                </FormControl>
                <FormControl>
                  <Typography variant="subtitle2">Text Direction</Typography>
                  <Select size="small" sx={{mb: 2}} fullWidth type="text" value={project.textDirection} onChange={({target: {value: textDirection}}) =>
                    setProject(p => ({
                      ...p,
                      textDirection: textDirection as string
                    }))
                  }>
                    {
                      Object.keys(TextDirection).map(td => (
                        <MenuItem key={td} value={td}>
                          {TextDirection[td as keyof typeof TextDirection]}
                        </MenuItem>
                      ))
                    }
                  </Select>
                </FormControl>

                <Button variant="contained" component="label" sx={{mt: 2}}>
                  Upload File
                  <input type="file" hidden
                         onClick={(event) => {
                           // this is a fix which allows loading a file of the same path and filename. Otherwise the onChange
                           // event isn't thrown.

                           // @ts-ignore
                           event.currentTarget.value = null;
                         }}
                         onChange={async (event) => {
                           // grab file content
                           const file = event!.target!.files![0];

                           if(file.type !== "text/tab-separated-values") {
                             setUploadError("Invalid file type supplied.");
                             return;
                           } else {
                             setUploadError("");
                             setProject(p => ({...p, fileName: file.name}));
                           }

                           const content = await file.text();
                           console.log("content: ", content, file)

                           const linksTable: VirtualTableLinks = new VirtualTableLinks();

                           // const sourceContainer = props.containers.find((container) => container.id === 'source')!;
                           // const targetContainer = props.containers.find((container) => container.id === 'target')!;
                           //
                           // const sourcesIndex = projectState.linksIndexes?.sourcesIndex ?? new WordsIndex(sourceContainer, AlignmentSide.SOURCE);
                           // const targetsIndex = projectState.linksIndexes?.targetsIndex ?? new WordsIndex(targetContainer, AlignmentSide.TARGET);
                           //
                           // const linksIndexes = {
                           //   sourcesIndex,
                           //   targetsIndex
                           // };
                           //
                           // linksIndexes.sourcesIndex.indexingTasks.enqueue(linksIndexes.sourcesIndex.initialize);
                           // linksIndexes.targetsIndex.indexingTasks.enqueue(linksIndexes.targetsIndex.initialize);
                           //
                           // // convert into an appropriate object
                           // const alignmentFile = JSON.parse(content) as AlignmentFile;
                           //
                           // const chunkSize = 10_000;
                           // // override the alignments from alignment file
                           // _.chunk(alignmentFile.records, chunkSize).forEach(
                           //   (chunk, chunkIdx) => {
                           //     const links = chunk.map((record, recordIdx): Link => {
                           //       return {
                           //         // @ts-ignore
                           //         id: record.id ?? record?.meta?.id ?? `record-${chunkIdx * chunkSize + (recordIdx + 1)}`,
                           //         sources: record.source,
                           //         targets: record.target,
                           //       };
                           //     });
                           //     try {
                           //       linksTable.saveAll(links, true);
                           //     } catch (e) {
                           //       console.error('e', e);
                           //     }
                           //   }
                           // );
                           //
                           // sourcesIndex.indexingTasks.enqueue(async () => {
                           //   await linksTable.registerSecondaryIndex(sourcesIndex);
                           // });
                           //
                           // targetsIndex.indexingTasks.enqueue(async () => {
                           //   await linksTable.registerSecondaryIndex(targetsIndex);
                           // });
                           //
                           // linksTable._onUpdate(); // modify variable to indicate that an update has occurred
                           // console.log("linksTable: ", linksTable)
                         }}
                  />
                </Button>
                <Typography variant="subtitle2" sx={{mt: 1}} {...(uploadError ? {color: "error"} : {})}>
                  {uploadError ? `The file you have selected is not valid: ${uploadError}` : project.fileName}
                </Typography>
              </FormGroup>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Grid container justifyContent="space-between" sx={{p: 2}}>
              {
                projectId
                  ? <Button variant="text" color="error" sx={{textTransform: 'none'}} onClick={() => setOpenConfirmDelete(true)}
                    startIcon={<DeleteOutline />}
                  >Delete</Button>
                  : <Box />
              }
              <Button variant="contained" type="submit" sx={{textTransform: 'none'}} disabled={!enableCreate}>{projectId ? "Update" : "Create"}</Button>
            </Grid>
          </DialogActions>
        </form>
      </Dialog>
      <Dialog
        maxWidth="xl"
        open={openConfirmDelete}
        onClose={() => setOpenConfirmDelete(false)}
      >
        <DialogContent sx={{width: 650}}>
          <Grid container justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">Are you sure you want to delete this project?</Typography>
            <Grid item>
              <Grid container>
                <Button variant="text" onClick={() => setOpenConfirmDelete(false)} sx={{textTransform: 'none'}}>Go Back</Button>
                <Button variant="contained" onClick={handleDelete} sx={{ml: 2, textTransform: 'none'}}>Delete</Button>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ProjectDialog;
