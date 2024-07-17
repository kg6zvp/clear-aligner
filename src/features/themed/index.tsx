/**
 * This file sets up the MUI Theme via the Themed wrapper component.
 */

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { green, grey, orange, red } from '@mui/material/colors';

export enum ThemeMode {
  LIGHT = "light",
  DARK = "dark"
}

// const baseDarkTheme = createTheme({
//   palette: {
//     mode: ThemeMode.DARK,
//   },
// });


// const baseLightTheme = createTheme({
//   palette: {
//     mode: ThemeMode.LIGHT,
//   },
// });


const darkTheme = createTheme({
  palette: {
    mode: ThemeMode.DARK,
    text: {
      primary: '#FFFFFF'
    },
    primary: {
      main: '#56B9DA', // Cerulean Blue 300
      dark: '#39ABD4', // Cerulean Blue 400
      light: '#E0F3F8', // Cerulean Blue 50
      contrastText: '#000000'
    },
    secondary: {
      main: '#FEB399', // Coral 200
      dark: '#FF7F50', // Coral 400
      light: '#FAEBE9', // Coral 50
      contrastText: '#000000'
    },
    error: {
      main: red[400],
      dark: red[500],
      light: red[300],
      contrastText: '#000000'
    },
    warning:{
      main: orange[400],
      dark: orange[700],
      light: orange[300],
      contrastText: '#000000'
    },
    info:{
      main: '#39ABD4', // Cerulean Blue 400
      dark: '#0F7EAF', // Cerulean Blue 700
      light: '#56B9DA', // Cerulean Blue 300
      contrastText: '#000000'
    },
    success:{
      main: green[300],
      dark: green[500],
      light: green[200],
      contrastText: '#000000'
    },
    statusIndicators: {
      aligned: '#219ECF', // Cerulean Blue 500
      approved: '#47CF21', // Green 500
      flagged: '#FB8C00', // Orange 600
      rejected: '#F44336', // Red 500
    },
    tokenButtons: {
      defaultTokenButtons: {
        default: '#00000000', //Transparent
        text: '#000000',
        outline: '#DCDCDC',
        rollover: '#FFF9C4',
        selected: '#47CF21'
      },
      alignedTokenButtons :{
        default: '',
        text: '',
        textReversed: '',
        outline: '',
        rollover: '',
        selected: '',
        icons: '',
        iconsReversed: ''
      },
      machineAlignedTokenButtons :{
        default: '',
        text: '',
        textReversed: '',
        outline: '',
        rollover: '',
        selected: '',
        icons: '',
        iconsReversed: ''
      },
      approvedTokenButtons :{
        default: '',
        text: '',
        textReversed: '',
        outline: '',
        rollover: '',
        selected: '',
        icons: '',
        iconsReversed: ''
      },
      flaggedTokenButtons :{
        default: '',
        text: '',
        textReversed: '',
        outline: '',
        rollover: '',
        selected: '',
        icons: '',
        iconsReversed: ''
      },
    },
    background :{
      paper: '',
      default: ''
    },
  },
  typography: {
    unlinked: {
      fontStyle: 'italic',
      color: grey['500'],
    },
    selected: {
      color: grey['50'],
      backgroundColor: grey['600'],
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
      main: '#219ECF', // Cerulean Blue 500
      dark: '#1990C1', // Cerulean Blue 600
      light: '#39ABD4', // Cerulean Blue 400
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#FF7F50', // Coral 400
      dark: '#F5642F', // Coral 600
      light: '#FEB399', // Coral 200
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
      main: '#0F7EAF', // Cerulean Blue 700
      dark: '#044F7A', // Cerulean Blue 900
      light: '#219ECF', // Cerulean Blue 500
      contrastText: '#FFFFFF'
    },
    success:{
      main: green[500],
      dark: green[600],
      light: green[400],
      contrastText: '#FFFFFF'
    },
    statusIndicators: {
      aligned: '#219ECF', // Cerulean Blue 500
      approved: '#47CF21', // Green 500
      flagged: '#FB8C00', // Orange 600
      rejected: '#F44336', // Red 500
    },
    tokenButtons: {
      defaultTokenButtons: {
        default: '#00000000', //Transparent
        text: '#000000',
        outline: '#DCDCDC',
        rollover: '#FFF9C4', // Yellow 100
        selected: '#47CF21' // Yello 500
      },
      alignedTokenButtons :{
        default: '#00000000', //Transparent
        text: '#000000', // Black
        textReversed: '#FFFFFF', // White
        outline: '#219ECF', // White
        rollover: '#E0F3F8', // Cerulean Blue 50
        selected: '#219ECF', // Cerulean Blue 500
        icons: '#219ECF', // Cerulean Blue 500
        iconsReversed: '#E0F3F8' // Cerulean Blue 50
      },
      machineAlignedTokenButtons :{
        default: '#00000000', //Transparent
        text: '#000000', // Black
        textReversed: '#FFFFFF', // White
        outline: '#33D6FF #AD8CFF',
        rollover: '#E0F3F8', // Cerulean Blue 50
        selected: '#219ECF', // Cerulean Blue 500
        icons: '',
        iconsReversed: ''
      },
      approvedTokenButtons :{
        default: '',
        text: '',
        textReversed: '',
        outline: '',
        rollover: '',
        selected: '',
        icons: '',
        iconsReversed: ''
      },
      flaggedTokenButtons :{
        default: '',
        text: '',
        textReversed: '',
        outline: '',
        rollover: '',
        selected: '',
        icons: '',
        iconsReversed: ''
      },
    },
    background :{
      paper: '',
      default: ''
    }
  },
  typography: {
    unlinked: {
      fontStyle: 'italic',
      color: grey['500'],
    },
    selected: {
      color: grey['50'],
      backgroundColor: grey['800'],
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
