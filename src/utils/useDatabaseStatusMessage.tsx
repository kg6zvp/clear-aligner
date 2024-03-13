import { useEffect, useMemo, useState } from 'react';
import { useDatabaseStatus } from '../state/links/tableManager';
import uuid from 'uuid-random';
import { Box, CircularProgress, Dialog, DialogContent, DialogContentText, Typography } from '@mui/material';


const DatabaseStatusRefreshTimeInMs = 500;

const useDatabaseStatusMessage = () => {

  const [databaseCheckKey, setDatabaseCheckKey] = useState<string>();
  const { result: databaseStatus } = useDatabaseStatus(databaseCheckKey);
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setDatabaseCheckKey(uuid());
    }, DatabaseStatusRefreshTimeInMs);
    return () => window.clearInterval(intervalId);
  }, []);

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
          variant: percentProgress < 100 ? 'determinate' : 'indeterminate',
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
    return {
      isBusy: false,
      text: undefined,
      variant: 'indeterminate',
      value: undefined
    };
  }, [databaseStatus?.busyInfo]);


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
}

export default useDatabaseStatusMessage;
