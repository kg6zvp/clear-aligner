import React, { useContext, useMemo } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
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
import { DefaultProjectName, LinksTable } from '../../state/links/tableManager';
import { Project, ProjectTable } from '../../state/projects/tableManager';
import { v4 as uuidv4 } from 'uuid';
import { AlignmentSide, Corpus, CorpusContainer, CorpusFileFormat, Word } from '../../structs';
import { parseTsv, putVersesInCorpus } from '../../workbench/query';
import BCVWP from '../bcvwp/BCVWPSupport';
import { useAppDispatch } from '../../app';
import { resetTextSegments } from '../../state/alignment.slice';
import { AppContext } from '../../App';
import { UserPreference } from '../../state/preferences/tableManager';
import useDatabaseStatusMessage from '../../utils/useDatabaseStatusMessage';


enum TextDirection {
  LTR = 'Left to Right',
  RTL = 'Right to Left'
}

interface ProjectDialogProps {
  open: boolean;
  closeCallback: () => void;
  projectId: string | null;
}

const getInitialProjectState = (): Project => ({
  id: uuidv4(),
  name: '',
  abbreviation: '',
  languageCode: 'eng',
  textDirection: 'ltr',
  fileName: '',
  linksTable: new LinksTable()
});

const ProjectDialog: React.FC<ProjectDialogProps> = ({ open, closeCallback, projectId }) => {
  const databaseStatusDialog = useDatabaseStatusMessage();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = React.useState(false);
  const { projectState, preferences, setProjects, setPreferences, projects } = useContext(AppContext);
  const [project, setProject] = React.useState<Project>(getInitialProjectState());
  const [uploadErrors, setUploadErrors] = React.useState<string[]>([]);
  const [openConfirmDelete, setOpenConfirmDelete] = React.useState(false);
  const [fileContent, setFileContent] = React.useState('');
  const [projectUpdated, setProjectUpdated] = React.useState(false);

  const languageOptions = useMemo(() => ['', ...Object.keys(ISO6393).map((key: string) => ISO6393[key as keyof typeof ISO6393])].sort((a, b) => a.localeCompare(b)), [ISO6393]);

  const allowDelete = React.useMemo(() => projectId !== DefaultProjectName, [projectId]);

  const handleUpdate = React.useCallback((updatedProjectFields: Partial<Project>) => {
    if (!projectUpdated) {
      setProjectUpdated(true);
    }
    setProject((p: Project) => ({ ...p, ...updatedProjectFields }));
  }, [projectUpdated, setProject]);

  const handleClose = React.useCallback(() => {
    setProjectUpdated(false);
    setLoading(false);
    setUploadErrors([]);
    setProject(getInitialProjectState());
    closeCallback();
  }, [closeCallback, setProject, setLoading, setUploadErrors]);

  const enableCreate = React.useMemo(() => (
    !uploadErrors.length
    && (project.fileName || '').length
    && (project.name || '').length
    && (project.abbreviation || '').length
    && (project.languageCode || '').length
    && Object.keys(TextDirection).includes((project.textDirection || '').toUpperCase())
    && projectUpdated
  ), [uploadErrors.length, project.fileName, project.name, project.abbreviation, project.languageCode, project.textDirection, projectUpdated, (project.fileName || '').length, (project.name || '').length, (project.abbreviation || '').length, (project.languageCode || '').length]);

  const handleSubmit = React.useCallback(async (e: any) => {
    return await new Promise((resolve) => {
      setTimeout(async () => {
        e.preventDefault();
        const projectToUpdate = {
          ...project,
          id: project.id ?? uuidv4()
        };

        if (fileContent) {
          console.log('inside fileContent if block')
          dispatch(resetTextSegments());
          projectState.userPreferenceTable?.saveOrUpdate?.({ ...(preferences ?? {}), bcv: null } as UserPreference);
          const refCorpus = {
            id: project.id,
            name: project.abbreviation,
            fullName: project.name,
            fileName: project.fileName,
            language: {
              code: project.languageCode,
              textDirection: (project.textDirection || 'ltr')
            },
            words: [],
            wordsByVerse: {},
            wordLocation: new Map<string, Set<BCVWP>>(),
            books: {},
            side: AlignmentSide.TARGET
          } as Corpus;
          const parsedTsvCorpus = parseTsv(fileContent, refCorpus, AlignmentSide.TARGET, CorpusFileFormat.TSV_TARGET);
          putVersesInCorpus({ ...refCorpus, ...parsedTsvCorpus });
          projectToUpdate.targetCorpora = CorpusContainer.fromIdAndCorpora(AlignmentSide.TARGET, [parsedTsvCorpus]);
        }


        if(!projectId) {
          console.log('inside !projectId if block (top)')
          projectState.projectTable?.save?.(projectToUpdate)
          setProjects((p: Project[]) => [...p, projectToUpdate]);
          console.log('inside !projectId if block (bottom)')
        } else {
          console.log('inside !projectId else block')
          projectState.projectTable?.update?.(projectToUpdate);
          setProjects((project: Project[]) => project.map(p => p.id === projectId ? projectToUpdate : p));
        }

      }, 1000);
    }).finally(() => {
      console.log('about to run setLoading(false)')
      setLoading(false);
      console.log('about to run handleClose')
      handleClose();
    });
  }
  , [project, fileContent, handleClose, dispatch, preferences, setProjects, setLoading]);

  const handleDelete = React.useCallback(async () => {
    if (projectId) {
      await projectState.projectTable?.remove?.(projectId);
      setProjects((ps: Project[]) => (ps || []).filter(p => (p.id || '').trim() !== (projectId || '').trim()));
      if (preferences?.currentProject === projectId) {
        setPreferences((p: UserPreference | undefined) => ({
          ...(p ?? {}) as UserPreference,
          currentProject: '',
          initialized: false
        }));
      }
      setOpenConfirmDelete(false);
      handleClose();
    }
  }, [projectId, projectState.projectTable, setProjects, preferences?.currentProject, handleClose, setPreferences, setOpenConfirmDelete]);

  const setInitialProjectState = React.useCallback(async () => {
    const foundProject = [...(projects?.values?.() ?? [])].find(p => p.id === projectId);
    if (foundProject) {
      setProject(foundProject as Project);
    }
  }, [projectId, projects, setProject]);

  React.useEffect(() => {
    setInitialProjectState().catch(console.error);
  }, [setInitialProjectState]);


  return (
    <>
      {databaseStatusDialog}
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
          <Grid container flexDirection="column" alignItems="center" justifyContent="space-between"
                sx={{ width: 500, height: '100%', minHeight: 500, p: 2 }}>
            <FormGroup sx={{ width: '100%' }}>
              <FormControl>
                <Typography variant="subtitle2">Name</Typography>
                <TextField size="small" sx={{ mb: 2 }} fullWidth type="text" value={project.name}
                           onChange={({ target: { value: name } }) =>
                             handleUpdate({ name })} />
              </FormControl>
              <FormControl>
                <Typography variant="subtitle2">Abbreviation</Typography>
                <TextField size="small" sx={{ mb: 2 }} fullWidth type="text" value={project.abbreviation}
                           onChange={({ target: { value: abbreviation } }) =>
                             handleUpdate({ abbreviation })}
                />
              </FormControl>
              <FormControl>
                <Typography variant="subtitle2">Language</Typography>
                <Autocomplete
                  size="small"
                  fullWidth
                  disablePortal
                  options={languageOptions}
                  ListboxProps={{
                    style: {
                      maxHeight: 250
                    }
                  }}
                  sx={{ mb: 2 }}
                  value={ISO6393[project.languageCode as keyof typeof ISO6393] || ''}
                  onChange={(_, language) =>
                    handleUpdate({
                      languageCode: Object.keys(ISO6393).find(k => ISO6393[k as keyof typeof ISO6393] === language) ?? ''
                    })}
                  renderInput={(params) => <TextField {...params} />}
                />
              </FormControl>
              <FormControl>
                <Typography variant="subtitle2">Text Direction</Typography>
                <Select size="small" sx={{ mb: 2 }} fullWidth type="text" value={project.textDirection}
                        onChange={({ target: { value: textDirection } }) =>
                          handleUpdate({ textDirection: textDirection as string })
                        }>
                  {
                    Object.keys(TextDirection).map(td => (
                      <MenuItem key={td.toLowerCase()} value={td.toLowerCase()}>
                        {TextDirection[td as keyof typeof TextDirection]}
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>

              <Button variant="contained" component="label" sx={{ mt: 2, textTransform: 'none' }}>
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
                         if (file.type !== 'text/tab-separated-values') {
                           errorMessages.push('Invalid file type supplied.');
                         }
                         if (!['text', 'id'].every(header => content.split('\n')[0].includes(header))) {
                           errorMessages.push('TSV must include \'text\' and \'id\' headers.');
                         }
                         if (content.split('\n').filter(v => v).length < 2) {
                           errorMessages.push('TSV must include at least one row of data.');
                         }
                         if (errorMessages.length) {
                           setUploadErrors(errorMessages);
                           return;
                         }

                         setUploadErrors([]);
                         handleUpdate({ fileName: file.name });
                         setFileContent(content);
                       }}
                />
              </Button>
              <Typography variant="subtitle2" sx={{ mt: 1 }} {...(uploadErrors.length ? { color: 'error' } : {})}>
                {uploadErrors.length ? (
                  <>
                    <span style={{ display: 'block' }}>The file you have selected is not valid:</span>
                    {uploadErrors.map(error => <span style={{ display: 'block' }}>{error}</span>)}
                  </>
                ) : project.fileName}
              </Typography>
            </FormGroup>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Grid container justifyContent="space-between" sx={{ p: 2 }}>
            {
              projectId && allowDelete
                ? <Button variant="text" color="error" sx={{ textTransform: 'none' }}
                          onClick={() => setOpenConfirmDelete(true)}
                          startIcon={<DeleteOutline />}
                >Delete</Button>
                : <Box />
            }
            <Button
              variant="contained"
              sx={{ textTransform: 'none' }}
              disabled={!enableCreate || loading}
              {...(loading ? { startIcon: <CircularProgress size={10} /> } : {})}
              onClick={e => {
                setLoading(true);
                handleSubmit(e).catch(console.error);
              }}
            >
              {projectId ? 'Update' : 'Create'}
            </Button>
          </Grid>
        </DialogActions>
      </Dialog>
      <Dialog
        maxWidth="xl"
        open={openConfirmDelete}
        onClose={() => setOpenConfirmDelete(false)}
      >
        <DialogContent sx={{ width: 650 }}>
          <Grid container justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">Are you sure you want to delete this project?</Typography>
            <Grid item>
              <Grid container>
                <Button variant="text" onClick={() => setOpenConfirmDelete(false)} sx={{ textTransform: 'none' }}>Go
                  Back</Button>
                <Button variant="contained" onClick={handleDelete} sx={{ ml: 2, textTransform: 'none' }}>Delete</Button>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectDialog;
