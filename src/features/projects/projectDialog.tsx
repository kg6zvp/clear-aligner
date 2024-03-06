import React from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormGroup,
  Grid,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material';
import { Close, DeleteOutline } from '@mui/icons-material';
import ISO6393 from 'utils/iso-639-3.json';
import { VirtualTableLinks } from '../../state/links/tableManager';
import { AppContext } from '../../App';
import { Project } from '../../state/projects/tableManager';
import { v4 as uuidv4 } from 'uuid';
import { AlignmentSide, Corpus, CorpusContainer, CorpusFileFormat } from '../../structs';
import { parseTsv, putVersesInCorpus } from '../../workbench/query';
import BCVWP from '../bcvwp/BCVWPSupport';
import { AppState } from '../../state/databaseManagement';


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
  fileName: "",
  linksTable: new VirtualTableLinks()
});

const ProjectDialog: React.FC<ProjectDialogProps> = ({open, closeCallback, projectId}) => {
  const {appState, setAppState, setCurrentReference} = React.useContext(AppContext);
  const [project, setProject] = React.useState<Project>(getInitialProjectState());
  const [uploadErrors, setUploadErrors] = React.useState<string[]>([]);
  const [openConfirmDelete, setOpenConfirmDelete] = React.useState(false);
  const [fileContent, setFileContent] = React.useState("");

  const handleClose = React.useCallback(() => {
    setUploadErrors([]);
    setProject(getInitialProjectState());
    closeCallback();
  }, [closeCallback, setProject]);

  const enableCreate = React.useMemo(() => (
    !uploadErrors.length
    && fileContent.length
    && project.name.length
    && project.abbreviation.length
    && project.languageCode.length
    && Object.keys(TextDirection).includes(project.textDirection)
  ), [project, uploadErrors]);

  const handleSubmit = React.useCallback(async () => {
    setCurrentReference(null);
    const refCorpus = {
      id: project.id,
      name: project.abbreviation,
      fullName: project.name,
      language: {
        code: project.languageCode,
        textDirection: project.textDirection.toLowerCase(),
      },
      words: [],
      wordsByVerse: {},
      wordLocation: new Map<string, Set<BCVWP>>(),
      books: {},
    } as Corpus;
    const parsedTsvCorpus = await parseTsv(fileContent, refCorpus, AlignmentSide.TARGET, CorpusFileFormat.TSV_TARGET);
    putVersesInCorpus({...refCorpus, ...parsedTsvCorpus});
    const updateProject = appState.projects.save({
      ...project,
      targetCorpora: CorpusContainer.fromIdAndCorpora("target", [parsedTsvCorpus]),
      id: project.id ?? uuidv4()
    });
    if(updateProject) {
      setAppState(as => ({...as, currentProject: updateProject}));
    }
    handleClose();
  }, [setCurrentReference, project, fileContent, appState.projects, handleClose, setAppState]);

  const handleDelete = React.useCallback(() => {
    if(projectId) {
      appState.projects.remove(projectId);
      setAppState(as => ({
        ...as,
        currentProject: undefined
      } as AppState));
      setOpenConfirmDelete(false);
      handleClose();
    }
  }, [projectId, appState.projects, setOpenConfirmDelete, handleClose, setAppState]);

  React.useEffect(() => {
    const foundProject = Array.from(appState.projects.getProjects().values()).find(p => p.id === projectId);
    if(foundProject) {
      setProject(foundProject);
    }
  }, [projectId, appState.projects, setProject, project.id]);


  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
      >
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

                <Button variant="contained" component="label" sx={{mt: 2, textTransform: 'none'}}>
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
                           const content = await file.text();
                           const errorMessages: string[] = [];
                           if(file.type !== "text/tab-separated-values") {
                             errorMessages.push("Invalid file type supplied.");
                           }
                           if (!["text", "id"].every(header => content.split('\n')[0].includes(header))) {
                             errorMessages.push("TSV must include 'text' and 'id' headers.");
                           }
                           if (content.split('\n').filter(v => v).length < 2) {
                             errorMessages.push("TSV must include at least one row of data.")
                           }
                           if(errorMessages.length) {
                             setUploadErrors(errorMessages);
                             return;
                           }

                           setUploadErrors([]);
                           setProject(p => ({...p, fileName: file.name}));
                           setFileContent(content);
                         }}
                  />
                </Button>
                <Typography variant="subtitle2" sx={{mt: 1}} {...(uploadErrors.length ? {color: "error"} : {})}>
                  {uploadErrors.length ? (
                    <>
                      <span style={{display: 'block'}}>The file you have selected is not valid:</span>
                      {uploadErrors.map(error => <span style={{display: 'block'}}>{error}</span>)}
                    </>
                  ) : project.fileName}
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
              <Button variant="contained" onClick={handleSubmit} sx={{textTransform: 'none'}} disabled={!enableCreate}>{projectId ? "Update" : "Create"}</Button>
            </Grid>
          </DialogActions>
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
