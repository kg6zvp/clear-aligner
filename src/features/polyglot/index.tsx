import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Card,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogContentText,
  Grid,
  Stack,
  Typography
} from '@mui/material';

import { useAppSelector } from 'app/hooks';
import useDebug from 'hooks/useDebug';
import CorpusComponent from 'features/corpus';
import { CorpusContainer, CorpusViewport } from 'structs';

import './styles.css';
import BCVWP from '../bcvwp/BCVWPSupport';
import { AppContext } from '../../App';
import { ControlPanelFormat, PreferenceKey, UserPreference } from '../../state/preferences/tableManager';
import { useDatabaseStatus } from '../../state/links/tableManager';
import uuid from 'uuid-random';

interface PolyglotProps {
  containers: CorpusContainer[];
  position: BCVWP | null;
}

const DatabaseStatusRefreshTimeInMs = 500;

export const Polyglot: React.FC<PolyglotProps> = ({ containers, position }) => {
  useDebug('PolyglotComponent');
  const { preferences } = React.useContext(AppContext);
  const containerViewportRefs = useRef<HTMLDivElement[]>([]);
  const scrollLock = useAppSelector((state) => state.app.scrollLock);
  const [databaseCheckKey, setDatabaseCheckKey] = useState<string>();
  const { result: databaseStatus } = useDatabaseStatus(databaseCheckKey);
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setDatabaseCheckKey(uuid());
    }, DatabaseStatusRefreshTimeInMs);
    return () => window.clearInterval(intervalId);
  }, []);
  const corpusViewports: CorpusViewport[] | null = useMemo(
    () =>
      containers?.map(
        (container): CorpusViewport => ({
          containerId: container.id
        })
      ) ?? null,
    [containers]
  );
  const spinnerParams = useMemo<{
    isBusy?: boolean,
    text?: string,
    variant?: 'determinate' | 'indeterminate',
    value?: number
  }>(() => {
    const busyInfo = databaseStatus?.busyInfo;
    if (busyInfo?.isBusy) {
      const progressCtr = busyInfo?.progressCtr ?? 0;
      const progressMax = busyInfo?.progressMax ?? 0;
      if (progressMax > 0
        && progressMax >= progressCtr) {
        const percentProgress = Math.round((progressCtr / progressMax) * 100.0);
        return {
          isBusy: true,
          text: busyInfo?.userText ?? 'The database is busy...',
          variant: 'determinate',
          value: percentProgress < 100 ? percentProgress : undefined
        };
      } else {
        return {
          isBusy: true,
          text: busyInfo?.userText ?? 'The database is busy...',
          variant: 'indeterminate',
          value: undefined
        };
      }
    }
    if (!corpusViewports
      || (corpusViewports?.length ?? 0) < 1) {
      return {
        isBusy: true,
        text: 'Loading corpora...',
        variant: 'indeterminate',
        value: undefined
      };
    }
    return {
      isBusy: false,
      text: undefined,
      variant: 'indeterminate',
      value: undefined
    };
  }, [corpusViewports, databaseStatus?.busyInfo]);

  const controlPanelFormat = useMemo(() => (
    preferences[PreferenceKey.CONTROL_PANEL_FORMAT] as UserPreference | undefined
  )?.value, [preferences]);

  return (
    <Stack
      direction={controlPanelFormat === ControlPanelFormat.HORIZONTAL ? 'row' : 'column'}
      spacing={2}
      style={{ height: controlPanelFormat === ControlPanelFormat.HORIZONTAL ? '17rem' : '30rem' }}
      justifyContent="stretch"
      alignItems="stretch"
    >
      <Dialog
        open={!!spinnerParams.isBusy}>
        <DialogContent>
          <Box sx={{
            display: 'flex',
            margin: 'auto',
            position: 'relative'
          }}>
            <CircularProgress sx={{ margin: 'auto' }}
                              variant={spinnerParams.variant ?? 'indeterminate'}
                              value={spinnerParams.value} />
            {!!spinnerParams.value && <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}>
              <Typography variant="caption">{`${spinnerParams.value}%`}</Typography>
            </Box>}
          </Box>
          <DialogContentText>
            {spinnerParams.text}
          </DialogContentText>
        </DialogContent>
      </Dialog>

      {corpusViewports &&
        corpusViewports.map((corpusViewport: CorpusViewport, index: number) => {
          const corpusId = corpusViewport.containerId;
          const key = `text_${index}`;
          const container = containers.find(
            (c) => c.id === corpusViewport.containerId
          );
          if (!container) return <Grid key={key} />;
          return (
            <Card
              onScroll={(e) => {
                if (scrollLock) {
                  const newScrollTop = (e.target as HTMLDivElement).scrollTop;
                  containerViewportRefs.current.forEach((ref) => {
                    ref.scrollTop = newScrollTop;
                  });
                }
              }}
              ref={(el) => {
                if (el) {
                  containerViewportRefs.current[index] = el;
                }
              }}
              elevation={2}
              className="corpus-container corpus-scroll-container"
              key={key}
              style={{
                flexGrow: '1',
                flexBasis: '0',
                minWidth: '16rem',
                position: 'relative'
              }}
            >
              <CorpusComponent
                key={corpusId}
                viewCorpora={container}
                viewportIndex={index}
                containers={{
                  source: containers?.find(c => c.id === 'source'),
                  target: containers?.find(c => c.id === 'target')
                }}
                position={position}
              />
            </Card>
          );
        })}
    </Stack>
  );
};

export default Polyglot;
