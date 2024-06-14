import { Drawer, List, ListItem, ListItemButton, ListItemIcon } from '@mui/material';
import React, { createContext, useContext, useMemo, useState } from 'react';
import Themed from './features/themed';
import { createSearchParams, Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import LinkIcon from '@mui/icons-material/Link';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import useTrackLocation from './utils/useTrackLocation';
import { THEME } from './App';
import useBusyDialog from './utils/useBusyDialog';
import { MiniDrawer } from './features/miniDrawer/miniDrawer';


export interface LayoutContextProps {
  windowTitle: string;
  setWindowTitle: (title: string) => void;
  setMenuBarDelegate: React.Dispatch<
    React.SetStateAction<JSX.Element | string | null>
  >;
}

export const LayoutContext = createContext({} as LayoutContextProps);

interface AppLayoutProps {
  theme: THEME
}

export const AppLayout: React.FC<AppLayoutProps> = ({theme}) => {
  useTrackLocation();
  const busyDialog = useBusyDialog();

  const [menuBarDelegate, setMenuBarDelegate] = useState(
    null as JSX.Element | string | null
  );
  const layoutContext: LayoutContextProps = useMemo(
    () => ({
      windowTitle: document.title,
      setWindowTitle: (title) => (document.title = title),
      setMenuBarDelegate
    }),
    [setMenuBarDelegate]
  );
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  return (
    <LayoutContext.Provider value={layoutContext}>
      <Themed theme={theme}>
        {busyDialog}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}>
          <MiniDrawer/>
          <div id={'outlet'} style={{ marginLeft: '40px', flexGrow: 1, overflow: 'auto' }}>
            <Outlet />
          </div>
        </div>
      </Themed>
    </LayoutContext.Provider>
  );
};
