const path = require('path');
const { app, BrowserWindow, nativeTheme } = require('electron');
const isDev = require('electron-is-dev');
const { setUpIpcMain } = require(path.join(__dirname, '/database-main.js'));
const { default: installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } = require('electron-devtools-installer');

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    ...(nativeTheme.shouldUseDarkColors ? { backgroundColor: 'black' } : {}),
    show: false,
    width: 1450,
    height: 900,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '/database-renderer.js'), nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  if (isDev) {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, 'index.html'));
  }
  // Open the DevTools.
  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }

  win.once('ready-to-show', () => {
    win.show();
  });

  win.on('focus', () => {
    win.webContents.send('focus');
  });

  win.on('blur', () => {
    win.webContents.send('blur');
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  installExtension(REACT_DEVELOPER_TOOLS)
    .then((name) => console.log(`Initialized extension ${name}`))
    .catch((err) => console.error(`Error`, err));
  installExtension(REDUX_DEVTOOLS)
    .then((name) => console.log(`Initialized extension ${name}`))
    .catch((err) => console.error(`Error`, err));
  setUpIpcMain();
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
