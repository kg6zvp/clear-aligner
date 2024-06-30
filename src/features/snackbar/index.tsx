/**
 * This file contains the CustomSnackbar Component
 */
import React, { useContext } from 'react';
import Snackbar from '@mui/material/Snackbar';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNetworkState } from '@uidotdev/usehooks';
import { AppContext } from '../../App';

/**
 * CustomSnackbar displays a temporary informational
 * toast, aka snackbar
 */
export const CustomSnackbar= () => {

  const {isSnackBarOpen, setIsSnackBarOpen, snackBarMessage } = useContext(AppContext)

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

  return (
    <Snackbar
      open={isSnackBarOpen}
      autoHideDuration={3500}
      onClose={handleCloseSnackbar}
      message={snackBarMessage}
      action={action}
      anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
    />
  );
};


