/**
 * This file contains the Login component
 */
import React, { ReactElement, useContext } from 'react';
import { Box } from '@mui/system';
import { Button, DialogTitle, Link, Popover, Stack, Typography, useTheme } from '@mui/material';
import TextField from '@mui/material/TextField';
import { signIn } from "aws-amplify/auth";
import { userState } from '../profileAvatar/profileAvatar';
import { AppContext } from '../../App';
import LogoutIcon from '@mui/icons-material/Logout';
import { useLocation } from 'react-router-dom';


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
  const theme = useTheme();
  const {setIsSnackBarOpen, setSnackBarMessage } = useContext(AppContext)
  const [showPasswordResetURL, setShowPasswordResetURL] = React.useState(false);

  const location = useLocation();

  const handleLogin = async() => {
    setShowLoginError(false);
    setShowPasswordResetURL(false);
    try{
      const signInResponse = await signIn({
        username: emailAddress,
        password: password,
      })
      console.log('signInResponse is: ', signInResponse)

      if (signInResponse.nextStep?.signInStep ===
        "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED"){
        setUserStatus(userState.LoggedOut);
        setShowPasswordResetURL(true);
      }
      else{
        setUserStatus(userState.LoggedIn);
        setShowLoginError(false)
        setSnackBarMessage("Signed in to ClearAligner Sync.")
        setIsSnackBarOpen(true);
      }
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
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <Box>
        <DialogTitle>
          <Typography
            color={theme.palette.primary.main}
            align={'center'}
            fontSize={'18px'}
          >
            ClearAligner Sync
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
                  color={'error'}
                  fontSize={'small'}
                  sx={{
                    mt: 1
                  }}
                >
                  Incorrect email address or password.
                </Typography>
              }
              {showPasswordResetURL &&
                <Typography
                  color={'error'}
                  fontSize={'small'}
                  sx={{
                    mt: 1
                  }}
                >
                  Please <Link href={`https://clear-aligner-2.auth.us-east-1.amazoncognito.com/login?client_id=jteqgoa1rgptil2tdi7b0nqjb&response_type=code&scope=aws.cognito.signin.user.admin+openid&redirect_uri=http://localhost:3000${location.pathname}`}>
                  reset your password </Link> before signing in.
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
