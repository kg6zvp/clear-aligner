/**
 * This file contains the NewFeatureComponent.
 */
import React, { ReactElement } from 'react';
import { Box } from '@mui/system';
import { Button, DialogTitle, Popover, Stack, Typography } from '@mui/material';
import TextField from '@mui/material/TextField';

interface LoginProps {
  isLoginModalOpen: boolean;
  handleLoginModalClose: () => void;
  popOverAnchorEl: any;
}

export const Login:React.FC<LoginProps> = ({isLoginModalOpen, handleLoginModalClose, popOverAnchorEl}): ReactElement => {
  return (
    <Popover
      open={isLoginModalOpen}
      onClose={handleLoginModalClose}
      anchorEl={popOverAnchorEl}
      anchorOrigin={{
        vertical:'top',
        horizontal: 'right'
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'right'
      }}
    >
      <Box>
        <DialogTitle>
          <Typography
            variant="h6"
            color={'blue'}
          >
            Sign in for ClearAligner Sync
          </Typography>
        </DialogTitle>
        <Stack>
          <Box
            component="form"
            sx={{
              '& .MuiTextField-root': { m:1}
            }}
            noValidate
            autoComplete="off"
            p={5}
          >
            <Stack>
              <TextField required id="emailAddress" label="Email address" type="email" InputLabelProps={{shrink: true, required: false}} />
              <TextField required id="password" label="Password" type="password" InputLabelProps={{shrink: true, required: false}}/>
              <Button
                variant="contained"
              >Sign In
              </Button>
            </Stack>


          </Box>
        </Stack>
      </Box>

    </Popover>
  );
};

export default Login;
