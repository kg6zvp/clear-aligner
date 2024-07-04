/**
 * This file contains the ControlPanel component which contains buttons like
 * create link, delete link, toggle glosses, swap to vertical mode, etc.
 */
import { ReactElement, useCallback, useContext, useMemo, useState } from 'react';
import { Button, ButtonGroup, Stack, Tooltip } from '@mui/material';
import { AddLink, LinkOff, RestartAlt, SwapHoriz, SwapVert, Translate } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import useDebug from 'hooks/useDebug';
import { CorpusContainer } from '../../structs';
import { AppContext } from '../../App';
import { useRemoveLink, useSaveLink } from '../../state/links/tableManager';
import BCVWP from '../bcvwp/BCVWPSupport';
import { ControlPanelFormat, UserPreference } from '../../state/preferences/tableManager';

import uuid from 'uuid-random';
import { resetTextSegments } from '../../state/alignment.slice';
import { useHotkeys } from 'react-hotkeys-hook';

interface ControlPanelProps {
  containers: CorpusContainer[];
  position: BCVWP;
}

export const ControlPanel = (props: ControlPanelProps): ReactElement => {
  useDebug('ControlPanel');
  const dispatch = useAppDispatch();
  const [linkRemoveState, setLinkRemoveState] = useState<{
    linkId?: string,
    removeKey?: string,
  }>();
  const { projectState, preferences, setPreferences } = useContext(AppContext);

  const [formats, setFormats] = useState([] as string[]);

  const inProgressLink = useAppSelector(
    (state) => state.alignment.present.inProgressLink
  );

  const scrollLock = useAppSelector((state) => state.app.scrollLock);
  const {saveLink} = useSaveLink();
  useRemoveLink(linkRemoveState?.linkId, linkRemoveState?.removeKey);

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

  const deleteLink = () => {
      if (inProgressLink?.id) {
        setLinkRemoveState({
          linkId: inProgressLink.id,
          removeKey: uuid()
        });
        dispatch(resetTextSegments());
      }
  }

  const createLink = () => {
    inProgressLink && saveLink(inProgressLink);
    dispatch(resetTextSegments());
  }

  // keyboard shortcuts
  useHotkeys('space', () => createLink())
  useHotkeys('backspace', () => deleteLink())
  useHotkeys('shift+esc', () => dispatch(resetTextSegments()))

  return (
    <>
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
              onClick={() => createLink()}
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
              onClick={() => deleteLink()}
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
      </Stack>
    </>
  );
};

export default ControlPanel;
