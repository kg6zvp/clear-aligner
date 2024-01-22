import { ReactElement, useRef, useState } from 'react';
import { ActionCreators } from 'redux-undo';
import {
  Button,
  ButtonGroup,
  Tooltip,
  Typography,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';

import {
  AddLink,
  LinkOff,
  RestartAlt,
  Redo,
  Undo,
  Add,
  Remove,
  SyncLock,
  FileDownload,
  FileUpload,
} from '@mui/icons-material';

import cloneDeep from 'lodash/cloneDeep';

import { useAppDispatch, useAppSelector } from 'app/hooks';
import useDebug from 'hooks/useDebug';
import {
  resetTextSegments,
  createLink,
  deleteLink,
  AlignmentMode,
  loadAlignments,
} from 'state/alignment.slice';

import {
  addCorpusViewport,
  removeCorpusViewport,
  toggleScrollLock,
} from 'state/app.slice';
import { CorpusContainer } from '../../structs';
import { AlignmentFile, AlignmentRecord } from '../../structs/alignmentFile';
import BCVWP from '../bcvwp/BCVWPSupport';

interface ControlPanelProps {
  containers: CorpusContainer[];
}

export const ControlPanel = (props: ControlPanelProps): ReactElement => {
  useDebug('ControlPanel');
  const dispatch = useAppDispatch();

  // File input reference to support file loading via a button click
  const fileInputRef = useRef<HTMLInputElement>(null);

  // hide the undo/redo buttons until they can be assessed in CA-32
  const [isRedoEnabled] = useState(false);

  const [formats, setFormats] = useState([] as string[]);

  const scrollLock = useAppSelector((state) => state.app.scrollLock);

  const anySegmentsSelected = useAppSelector((state) =>
    Boolean(state.alignment.present.inProgressLink)
  );

  const mode = useAppSelector((state) => {
    return state.alignment.present.mode;
  });

  const linkHasBothSides = useAppSelector((state) => {
    return (
      Number(state.alignment.present.inProgressLink?.sources.length) > 0 &&
      Number(state.alignment.present.inProgressLink?.targets.length) > 0
    );
  });

  const currentCorpusViewports = useAppSelector((state) => {
    return state.app.corpusViewports;
  });

  const corporaWithoutViewport = props.containers.filter((container) => {
    const currentViewportIds = currentCorpusViewports.map(
      (viewport) => viewport.containerId
    );
    return !currentViewportIds.includes(container.id);
  });

  const alignmentState = useAppSelector((state) => {
    return state.alignment.present.alignments;
  });

  if (scrollLock && !formats.includes('scroll-lock')) {
    setFormats(formats.concat(['scroll-lock']));
  }
  return (
    <Stack
      direction="row"
      spacing={2}
      justifyContent="center"
      alignItems="baseline"
      style={{ marginTop: '16px', marginBottom: '16px' }}
    >
      <ToggleButtonGroup
        size="small"
        value={formats}
        sx={{
          display: 'unset',
        }}
        // For later.
        // onChange={(
        //   event: React.MouseEvent<HTMLElement>,
        //   newFormats: string[]
        // ) => {}}
      >
        <ToggleButton
          value="scroll-lock"
          sx={{
            height: '36px',
          }}
          onClick={() => {
            if (formats.includes('scroll-lock')) {
              setFormats(formats.filter((item) => item !== 'scroll-lock'));
            } else {
              setFormats(formats.concat(['scroll-lock']));
            }

            dispatch(toggleScrollLock());
          }}
        >
          <SyncLock />
        </ToggleButton>
      </ToggleButtonGroup>

      <ButtonGroup>
        <Tooltip title="Create Link" arrow describeChild>
          <span>
            <Button
              variant="contained"
              disabled={mode !== AlignmentMode.Edit || !linkHasBothSides}
              onClick={() => {
                dispatch(createLink());
              }}
            >
              <AddLink />
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Delete Link" arrow describeChild>
          <span>
            <Button
              variant="contained"
              disabled={!(mode === AlignmentMode.Select)}
              onClick={() => {
                dispatch(deleteLink());
              }}
            >
              <LinkOff />
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Reset" arrow describeChild>
          <span>
            <Button
              variant="contained"
              disabled={!anySegmentsSelected}
              onClick={() => {
                dispatch(resetTextSegments());
              }}
            >
              <RestartAlt />
            </Button>
          </span>
        </Tooltip>
      </ButtonGroup>

      {
        /* Undo/Redo  */
        isRedoEnabled && (
          <ButtonGroup>
            <Tooltip title="Undo" arrow describeChild>
              <span>
                <Button
                  disabled={currentCorpusViewports.length === 0}
                  variant="contained"
                  onClick={() => {
                    dispatch(ActionCreators.undo());
                  }}
                >
                  <Undo />
                </Button>
              </span>
            </Tooltip>

            <Tooltip title="Redo" arrow describeChild>
              <span>
                <Button
                  disabled={currentCorpusViewports.length === 0}
                  variant="contained"
                  onClick={() => {
                    dispatch(ActionCreators.redo());
                  }}
                >
                  <Redo />
                </Button>
              </span>
            </Tooltip>
          </ButtonGroup>
        )
      }

      <ButtonGroup>
        <Tooltip title="Load Alignment Data" arrow describeChild>
          <span>
            <input
              type="file"
              hidden
              ref={fileInputRef}
              multiple={false}
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

                // convert into an appropriate object
                const alignmentFile = JSON.parse(content) as AlignmentFile;

                // clone alignment state so that we can mutate
                const newAlignmentState = cloneDeep(alignmentState);

                // override the alignments from alignment file
                newAlignmentState![0].links = alignmentFile.records.map(
                  (record) => {
                    return {
                      id: record.id,
                      sources: record.source
                        .filter((v) => v)
                        .map((ref) => BCVWP.parseFromString(ref))
                        .map((bcv) => bcv.toReferenceString()),
                      targets: record.target
                        .filter((v) => v)
                        .map((ref) => BCVWP.parseFromString(ref))
                        .map((bcv) => bcv.toReferenceString()),
                    };
                  }
                );

                // dispatch the updated alignment
                dispatch(loadAlignments(newAlignmentState));
              }}
            />
            <Button
              disabled={currentCorpusViewports.length === 0}
              variant="contained"
              onClick={() => {
                // delegate file loading to regular file input
                fileInputRef?.current?.click();
              }}
            >
              <FileUpload />
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Save Alignment Data" arrow describeChild>
          <span>
            <Button
              disabled={currentCorpusViewports.length === 0}
              variant="contained"
              onClick={() => {
                dispatch(loadAlignments(alignmentState));

                // create starting instance
                const alignmentExport: AlignmentFile = {
                  type: 'translation',
                  meta: {
                    creator: 'ClearAligner',
                  },
                  records: [],
                };

                const currentAlignment = alignmentState[0];

                // ETL alignment links
                alignmentExport.records = currentAlignment.links.map((link) => {
                  return {
                    id: link.id,
                    source: link.sources,
                    target: link.targets,
                  } as AlignmentRecord;
                });

                // Create alignment file content
                const fileContent = JSON.stringify(
                  alignmentExport,
                  undefined,
                  2
                );

                // Create a Blob from the data
                const blob = new Blob([fileContent], {
                  type: 'application/json',
                });

                // Create a URL for the Blob
                const url = URL.createObjectURL(blob);

                // Create a link element
                const link = document.createElement('a');

                // Set the download attribute and file name
                link.download = `${currentAlignment.polarity}_alignment-data.json`;

                // Set the href attribute to the generated URL
                link.href = url;

                // Append the link to the document
                document.body.appendChild(link);

                // Trigger a click event on the link
                link.click();

                // Remove the link from the document
                document.body.removeChild(link);

                // Revoke the URL to free up resources
                URL.revokeObjectURL(url);
              }}
            >
              <FileDownload />
            </Button>
          </span>
        </Tooltip>
      </ButtonGroup>

      <ButtonGroup>
        <Tooltip
          placement="top"
          arrow
          open={Boolean(
            !currentCorpusViewports.length && corporaWithoutViewport.length
          )}
          title={
            <>
              <Typography color="info.light">Click here</Typography>
              <Typography>to add a corpus viewport.</Typography>
            </>
          }
        >
          <>
            <Tooltip
              title="Add corpus viewport"
              arrow
              describeChild
              disableHoverListener={currentCorpusViewports.length === 0}
            >
              <span>
                <Button
                  variant="contained"
                  disabled={!corporaWithoutViewport.length}
                  onClick={() => {
                    dispatch(
                      addCorpusViewport({
                        availableCorpora: corporaWithoutViewport.map(
                          (corpus) => corpus.id
                        ),
                      })
                    );
                  }}
                >
                  <Add />
                </Button>
              </span>
            </Tooltip>
          </>
        </Tooltip>
        <Tooltip title="Remove a corpus viewport" arrow describeChild>
          <span>
            <Button
              variant="contained"
              disabled={currentCorpusViewports.length === 0}
              onClick={() => {
                dispatch(removeCorpusViewport());
              }}
            >
              <Remove />
            </Button>
          </span>
        </Tooltip>
      </ButtonGroup>
    </Stack>
  );
};

export default ControlPanel;
