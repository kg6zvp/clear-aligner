/**
 * This file contains the MiniDrawer component which is used for the main
 * navigation of the App.
 */
import * as React from "react";
import ListItem from "@mui/material/ListItem";
import HomeIcon from "@mui/icons-material/Home";
import LinkIcon from "@mui/icons-material/Link";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ProfileAvatar } from '../profileAvatar/profileAvatar';

const drawerWidth = 240;
import { Drawer, IconButton, Tooltip } from '@mui/material';



/**
 * This component is used as the main navigation for the app
 */
export const MiniDrawer = () => {
  const [selectedIndex, setSelectedIndex] = React.useState("");
  const drawerWidth = 50;

  const ListItems = {
    "Home": {
      key: '/projects',
      path: '/projects',
      displayName: 'Home/Projects'
    },
    "Alignment": {
      key: '/alignment',
      path: '/alignment',
      displayName: 'Alignment Editor'
    },
    "Concordance": {
      key: '/concordance',
      path: '/concordance',
      displayName: 'Concordance'
    }

  }

  const location = useLocation();
  useEffect(() => {
    setSelectedIndex(location.pathname)
  }, [location.pathname])

  const navigate = useNavigate();

    return (
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="permanent"
        anchor="left"
      >
          <ListItem key={ListItems.Home.key} sx={{ display: "flex", flexDirection: "column" }}>
            <Tooltip title={ListItems.Home.displayName} placement="right" arrow>
              <IconButton
                onClick={() => {
                  navigate({ pathname: ListItems.Home.path })
                }}
                color={selectedIndex === ListItems.Home.path ? 'primary' : 'default'}
                sx={{
                  p: 1,
                  backgroundColor: selectedIndex === ListItems.Home.path ? 'lightgrey' : null,
                  '&:hover': {
                    backgroundColor: 'lightgrey'
                  }
                }}
              >
                <HomeIcon />
              </IconButton>
            </Tooltip>

          </ListItem>
          <ListItem key={ListItems.Alignment.key} sx={{ display: "flex", flexDirection: "column" }}>
            <Tooltip title={ListItems.Alignment.displayName} placement="right" arrow>
              <IconButton
                onClick={() => {
                  navigate({ pathname: ListItems.Alignment.path })
                }}
                color={selectedIndex === ListItems.Alignment.path ? 'primary' : 'default'}
                sx={{
                  p: 1,
                  backgroundColor: selectedIndex === ListItems.Alignment.path ? 'lightgrey' : null,
                  '&:hover': {
                    backgroundColor: 'lightgrey'
                  }
                }}
              >
                  <LinkIcon />
              </IconButton>
            </Tooltip>
          </ListItem>
          <ListItem key={ListItems.Concordance.key} sx={{ display: "flex", flexDirection: "column" }}>
            <Tooltip title={ListItems.Concordance.displayName} placement="right" arrow>
              <IconButton
                onClick={() => {
                  navigate({ pathname: ListItems.Concordance.path })
                }}
                color={selectedIndex === ListItems.Concordance.path ? 'primary' : 'default'}
                sx={{
                  p: 1,
                  backgroundColor: selectedIndex === ListItems.Concordance.path ? 'lightgrey' : null,
                  '&:hover': {
                    backgroundColor: 'lightgrey'
                  }
                }}
              >
                  <SpaceDashboardIcon />
              </IconButton>
            </Tooltip>
          </ListItem>
          <Divider />
          <ListItem key={"5"} disablePadding sx={{ display: "block" }}>
            <ProfileAvatar/>
          </ListItem>

        </Drawer>
    )
}
