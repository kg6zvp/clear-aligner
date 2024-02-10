import { ReactElement, useContext, useMemo, useRef, useState } from 'react';
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
import { useAppDispatch, useAppSelector } from 'app/hooks';
import useDebug from 'hooks/useDebug';
import {
  resetTextSegments,
} from 'state/alignment.slice';
import {
  addCorpusViewport,
  removeCorpusViewport,
  toggleScrollLock,
} from 'state/app.slice';
import { CorpusContainer, CorpusViewport, Link } from '../../structs';
import { AlignmentFile, AlignmentRecord } from '../../structs/alignmentFile';
import BCVWP from '../bcvwp/BCVWPSupport';
import { AppContext } from '../../App';
import { AlignmentMode } from '../../state/alignmentState';
import { createVirtualTableLinks, reindexTableLinks } from '../../state/links/tableManager';

interface ControlPanelProps {
  containers: CorpusContainer[];
}

export const ControlPanel = (props: ControlPanelProps): ReactElement => {
  useDebug('ControlPanel');
  const dispatch = useAppDispatch();

  const { projectState, setProjectState } = useContext(AppContext);

  // File input reference to support file loading via a button click
  const fileInputRef = useRef<HTMLInputElement>(null);

  // hide the undo/redo buttons until they can be assessed in CA-32
  const [isRedoEnabled] = useState(false);

  const [formats, setFormats] = useState([] as string[]);

  const inProgressLink = useAppSelector((state) => state.alignment.present.inProgressLink);

  const scrollLock = useAppSelector((state) => state.app.scrollLock);

  const anySegmentsSelected = useMemo(() => !!inProgressLink, [inProgressLink]);

  const linkHasBothSides = useMemo(() => {
      return Number(inProgressLink?.sources.length) > 0 && Number(inProgressLink?.targets.length) > 0;
    },
    [inProgressLink, inProgressLink?.sources.length, inProgressLink?.targets.length]);

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
              disabled={!linkHasBothSides}
              onClick={() => {
                if (!projectState.linksTable || !inProgressLink) {
                  return;
                }
                projectState.linksTable
                  .save(inProgressLink)
                  .finally(() =>
                    dispatch(resetTextSegments()));
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
              disabled={!(inProgressLink?.id)}
              onClick={() => {
                if (!projectState.linksTable || !inProgressLink) {
                  return;
                }
                if (inProgressLink?.id) {
                  const linksTable = projectState.linksTable;
                  void linksTable.remove(inProgressLink.id);
                } else {
                  dispatch(resetTextSegments());
                }
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
                const linksTable = createVirtualTableLinks();

                // convert into an appropriate object
                const alignmentFile = JSON.parse(content) as AlignmentFile;

                // override the alignments from alignment file
                alignmentFile.records
                  .map((record, idx) => {
                    if (idx > 10) {
                      return null;
                    }
                    return {
                      id: record.id ?? `record-${idx}`,
                      sources: record.source
                        .filter((v) => v)
                        .map((ref) => BCVWP.parseFromString(ref))
                        .map((bcv) => bcv.toReferenceString()),
                      targets: record.target
                        .filter((v) => v)
                        .map((ref) => BCVWP.parseFromString(ref))
                        .map((bcv) => bcv.toReferenceString()),
                    } as Link;
                  })
                  .filter((v) => v)
                  .map((v) => v as Link)
                  .forEach((link) => {
                    void linksTable.save(link);
                  });

                void reindexTableLinks(linksTable);

                // dispatch the updated alignment
                setProjectState({
                  ...projectState,
                  linksTable
                })
              }}
            />
            <Button
              disabled={props.containers.length === 0}
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
              disabled={props.containers.length === 0}
              variant="contained"
              onClick={() => {
                // create starting instance
                const alignmentExport: AlignmentFile = {
                  type: 'translation',
                  meta: {
                    creator: 'ClearAligner',
                  },
                  records: [],
                };

                if (!projectState.linksTable) {
                  return;
                }

                projectState.linksTable.getAll()
                  .then((rows) => {
                    rows
                      .map((link) => ({
                        id: link.id,
                        source: link.sources,
                        target: link.targets,
                      } as AlignmentRecord))
                      .forEach((record) => alignmentExport.records.push(record));

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
                  const currentDate = new Date();

                  // Set the download attribute and file name
                  link.download = `alignment_data_${currentDate.getFullYear()}-${String(
                    currentDate.getMonth() + 1
                  ).padStart(2, '0')}-${String(currentDate.getDate()).padStart(
                    2,
                    '0'
                  )}T${String(currentDate.getHours()).padStart(2, '0')}_${String(
                    currentDate.getMinutes()
                  ).padStart(2, '0')}.json`;

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
                });
              }}
            >
              <FileDownload />
            </Button>
          </span>
        </Tooltip>
      </ButtonGroup>
    </Stack>
  );
};

export default ControlPanel;
