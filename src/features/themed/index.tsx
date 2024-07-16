/**
 * This file sets up the MUI Theme via the Themed wrapper component.
 */

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { green, orange, red } from '@mui/material/colors';

// Not sure yet if we really need to manually load these.
// import '@fontsource/roboto/300.css';
// import '@fontsource/roboto/400.css';
// import '@fontsource/roboto/500.css';
// import '@fontsource/roboto/700.css';

export enum ThemeMode {
  LIGHT = "light",
  DARK = "dark"
}

const baseDarkTheme = createTheme({
  palette: {
    mode: ThemeMode.DARK,
  },
});


const baseLightTheme = createTheme({
  palette: {
    mode: ThemeMode.LIGHT,
  },
});

console.log('baseLightTheme is: ', baseLightTheme)

const darkTheme = createTheme({
  palette: {
    mode: ThemeMode.DARK,
    text: {
      primary: '#FFFFFF'
    },
    primary: {
      main: '#56B9DA',
      dark: '#39ABD4',
      light: '#E0F3F8',
      contrastText: '#000000'
    },
  },
  typography: {
    unlinked: {
      fontStyle: 'italic',
      color: baseDarkTheme.palette.grey['500'],
    },
    selected: {
      color: baseDarkTheme.palette.grey['50'],
      backgroundColor: baseDarkTheme.palette.grey['600'],
      borderRadius: '0.25rem',
    },
  },
});

const lightTheme = createTheme({
  palette: {
    mode: ThemeMode.LIGHT,
    text: {
      primary: '#000000'
    },
    primary: {
      main: '#219ECF',
      dark: '#1990C1',
      light: '#39ABD4',
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#FF7F50',
      dark: '#F5642F',
      light: '#FEB399',
      contrastText: '#FFFFFF'
    },
    error: {
      main: red[500],
      dark: red[600],
      light: red[400],
      contrastText: '#FFFFFF'
    },
    warning:{
      main: orange[600],
      dark: orange[800],
      light: orange[500],
      contrastText: '#FFFFFF'
    },
    info:{
      main: '#0F7EAF',
      dark: '#044F7A',
      light: '#219ECF',
      contrastText: '#FFFFFF'
    },
    success:{
      main: green[500],
      dark: green[600],
      light: green[400],
      contrastText: '#FFFFFF'
    },
  },
  typography: {
    unlinked: {
      fontStyle: 'italic',
      color: baseLightTheme.palette.grey['500'],
    },
    selected: {
      color: baseLightTheme.palette.grey['50'],
      backgroundColor: baseLightTheme.palette.grey['800'],
      borderRadius: '0.25rem',
    },
  },
  components: {
    MuiDrawer:{
      styleOverrides:{
        paper:{
          backgroundColor: '#eeeeee'
        }
      }
    }
  }
});
console.log('lightTheme is: ', lightTheme)

interface ThemedProps {
  theme: 'day' | 'night';
  children: any;
}

const Themed = (props: ThemedProps) => {
  const { theme, children } = props;
  const chosenTheme = theme === 'night' ? darkTheme : lightTheme;
  return (
    <ThemeProvider theme={chosenTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default Themed;
