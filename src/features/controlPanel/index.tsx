import { ReactElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Button, ButtonGroup, Stack, Tooltip } from '@mui/material';
import {
  AddLink,
  FileDownload,
  FileUpload,
  LinkOff,
  RestartAlt,
  SwapHoriz,
  SwapVert,
  Translate
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import useDebug from 'hooks/useDebug';
import { resetTextSegments } from 'state/alignment.slice';
import { AlignmentSide, CorpusContainer, Link } from '../../structs';
import { AlignmentFile, AlignmentRecord } from '../../structs/alignmentFile';
import { AppContext } from '../../App';
import { useGetAllLinks, useRemoveLink, useSaveAlignmentFile, useSaveLink } from '../../state/links/tableManager';
import BCVWP from '../bcvwp/BCVWPSupport';
import { ControlPanelFormat, PreferenceKey, UserPreference } from '../../state/preferences/tableManager';

import { WordsIndex } from '../../state/links/wordsIndex';
import { usePivotWords } from '../concordanceView/usePivotWords';
import uuid from 'uuid-random';

interface ControlPanelProps {
  containers: CorpusContainer[];
  position: BCVWP;
}

export const ControlPanel = (props: ControlPanelProps): ReactElement => {
  useDebug('ControlPanel');
  const dispatch = useAppDispatch();
  const [alignmentFileSaveState, setAlignmentFileSaveState] = useState<{
    alignmentFile?: AlignmentFile,
    saveKey?: string
  }>();
  const [linkSaveState, setLinkSaveState] = useState<{
    link?: Link,
    saveKey?: string,
  }>();
  const [linkRemoveState, setLinkRemoveState] = useState<{
    linkId?: string,
    removeKey?: string,
  }>();
  const [getAllLinksKey, setGetAllLinksKey] = useState<string>();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _initializeTargetPivotWords = usePivotWords(AlignmentSide.TARGET);
  const { projectState, setProjectState, preferences, setPreferences } = useContext(AppContext);

  // File input reference to support file loading via a button click
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formats, setFormats] = useState([] as string[]);

  const inProgressLink = useAppSelector(
    (state) => state.alignment.present.inProgressLink
  );

  const scrollLock = useAppSelector((state) => state.app.scrollLock);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isPending: isSaveAlignmentFilePending } = useSaveAlignmentFile(alignmentFileSaveState?.alignmentFile, alignmentFileSaveState?.saveKey);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isPending: isSaveLinkPending } = useSaveLink(linkSaveState?.link, linkSaveState?.saveKey);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isPending: isRemoveLinkPending } = useRemoveLink(linkRemoveState?.linkId, linkRemoveState?.removeKey);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isPending: isGetAllLinksPending, result: allLinks } = useGetAllLinks(getAllLinksKey);

  const anySegmentsSelected = useMemo(() => !!inProgressLink, [inProgressLink]);
  const linkHasBothSides = useMemo(
    () => {
      return (
        Number(inProgressLink?.sources.length) > 0 &&
        Number(inProgressLink?.targets.length) > 0
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inProgressLink?.sources.length, inProgressLink?.targets.length]
  );
  useEffect(() => {
    const currLinkTable = projectState.linksTable;
    const currSourcesIndex = projectState?.linksIndexes?.sourcesIndex;
    const currTargetsIndex = projectState?.linksIndexes?.targetsIndex;

    if (!currLinkTable
      || !!currSourcesIndex
      || !!currTargetsIndex) {
      return;
    }

    const nextSourcesIndex = currSourcesIndex
      ?? new WordsIndex(props.containers.find((container) => container.id === 'source')!, AlignmentSide.SOURCE);
    const nextTargetsIndex = currTargetsIndex
      ?? new WordsIndex(props.containers.find((container) => container.id === 'target')!, AlignmentSide.TARGET);

    setProjectState({
      ...projectState,
      linksIndexes: {
        sourcesIndex: nextSourcesIndex,
        targetsIndex: nextTargetsIndex
      }
    });

    nextSourcesIndex.indexingTasks.enqueue(nextSourcesIndex.initialize);
    nextTargetsIndex.indexingTasks.enqueue(nextTargetsIndex.initialize);

    nextSourcesIndex.indexingTasks.enqueue(async () => {
      await currLinkTable.registerSecondaryIndex(nextSourcesIndex);
    });

    nextTargetsIndex.indexingTasks.enqueue(async () => {
      await currLinkTable.registerSecondaryIndex(nextTargetsIndex);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectState?.linksTable, projectState?.linksIndexes]);
  useEffect(() => {
    if (!allLinks || allLinks.length < 1) {
      return;
    }
    // create starting instance
    const alignmentExport: AlignmentFile = {
      type: 'translation',
      meta: {
        creator: 'ClearAligner'
      },
      records: []
    };

    allLinks.map(
      (link) =>
        ({
          id: link.id,
          source: link.sources,
          target: link.targets
        } as AlignmentRecord)
    )
      .forEach((record) => alignmentExport.records.push(record));

    // Create alignment file content
    const fileContent = JSON.stringify(
      alignmentExport,
      undefined,
      2
    );

    // Create a Blob from the data
    const blob = new Blob([fileContent], {
      type: 'application/json'
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
  }, [allLinks]);

  const saveControlPanelFormat = useCallback(() => {
    const updatedUserPreference = projectState.userPreferences?.save({
      name: PreferenceKey.CONTROL_PANEL_FORMAT,
      value: (preferences[PreferenceKey.CONTROL_PANEL_FORMAT] as UserPreference | undefined)?.value === ControlPanelFormat.HORIZONTAL
        ? ControlPanelFormat.VERTICAL
        : ControlPanelFormat.HORIZONTAL
    });
    if (updatedUserPreference) {
      setPreferences(p => ({
        ...p,
        [updatedUserPreference.name]: updatedUserPreference
      }));
    }
  }, [preferences, projectState.userPreferences, setPreferences]);

  if (scrollLock && !formats.includes('scroll-lock')) {
    setFormats(formats.concat(['scroll-lock']));
  }

  const controlPanelFormat = useMemo(() => (
    preferences[PreferenceKey.CONTROL_PANEL_FORMAT] as UserPreference | undefined
  )?.value, [preferences]);

  return (
    <Stack
      direction="row"
      spacing={2}
      justifyContent="center"
      alignItems="baseline"
      style={{ marginTop: '16px', marginBottom: '16px' }}
    >
      <ButtonGroup>
        <Tooltip title="Toggle Glosses" arrow describeChild>
          <span>
            <Button
              variant={preferences.showGloss ? 'contained' : 'outlined'}
              disabled={!props.containers.some(container => container.corpusAtReferenceString(props.position?.toReferenceString?.() ?? '')?.hasGloss)}
              onClick={() => setPreferences(p => ({
                ...p,
                showGloss: !p.showGloss
              }))}
            >
              <Translate />
            </Button>
          </span>
        </Tooltip>
        <Tooltip
          title={`Swap to ${controlPanelFormat === ControlPanelFormat.VERTICAL ? 'horizontal' : 'vertical'} view mode`}
          arrow describeChild>
          <span>
            <Button
              variant="contained"
              onClick={saveControlPanelFormat}
            >
              {
                controlPanelFormat === ControlPanelFormat.HORIZONTAL
                  ? <SwapVert />
                  : <SwapHoriz />
              }
            </Button>
          </span>
        </Tooltip>
      </ButtonGroup>

      <ButtonGroup>
        <Tooltip title="Create Link" arrow describeChild>
          <span>
            <Button
              variant="contained"
              disabled={!linkHasBothSides}
              onClick={() => {
                setLinkSaveState({
                  link: inProgressLink ?? undefined,
                  saveKey: uuid()
                });
                dispatch(resetTextSegments());
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
              disabled={!inProgressLink?.id}
              onClick={() => {
                if (inProgressLink?.id) {
                  setLinkRemoveState({
                    linkId: inProgressLink.id,
                    removeKey: uuid()
                  });
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

                setAlignmentFileSaveState({
                  alignmentFile: JSON.parse(content) as AlignmentFile,
                  saveKey: uuid()
                });
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
                setGetAllLinksKey(uuid());
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
