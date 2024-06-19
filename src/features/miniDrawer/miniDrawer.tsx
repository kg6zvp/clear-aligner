/**
 * This file contains the MiniDrawer component which is used for the main
 * navigation of the App.
 */
import * as React from "react";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import HomeIcon from "@mui/icons-material/Home";
import LinkIcon from "@mui/icons-material/Link";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Drawer, IconButton, Tooltip } from '@mui/material';



/**
 * This component is used as the main navigation for the app
 */
export const MiniDrawer = () => {
  const [open, setOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState("");
  const drawerWidth = 50;

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
          <ListItem key={"2"} disablePadding sx={{ display: "block" }}>
            <Tooltip title="Home/Projects" placement="right" arrow>
              <IconButton
                onClick={() => {
                  navigate({ pathname: '/projects' })
                }}
                color={selectedIndex === '/projects' ? 'primary' : 'default'}
                sx={{
                  px: 1.75
                }}
              >
                <HomeIcon />
              </IconButton>
            </Tooltip>

          </ListItem>
          <ListItem key={"3"} disablePadding sx={{ display: "block" }}>
            <Tooltip title="Alignment" placement="right" arrow>
              <IconButton
                onClick={() => {
                  navigate({ pathname: '/alignment' })
                }}
                color={selectedIndex === '/alignment' ? 'primary' : 'default'}
                sx={{
                  px: 1.75
                }}
              >
                  <LinkIcon />
              </IconButton>
            </Tooltip>
          </ListItem>
          <ListItem key={"4"} disablePadding sx={{ display: "block" }}>
            <Tooltip title="Concordance" placement="right" arrow>
              <IconButton
                onClick={() => {
                  navigate({ pathname: '/concordance' })
                }}
                color={selectedIndex === '/concordance' ? 'primary' : 'default'}
                sx={{
                  px: 1.75
                }}
              >
                  <SpaceDashboardIcon />
              </IconButton>
            </Tooltip>
          </ListItem>

        </Drawer>
    )
}
