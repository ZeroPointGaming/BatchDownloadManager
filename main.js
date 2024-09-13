const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');

let mainWindow;
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      //preload: path.join(__dirname, 'preload.js'), // Ensure you have a preload script if needed
      contextIsolation: true, // Important for security
      enableRemoteModule: false,
      nodeIntegration: false, // Keep this false for security
      webSecurity: true, // Keep web security enabled
      sandbox: false, // Enable or disable based on your requirements
    },
  });

  // Load the Angular app from the dist folder
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'dist', 'index.html'),
      protocol: 'file:',
      slashes: true,
    })
  );

  // Open the DevTools for debugging
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Handle downloads and UI interactions via IPC
ipcMain.on('start-download', (event, downloadUrl) => {
  // Implement download logic or call a function to handle download
  console.log(`Received download request for URL: ${downloadUrl}`);

  // Example: Sending progress updates to Angular
  // Simulate progress with a setInterval, replace with real download logic
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += 10;
    if (progress > 100) {
      clearInterval(progressInterval);
      event.sender.send('download-complete', downloadUrl);
    } else {
      event.sender.send('download-progress', { url: downloadUrl, progress });
    }
  }, 500);
});


ipcMain.on('save-settings', (event, settings) => {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
});

ipcMain.on('load-settings', (event) => {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    event.reply('settings-loaded', settings);
  } catch (error) {
    event.reply('settings-loaded', { desiredFileTypes: [] });
  }
});

// App lifecycle management
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
