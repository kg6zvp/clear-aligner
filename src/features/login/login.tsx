/**
 * This file contains the Login component
 */
import React, { ReactElement, useContext } from 'react';
import { Box } from '@mui/system';
import { Button, DialogTitle, Popover, Stack, Typography } from '@mui/material';
import TextField from '@mui/material/TextField';
import { signIn } from "aws-amplify/auth";
import { userState } from '../profileAvatar/profileAvatar';
import { AppContext } from '../../App';
import LogoutIcon from '@mui/icons-material/Logout';


interface LoginProps {
  isLoginModalOpen: boolean;
  handleLoginModalClose: () => void;
  popOverAnchorEl: HTMLElement | null;
  setUserStatus: Function;
  showLoginError: boolean;
  setShowLoginError: Function;
}

/**
 * The Login component is used for user authentication via AWS Cognito
 * and AWS Amplify
 */
export const Login:React.FC<LoginProps> = ({isLoginModalOpen,
                                             handleLoginModalClose,
                                             popOverAnchorEl,
                                             setUserStatus,
                                             setShowLoginError,
                                             showLoginError}): ReactElement => {
  const [emailAddress, setEmailAddress] = React.useState("")
  const [password, setPassword] = React.useState("")

  const {setIsSnackBarOpen, setSnackBarMessage } = useContext(AppContext)

  const handleLogin = async() => {
    try{
      await signIn({
        username: emailAddress,
        password: password,
      })
      setUserStatus(userState.LoggedIn);
      setShowLoginError(false)
      setSnackBarMessage("Signed into ClearAligner Sync Server.")
      setIsSnackBarOpen(true);
    }
    catch (error){
      console.log('error signing in: ', error)
      setShowLoginError(true)
    }

  }

  return (
    <Popover
      open={isLoginModalOpen}
      onClose={handleLoginModalClose}
      anchorEl={popOverAnchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
    >
      <Box>
        <DialogTitle>
          <Typography
            color={'#1976d2'}
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
            px={5}
            pb={6}
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
                sx={{
                  borderRadius: 5
                }}
                startIcon={<LogoutIcon/>}

              >Sign In
              </Button>
              {showLoginError &&
                <Typography
                  color={'red'}
                  fontSize={'small'}
                  sx={{
                    mt: 1
                  }}
                >
                  Incorrect email address or password.
                </Typography>
              }
            </Stack>
          </Box>
        </Stack>
      </Box>

    </Popover>
  );
};

export default Login;
