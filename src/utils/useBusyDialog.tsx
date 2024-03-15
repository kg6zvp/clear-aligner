import { useContext, useMemo, useState } from 'react';
import { Box, CircularProgress, Dialog, DialogContent, DialogContentText, Typography } from '@mui/material';
import { useInterval } from 'usehooks-ts';
import { DatabaseStatus } from '../state/databaseManagement';
import _ from 'lodash';
import { AppContext } from '../App';
import { LinksTable } from '../state/links/tableManager';
import { InitializationStates } from '../workbench/query';
import { UserPreference } from '../state/preferences/tableManager';

const BusyRefreshTimeInMs = 500;
const DefaultBusyMessage = 'Please wait...';

const useBusyDialog = () => {
  const { projectState, preferences } = useContext(AppContext);
  const [databaseStatus, setDatabaseStatus] = useState<{
    projects: DatabaseStatus,
    links: DatabaseStatus
  }>();
  const [numProjects, setNumProjects] = useState<number>();
  const initializationState = useMemo<InitializationStates|undefined>(() => preferences?.initialized, [preferences?.initialized])
  useInterval(() => {
    const linkStatus = LinksTable.getLatestDatabaseStatus();
    const projectStatus = projectState?.projectTable.getDatabaseStatus();
    if (!_.isEqual({ projects: projectStatus, links: linkStatus }, databaseStatus)) {
      setDatabaseStatus({
        projects: projectStatus,
        links: linkStatus
      });
    }
    projectState?.projectTable?.getProjects(false)
      .then(newProjects => {
        if (newProjects?.size !== numProjects) {
          setNumProjects(newProjects?.size);
        }
      });
  }, BusyRefreshTimeInMs);
  const spinnerParams = useMemo<{
    isBusy?: boolean,
    text?: string,
    variant?: 'determinate' | 'indeterminate',
    value?: number
  }>(() => {
    const busyKey = Object.keys(databaseStatus ?? {}).find(key =>
      databaseStatus?.[key as keyof typeof databaseStatus]?.busyInfo?.isBusy);
    const busyInfo = databaseStatus?.[(busyKey ?? '') as keyof typeof databaseStatus]?.busyInfo;
    if (busyInfo?.isBusy) {
      const progressCtr = busyInfo?.progressCtr ?? 0;
      const progressMax = busyInfo?.progressMax ?? 0;
      if (progressMax > 0
        && progressMax >= progressCtr) {
        const percentProgress = Math.round((progressCtr / progressMax) * 100.0);
        return {
          isBusy: true,
          text: busyInfo?.userText ?? DefaultBusyMessage,
          variant: percentProgress < 100 ? 'determinate' : 'indeterminate',
          value: percentProgress < 100 ? percentProgress : undefined
        };
      } else {
        return {
          isBusy: true,
          text: busyInfo?.userText ?? DefaultBusyMessage,
          variant: 'indeterminate',
          value: undefined
        };
      }
    }
    if (initializationState !== InitializationStates.INITIALIZED) {
      return {
        isBusy: true,
        text: !numProjects
          ? 'Starting up...'
          : 'Loading project & corpora...',
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
  }, [databaseStatus, initializationState, numProjects]);

  return (
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
  );
};

export default useBusyDialog;
