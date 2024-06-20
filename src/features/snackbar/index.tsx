/**
 * This file contains the CustomSnackbar Component
 */
import React, { ReactElement, useEffect } from 'react';
import Snackbar from '@mui/material/Snackbar';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNetworkState } from '@uidotdev/usehooks';

/**
 * CustomSnackbar displays a temporary informational
 * toast, aka snackbar
 */
export const CustomSnackbar = (): ReactElement => {
  const [isSnackBarOpen, setIsSnackBarOpen] = React.useState(false)
  const [snackBarMessage, setSnackBarMessage] = React.useState("")

  const network = useNetworkState();

  const handleCloseSnackbar = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setIsSnackBarOpen(false);
  };

  const action = (
    <React.Fragment>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleCloseSnackbar}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </React.Fragment>
  );

  useEffect( () => {
    if(network.online){
      setSnackBarMessage('Internet Connection Detected.')
      setIsSnackBarOpen(true)
    }
    else{
      setSnackBarMessage('No internet connection.')
      setIsSnackBarOpen(true)
    }
  },[network])


  return (
    <Snackbar
      open={isSnackBarOpen}
      autoHideDuration={5000}
      onClose={handleCloseSnackbar}
      message={snackBarMessage}
      action={action}
    />
  );
};


