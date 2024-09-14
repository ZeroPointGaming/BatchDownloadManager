const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const https = require('https');
const throttle = require('throttle');

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

  console.log('Settings path:', settingsPath);
}

ipcMain.on('save-settings', (event, settings) => {
  console.log('Received settings:', settings);
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
});

ipcMain.on('load-settings', (event) => {
  console.log('Loading settings...');
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    event.reply('settings-loaded', settings);
  } catch (error) {
    event.reply('settings-loaded', { desiredFileTypes: [] });
  }
});

// IPC handlers
ipcMain.on('start-downloads', (event, { urls, maxSpeed }) => {
  console.log('Starting downloads...');
  urls.forEach(url => startDownload(url, maxSpeed));
});

ipcMain.on('pause-download', (event, url) => {
  console.log('Pausing download:', url);
  const download = downloads.get(url);
  if (download) {
    download.pause();
  }
});

ipcMain.on('resume-download', (event, url) => {
  console.log('Resuming download:', url);
  const download = downloads.get(url);
  if (download) {
    download.resume();
  }
});

ipcMain.on('stop-download', (event, url) => {
  console.log('Stopping download:', url);
  const download = downloads.get(url);
  if (download) {
    download.stop();
    downloads.delete(url);
  }
});

ipcMain.on('set-max-speed', (event, speed) => {
  console.log('Setting max speed to:', speed);
  downloads.forEach(download => {
    download.setMaxSpeed(speed);
  });
});

function startDownload(url, maxSpeed) {
  console.log('Starting download:', url);
  const file = fs.createWriteStream(path.basename(url));
  let downloaded = 0;
  let totalSize = 0;

  const request = https.get(url, response => {
    totalSize = parseInt(response.headers['content-length'], 10);

    const throttleStream = new throttle(maxSpeed * 1024 * 1024);
    response.pipe(throttleStream).pipe(file);

    throttleStream.on('data', chunk => {
      downloaded += chunk.length;
      const progress = (downloaded / totalSize) * 100;
      const speed = chunk.length / 1024 / 1024; // MB/s
      mainWindow.webContents.send('download-progress', { url, progress, speed, status: 'Downloading' });
    });
  });

  const download = {
    pause: () => request.pause(),
    resume: () => request.resume(),
    stop: () => {
      request.abort();
      file.close();
    },
    setMaxSpeed: (speed) => {
      throttleStream.setRate(speed * 1024 * 1024);
    }
  };

  downloads.set(url, download);

  request.on('end', () => {
    mainWindow.webContents.send('download-complete', url);
    downloads.delete(url);
  });
}

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
