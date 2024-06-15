import React, { createContext, useMemo, useState } from 'react';
import Themed from './features/themed';
import { Outlet } from 'react-router-dom';
import useTrackLocation from './utils/useTrackLocation';
import { THEME } from './App';
import useBusyDialog from './utils/useBusyDialog';
import { MiniDrawer } from './features/miniDrawer/miniDrawer';
import { Box } from '@mui/system';

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
          <Box sx={{ display: "flex" }}>
            <MiniDrawer/>
            <div id={'outlet'} style={{ flexGrow: 1, overflow: 'auto' }}>
              <Outlet />
            </div>
          </Box>
        </div>
      </Themed>
    </LayoutContext.Provider>
  );
};
