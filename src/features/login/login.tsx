/**
 * This file contains the NewFeatureComponent.
 */
import React, { ReactElement } from 'react';
import { Box } from '@mui/system';
import { Button, DialogTitle, Popover, Stack, Typography } from '@mui/material';
import TextField from '@mui/material/TextField';
import { signIn } from "aws-amplify/auth";
import { signOut } from "aws-amplify/auth"


interface LoginProps {
  isLoginModalOpen: boolean;
  handleLoginModalClose: () => void;
  popOverAnchorEl: HTMLElement | null;
}

export const Login:React.FC<LoginProps> = ({isLoginModalOpen, handleLoginModalClose, popOverAnchorEl}): ReactElement => {
  const [emailAddress, setEmailAddress] = React.useState("")
  const [password, setPassword] = React.useState("")

  const handleLogin = async() => {
    console.log('emailAddress is: ', emailAddress)
    console.log('password is: ', password)

    await signIn({
      username: emailAddress,
      password: password,
    })
  }

  const handleSignOut = async() => {
    await signOut();
  }

  return (
    <Popover
      open={isLoginModalOpen}
      onClose={handleLoginModalClose}
      anchorOrigin={{
        vertical:'bottom',
        horizontal: 'left'
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
              <TextField
                required
                id="emailAddress"
                label="Email address"
                type="email"
                InputLabelProps={{shrink: true, required: false}}
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEmailAddress(e.target.value)
                }}
              />
              <TextField
                required
                id="password"
                label="Password"
                type="password"
                InputLabelProps={{shrink: true, required: false}}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                variant="contained"
                onClick={handleLogin}
              >Sign In
              </Button>
              <Button
                variant="contained"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </Stack>


          </Box>
        </Stack>
      </Box>

    </Popover>
  );
};

export default Login;
