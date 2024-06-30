/**
 * This file contains the NewFeatureComponent.
 */
import React, { ReactElement, useContext } from 'react';
import { Box } from '@mui/system';
import { Button, DialogTitle, Popover, Stack, Typography } from '@mui/material';
import TextField from '@mui/material/TextField';
import { signIn } from "aws-amplify/auth";
import { userState } from '../profileAvatar/profileAvatar';
import { AppContext } from '../../App';


interface LoginProps {
  isLoginModalOpen: boolean;
  handleLoginModalClose: () => void;
  popOverAnchorEl: HTMLElement | null;
  setUserStatus: Function;
}

export const Login:React.FC<LoginProps> = ({isLoginModalOpen, handleLoginModalClose, popOverAnchorEl, setUserStatus}): ReactElement => {
  const [emailAddress, setEmailAddress] = React.useState("")
  const [password, setPassword] = React.useState("")

  const {setIsSnackBarOpen, setSnackBarMessage } = useContext(AppContext)

  const handleLogin = async() => {
    try{
      const {nextStep, isSignedIn} = await signIn({
        username: emailAddress,
        password: password,
      })
      setUserStatus(userState.LoggedIn);
      setSnackBarMessage("Signed into ClearAligner Sync Server.")
      setIsSnackBarOpen(true);
    }
    catch (error){
      console.log('error signing in: ', error)
    }

  }

  return (
    <Popover
      open={isLoginModalOpen}
      onClose={handleLoginModalClose}
      anchorReference="anchorPosition"
      anchorPosition={{
        top: 590,
        left: 25,
      }}
    >
      <Box>
        <DialogTitle>
          <Typography
            color={'blue'}
            align={'center'}
            fontSize={'18px'}
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
            </Stack>
          </Box>
        </Stack>
      </Box>

    </Popover>
  );
};

export default Login;
