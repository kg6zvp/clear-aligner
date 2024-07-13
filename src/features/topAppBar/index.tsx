/**
 * This file contains the AppBar which is used at the top of all
 * pages and contains context-sensitive controls.
 */
import { ReactElement } from 'react';
import { Box } from '@mui/system';
import { IconButton, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import AppBar from '@mui/material/AppBar';
import { ProfileAvatar } from '../profileAvatar/profileAvatar';
import * as React from 'react';

export const topAppBar = (): ReactElement => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="static"
      >
        <Toolbar>
          <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
            Projects
          </Typography>
          <ProfileAvatar/>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default topAppBar;
