import React, { createContext, useMemo } from 'react';
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
}

export const LayoutContext = createContext({} as LayoutContextProps);

interface AppLayoutProps {
  theme: THEME
}

export const AppLayout: React.FC<AppLayoutProps> = ({theme}) => {
  useTrackLocation();
  const busyDialog = useBusyDialog();

  const layoutContext: LayoutContextProps = useMemo(
    () => ({
      windowTitle: document.title,
      setWindowTitle: (title) => (document.title = title),
    }),
    []
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
