import { Avatar, Button, Menu, MenuItem } from '@mui/material';
import { Person } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Badge from '@mui/material/Badge';
import React, { useContext, useEffect } from 'react';

import ListItemIcon from '@mui/material/ListItemIcon';
import LogoutIcon from '@mui/icons-material/Logout';
import Login from '../login/login';
import { signOut } from 'aws-amplify/auth';
import { AppContext } from '../../App';

/**
 * userState is an object containing the different user States
 */
export const userState = {
  LoggedIn: {
    color:  'green',
    label: 'Logged In'
  },
  LoggedOut: {
    color: 'red',
    label: 'Logged Out',
  },
  Offline:{
    color: 'grey',
    label: 'Offline'
  }
}

interface ProfileMenuProps {
  isSignInButtonVisible: boolean;
  isSignInButtonDisabled: boolean;
}

/**
 * This component is used for users to display the
 * User Profile Menu when the Avatar is clicked
 */
const ProfileMenu: React.FC<ProfileMenuProps> = ({isSignInButtonVisible, isSignInButtonDisabled}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [popOverAnchorEl, setPopOverAnchorEl] = React.useState<null | HTMLElement>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);
  const [showLoginError, setShowLoginError] = React.useState(false);
  const { setUserStatus } = useContext(AppContext);
  const {setIsSnackBarOpen, setSnackBarMessage } = useContext(AppContext)

  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleLoginClick = (event: { currentTarget: React.SetStateAction<HTMLElement | null>; }) => {
    setPopOverAnchorEl(document.getElementById("anchorButton"));
    handleClose()

    setIsLoginModalOpen(true);
  }
  const handleLoginModalClose = () => {
    setIsLoginModalOpen(false);
    setShowLoginError(false);
  }
  const handleSignOut = async() => {
    try{
      await signOut();
      setIsSnackBarOpen(true);
      setSnackBarMessage("Signed out.")
      setUserStatus(userState.LoggedOut);
      handleClose();
    }
    catch(error){
      console.log('error signing out: ', error)
    }
  }

  return (
    <div>
      <Button
        id="anchorButton"
        sx={{
          color: 'white'
        }}
        onClick={handleClick}
      >
        <Person/>
      </Button>

      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        {isSignInButtonVisible
          ? (<MenuItem
            onClick={handleLoginClick}
            disabled={isSignInButtonDisabled}
          >
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Sign in to ClearAligner Sync
          </MenuItem>)
          : (<MenuItem onClick={handleSignOut}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Sign out of ClearAligner
          </MenuItem>)
        }

      </Menu>
      <Login
        isLoginModalOpen={isLoginModalOpen}
        handleLoginModalClose={handleLoginModalClose}
        popOverAnchorEl={popOverAnchorEl}
        setUserStatus={setUserStatus}
        showLoginError={showLoginError}
        setShowLoginError={setShowLoginError}
      />
    </div>
  );
}


/**
 * This component is used for users to login/logout
 * and do things like access personal preferences.
 */
export const ProfileAvatar = () => {
  const [isSignInButtonVisible, setIsSignInButtonVisible] = React.useState(true)
  const [isSignInButtonDisabled, setIsSignInButtonDisabled] = React.useState(false)
  const { network, userStatus } = useContext(AppContext);

  // Update Network and Logged In Status
  useEffect( () => {
    if(network.online){
      setIsSignInButtonDisabled(false)
    }
    else{
      setIsSignInButtonDisabled(true)
    }
  },[network])

  useEffect(() => {
    if(userStatus === userState.LoggedIn){
      setIsSignInButtonVisible(false);
    }
    else if (userStatus === userState.LoggedOut){
      setIsSignInButtonVisible(true);
    }
  },[userStatus])


  const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
      backgroundColor: userStatus.color,
      color: userStatus.color,
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
      '&::after': {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        animation: 'ripple 1.2s infinite ease-in-out',
        border: '1px solid currentColor',
        content: '""',
      },
    },
  }));

  return(
    <>
        <StyledBadge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
          sx={{
            margin: 1,
          }}
        >
            <Avatar
              sx={{
                height: 30,
                width: 30,
              }}
            >
              <ProfileMenu
                isSignInButtonVisible={isSignInButtonVisible}
                isSignInButtonDisabled={isSignInButtonDisabled}
              />
            </Avatar>
        </StyledBadge>
    </>

  )
}
