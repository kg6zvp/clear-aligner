/**
 * This file contains the useAlignmentStateContextMenu hook used in the Alignment
 * Editor to allow users to change the link state by right-clicking on an alignment
 */
import { Box, Menu, MenuItem, Typography, useTheme } from '@mui/material';
import ListItemIcon from '@mui/material/ListItemIcon';
import LinkIcon from '@mui/icons-material/Link';
import CheckIcon from '@mui/icons-material/Check';
import { Cancel, CheckCircle, Flag } from '@mui/icons-material';
import React from 'react';
import { Link } from '../structs';
import { useSaveLink } from '../state/links/tableManager';


/**
 * useAlignmentStateContextMenu hook
 * allow users to change the link state by right-clicking on an alignment
 */
const useAlignmentStateContextMenu = (links?: Map<string, Link>): any => {
  const [isLinkStateMenuOpen, setIsLinkStateMenuOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [linkState ,setLinkState ] = React.useState("")
  const [wordPartID, setWordPartID] = React.useState("");
  const theme = useTheme();
  const {saveLink} = useSaveLink();

  const handleRightClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>,
                            wordPartID: string) => {
    setWordPartID(wordPartID);

    // grab the link if it exists
   const thisLink = links?.get(wordPartID)

    // if this is a valid link, open the menu
    if(thisLink){
      setLinkState(thisLink?.metadata.status);
      setAnchorEl(event.currentTarget);
      setIsLinkStateMenuOpen(true);
    }
    //otherwise don't open the menu
  }

  const handleClose = () => {
    setAnchorEl(null);
    setIsLinkStateMenuOpen(false);
  };

  // change the state of the alignment
  const handleMenuClick = (event: any, wordPartID: string, links?: Map<string, Link>) => {
    const { linkState } = event.currentTarget.dataset;
    // prepare an updated link to save
    const thisLink = links?.get(wordPartID)
    const updatedLink = {
      ...thisLink,
      metadata: {
        ...thisLink?.metadata,
        status: linkState
      }
    }
    // save link
    saveLink(updatedLink as Link);

    // close menu
    setAnchorEl(null);
    setIsLinkStateMenuOpen(false);
  }

  const ContextMenu = () => (
    <Menu
      id="link-state-menu"
      anchorEl={anchorEl}
      open={isLinkStateMenuOpen}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <MenuItem
        data-link-state={'created'}
        onClick={(e) => handleMenuClick( e, wordPartID, links)}
      >
        <ListItemIcon >
          <LinkIcon sx={{
            color : theme.palette.primary.main
          }} />
        </ListItemIcon>
        <Box
          sx={{width: '87px', display: 'flex', justifyContent: 'space-between'}}
        >
          <Typography
            sx={{fontSize: '13px'}}
          >
            Aligned
          </Typography>
          {linkState === 'created' && <CheckIcon sx={{width: '18px', height: '20px', color: theme.palette.alignmentStateMenu.check}}/>
          }
        </Box>
      </MenuItem>
      <MenuItem
        data-link-state={'rejected'}
        onClick={(e) => handleMenuClick( e, wordPartID, links)}
      >
        <ListItemIcon >
          <Cancel sx={{
            color : theme.palette.error.main
          }} />
        </ListItemIcon>
        <Box
          sx={{width: '87px', display: 'flex', justifyContent: 'space-between', gap: '12px'}}
        >
          <Typography
            sx={{fontSize: '13px'}}
          >
            Rejected
          </Typography>
          {linkState === 'rejected' && <CheckIcon sx={{width: '18px', height: '20px', color: theme.palette.alignmentStateMenu.check}}/>
          }
        </Box>
      </MenuItem>
      <MenuItem
        data-link-state={'approved'}
        onClick={(e) => handleMenuClick( e, wordPartID, links)}
      >
        <ListItemIcon>
          <CheckCircle sx={{
            color : theme.palette.success.main
          }}/>
        </ListItemIcon>
        <Box
          sx={{width: '87px', display: 'flex', justifyContent: 'space-between', gap: '12px'}}
        >
          <Typography
            sx={{fontSize: '13px'}}
          >
            Approved
          </Typography>
          {linkState === 'approved' && <CheckIcon sx={{width: '18px', height: '20px', color: theme.palette.alignmentStateMenu.check}}/>
          }
        </Box>
      </MenuItem>
      <MenuItem
        data-link-state={'needsReview'}
        onClick={(e) => handleMenuClick( e, wordPartID, links)}
      >
        <ListItemIcon>
          <Flag sx={{
            color : theme.palette.warning.main
          }} />
        </ListItemIcon>
        <Box
          sx={{width: '87px', display: 'flex', justifyContent: 'space-between'}}
        >
          <Typography
            sx={{fontSize: '13px'}}
          >
            Flagged
          </Typography>
          {linkState === 'needsReview' && <CheckIcon sx={{width: '18px', height: '20px', color: theme.palette.alignmentStateMenu.check}}/>
          }
        </Box>
      </MenuItem>
    </Menu>
  )

  return [ContextMenu, handleRightClick, handleClose]
};

export default useAlignmentStateContextMenu;
