import { Avatar, Button, Divider, IconButton, Menu, MenuItem } from '@mui/material';
import { Person } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close'
import { styled } from '@mui/material/styles';
import Badge from '@mui/material/Badge';
import React, { useEffect } from 'react';
import {useNetworkState} from "@uidotdev/usehooks"
import Snackbar from '@mui/material/Snackbar';
import ListItemIcon from '@mui/material/ListItemIcon';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import ListItemText from '@mui/material/ListItemText';
import FeedbackIcon from '@mui/icons-material/Feedback';
import LogoutIcon from '@mui/icons-material/Logout';

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
  const [isSnackBarOpen, setIsSnackBarOpen] = React.useState(false)
  const [snackBarMessage, setSnackBarMessage] = React.useState("")
  const [isSignInDisabled, setIsSignInDisabled] = React.useState(false)

  useEffect( () => {
    if(network.online){
      setUserStatus(userState.LoggedOut)
      setSnackBarMessage('Internet Connection Detected.')
      setIsSnackBarOpen(true)
      setIsSignInDisabled(false)

    }
    else{
      setSnackBarMessage('No internet connection.')
      setIsSnackBarOpen(true)
      setUserStatus(userState.Offline)
      setIsSignInDisabled(true)
    }
  },[network])

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
            margin: 2.3,
          }}
        >
            <Avatar
              sx={{
                height: 27,
                width: 27,
              }}
            >
              <ProfileMenu
                isSignInDisabled={isSignInDisabled}
              />
            </Avatar>
        </StyledBadge>
      <Snackbar
        open={isSnackBarOpen}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        message={snackBarMessage}
        action={action}
      />
    </>

  )
}
