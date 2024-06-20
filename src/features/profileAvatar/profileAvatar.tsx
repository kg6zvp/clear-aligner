import { Avatar, Button, Divider, Menu, MenuItem } from '@mui/material';
import { Person } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Badge from '@mui/material/Badge';
import React, { useEffect } from 'react';
import {useNetworkState} from "@uidotdev/usehooks"

import ListItemIcon from '@mui/material/ListItemIcon';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import ListItemText from '@mui/material/ListItemText';
import FeedbackIcon from '@mui/icons-material/Feedback';
import LogoutIcon from '@mui/icons-material/Logout';
import { CustomSnackbar } from '../snackbar';

const userState = {
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
  isSignInDisabled: boolean;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({isSignInDisabled}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

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
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
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
        <MenuItem disabled={isSignInDisabled} onClick={handleClose}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Sign in to ClearAligner Sync
        </MenuItem>
      </Menu>
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

  const [isSignInDisabled, setIsSignInDisabled] = React.useState(false)

  useEffect( () => {
    if(network.online){
      setUserStatus(userState.LoggedOut)
      setIsSignInDisabled(false)
    }
    else{
      setUserStatus(userState.Offline)
      setIsSignInDisabled(true)
    }
  },[network])


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
                height: 35,
                width: 35,
              }}
            >
              <ProfileMenu
                isSignInDisabled={isSignInDisabled}
              />
            </Avatar>
        </StyledBadge>
    </>

  )
}
