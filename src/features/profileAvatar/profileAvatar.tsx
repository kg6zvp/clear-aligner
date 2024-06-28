import { Avatar, Button, Divider, Menu, MenuItem } from '@mui/material';
import { Person } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Badge from '@mui/material/Badge';
import React, { useEffect } from 'react';
import { useNetworkState } from '@uidotdev/usehooks';

import ListItemIcon from '@mui/material/ListItemIcon';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import ListItemText from '@mui/material/ListItemText';
import FeedbackIcon from '@mui/icons-material/Feedback';
import LogoutIcon from '@mui/icons-material/Logout';
import Login from '../login/login';
import { signOut, getCurrentUser } from 'aws-amplify/auth';

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
  isSignInEnabled: boolean;
  setUserStatus: Function;
}

/**
 * This component is used for users to display the
 * User Profile Menu when the Avatar is clicked
 */
const ProfileMenu: React.FC<ProfileMenuProps> = ({isSignInEnabled, setUserStatus}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [popOverAnchorEl, setPopOverAnchorEl] = React.useState<null | HTMLElement>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);


  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleLoginClick = (event: { currentTarget: React.SetStateAction<HTMLElement | null>; }) => {
    setPopOverAnchorEl(event.currentTarget);
    handleClose()

    setIsLoginModalOpen(true);
  }
  const handleLoginModalClose = () => {
    setIsLoginModalOpen(false);
  }
  const handleSignOut = async() => {
    try{
      await signOut();
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
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        sx={{color: 'white'}}
      >
        <Person/>
      </Button>

      <Menu
        id="basic-menu"
        anchorReference="anchorPosition"
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        anchorPosition={{
          top: 735,
          left: 25,
        }}>

        <MenuItem onClick={handleClose} disabled>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            Settings
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleClose} disabled>
          <ListItemIcon>
            <InfoIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            About
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleClose} disabled>
          <ListItemIcon>
            <FeedbackIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            Feedback
          </ListItemText>
        </MenuItem>
        <Divider/>
        {isSignInEnabled
          ? (<MenuItem onClick={handleLoginClick}>
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
      />
    </div>
  );
}


/**
 * This component is used for users to login/logout
 * and do things like access personal preferences.
 */
export const ProfileAvatar = () => {
  const [userStatus, setUserStatus] = React.useState(userState.LoggedIn)
  const network = useNetworkState();

  const [isSignInEnabled, setIsSignInEnabled] = React.useState(true)

  useEffect( () => {
    if(network.online){
      setUserStatus(userState.LoggedOut)
      setIsSignInEnabled(true)
    }
    else{
      setUserStatus(userState.Offline)
      setIsSignInEnabled(false)
    }
  },[network])

  useEffect(() => {
    if(userStatus === userState.LoggedIn){
      setIsSignInEnabled(false);
    }
    else if (userStatus === userState.LoggedOut){
      setIsSignInEnabled(true);
    }
  },[userStatus])

  // check to see if a user is currently logged in
  useEffect( () => {
    const getCurrentUserDetails = async () => {
      try{
        const { username, userId, signInDetails } = await getCurrentUser();
        console.log('username is: ', username)
        console.log('userId is: ', userId)
        console.log('signInDetails is: ', signInDetails)
        setUserStatus(userState.LoggedIn)
        setIsSignInEnabled(false);
      }
      catch(error){
        console.log('error retrieving current user details: ', error)
      }
    }
    getCurrentUserDetails();
  },[])


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
                isSignInEnabled={isSignInEnabled}
                setUserStatus={setUserStatus}
              />
            </Avatar>
        </StyledBadge>
    </>

  )
}
