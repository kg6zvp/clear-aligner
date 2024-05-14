import { Box, Button, Dialog } from '@mui/material';
import { ZodErrorDisplay } from './zodErrorDisplay';
import React from 'react';
import { ZodError } from 'zod';

export interface ZodErrorDialogProps {
  showDialog?: boolean;
  errors?: ZodError<any>;
  onDismissDialog?: () => void;
}

export const ZodErrorDialog = ({
  showDialog,
  onDismissDialog,
  errors
                               }: ZodErrorDialogProps) => {

  return (<Dialog
    fullWidth
    scroll={'paper'}
    open={!!showDialog}
    onClose={onDismissDialog}
    title={'Validation Error'}
     >
    <Box padding={'2em'}>
      Error validating alignment file
      <ZodErrorDisplay errors={errors} />
      <Box
        textAlign={'right'}
      >
        <Button onClick={onDismissDialog}>Close</Button>
      </Box>
    </Box>
  </Dialog>);
}
