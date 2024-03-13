import { ReactElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Button, ButtonGroup, Stack, Tooltip } from '@mui/material';
import { AddLink, LinkOff, RestartAlt, SwapHoriz, SwapVert, Translate } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import useDebug from 'hooks/useDebug';
import UploadAlignmentGroup from './uploadAlignmentGroup';
import { AlignmentSide, CorpusContainer, Link } from '../../structs';
import { AlignmentFile, AlignmentRecord } from '../../structs/alignmentFile';
import { AppContext } from '../../App';
import { useGetAllLinks, useRemoveLink, useSaveAlignmentFile, useSaveLink } from '../../state/links/tableManager';
import BCVWP from '../bcvwp/BCVWPSupport';
import { ControlPanelFormat, UserPreference } from '../../state/preferences/tableManager';

import { WordsIndex } from '../../state/links/wordsIndex';
import uuid from 'uuid-random';
import { resetTextSegments } from '../../state/alignment.slice';

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

  const { projectState, setProjectState, preferences, setPreferences } = useContext(AppContext);

  const [formats, setFormats] = useState([] as string[]);

  const inProgressLink = useAppSelector(
    (state) => state.alignment.present.inProgressLink
  );

  const scrollLock = useAppSelector((state) => state.app.scrollLock);
  useSaveAlignmentFile(alignmentFileSaveState?.alignmentFile, alignmentFileSaveState?.saveKey);
  useSaveLink(linkSaveState?.link, linkSaveState?.saveKey);
  useRemoveLink(linkRemoveState?.linkId, linkRemoveState?.removeKey);
  const { result: allLinks } = useGetAllLinks(getAllLinksKey);

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
      ?? new WordsIndex(props.containers.find((container) => container.id === AlignmentSide.SOURCE)!, AlignmentSide.SOURCE);
    const nextTargetsIndex = currTargetsIndex
      ?? new WordsIndex(props.containers.find((container) => container.id === AlignmentSide.TARGET)!, AlignmentSide.TARGET);

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
          sources: link.sources,
          targets: link.targets
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

  const saveControlPanelFormat = useCallback(async () => {
    const alignmentDirection = preferences?.alignmentDirection === ControlPanelFormat[ControlPanelFormat.VERTICAL]
      ? ControlPanelFormat[ControlPanelFormat.HORIZONTAL]
      : ControlPanelFormat[ControlPanelFormat.VERTICAL];
    const updatedPreferences = {
      ...preferences,
      alignmentDirection
    } as UserPreference;
    projectState.userPreferenceTable?.saveOrUpdate(updatedPreferences);
    setPreferences(updatedPreferences);
  }, [preferences, projectState.userPreferenceTable, setPreferences]);

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
      <ButtonGroup>
        <Tooltip title="Toggle Glosses" arrow describeChild>
          <span>
            <Button
              variant={preferences?.showGloss ? 'contained' : 'outlined'}
              disabled={!props.containers.some(container => container.corpusAtReferenceString(props.position?.toReferenceString?.() ?? '')?.hasGloss)}
              onClick={() => {
                const updatedPreferences = {
                  ...((preferences ?? {}) as UserPreference),
                  showGloss: !preferences?.showGloss
                };
                setPreferences(updatedPreferences);
                projectState.userPreferenceTable?.saveOrUpdate?.(updatedPreferences);
              }}
            >
              <Translate />
            </Button>
          </span>
        </Tooltip>
        <Tooltip
          title={`Swap to ${preferences?.alignmentDirection === ControlPanelFormat[ControlPanelFormat.VERTICAL] ? 'horizontal' : 'vertical'} view mode`}
          arrow describeChild>
          <span>
            <Button
              variant="contained"
              onClick={() => void saveControlPanelFormat()}
            >
              {
                preferences?.alignmentDirection === ControlPanelFormat[ControlPanelFormat.VERTICAL]
                  ? <SwapHoriz />
                  : <SwapVert />
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

      <UploadAlignmentGroup
        containers={props.containers}
        setGetAllLinksKey={() => {
          setGetAllLinksKey(uuid());
        }}
      />
    </Stack>
  );
};

export default ControlPanel;
