const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const https = require('https');
const throttle = require('throttle');

let mainWindow;
let settingsPath = path.join(app.getPath('userData'), 'settings.json');
let downloads = new Map();
let activeDownloads = 0;
let maxConcurrentDownloads = 2;
let maxDownloadSpeed = 5;
let downloadQueue = [];

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Ensure you have a preload script if needed
      contextIsolation: true, // Important for security
      enableRemoteModule: false,
      nodeIntegration: false, // Keep this false for security
      webSecurity: false, // Keep web security enabled
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

// Register the IPC handler
ipcMain.handle('get-app-path', async () => {
  return app.getAppPath();
});

ipcMain.on('save-settings', (event, settings) => {
  console.log('Received settings:', settings);
  maxConcurrentDownloads = settings.maxConcurrentDownloads || 2;
  maxDownloadSpeed = settings.maxDownloadSpeed || 5;
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
});

ipcMain.on('load-settings', (event) => { 
  console.log('Loading settings...');
  try {
    let settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    event.reply('settings-loaded', settings);
  } catch (error) {
    event.reply('settings-loaded', { desiredFileTypes: [], maxConcurrentDownloads: 2, maxDownloadSpeed: 5 });
  }
});

ipcMain.on('start-downloads', (event, { urls, maxSpeed }) => {
  downloadQueue.push(...urls.map(url => ({ url, maxSpeed })));
  processDownloadQueue();
});

ipcMain.on('pause-download', (event, url) => {
  let download = downloads.get(url);
  if (download) {
    download.pause();
  }
});

ipcMain.on('resume-download', (event, url) => {
  let download = downloads.get(url);
  if (download) {
    download.resume();
  }
});

ipcMain.on('stop-download', (event, url) => {
  let download = downloads.get(url);
  if (download) {
    download.stop();
    downloads.delete(url);
  }
});

ipcMain.on('set-max-speed', (event, speed) => {
  maxSpeed = speed;
  downloads.forEach(download => {
    download.setMaxSpeed(speed);
  });
});

ipcMain.on('set-max-concurrent-downloads', (event, maxConcurrent) => {
  maxConcurrentDownloads = maxConcurrent;
  processDownloadQueue(); // Re-process the queue to adjust concurrent downloads
});

function processDownloadQueue() {
  if (activeDownloads < maxConcurrentDownloads && downloadQueue.length > 0) {
    let { url, maxSpeed } = downloadQueue.shift();
    startDownload(url, maxSpeed);
  }
}

function startDownload(url, maxSpeed) {
  console.log('Starting download:', url);

  let filePath = path.join(__dirname, path.basename(url));
  let file = fs.createWriteStream(filePath);
  let downloaded = 0;
  let totalSize = 0;
  let startTime = Date.now();

  let request = https.get(url, response => {
    totalSize = parseInt(response.headers['content-length'], 10);

    console.log('Total size:', totalSize);

    let throttleStream = new throttle(maxSpeed * 1024 * 1024);
    response.pipe(throttleStream).pipe(file);

    throttleStream.on('data', chunk => {
      downloaded += chunk.length;
      let elapsedTime = (Date.now() - startTime) / 1000; // in seconds
      let progress = (downloaded / totalSize) * 100;
      let speed = (chunk.length / 1024 / 1024) / (elapsedTime || 1); // MB/s, avoid division by zero

      progress = parseFloat(progress.toFixed(2));
      speed = parseFloat(speed.toFixed(2));

      mainWindow.webContents.send('download-progress', { url, progress, speed, status: 'Downloading' });
    });
  });

  request.on('end', () => {
    mainWindow.webContents.send('download-complete', url);
    processDownloadQueue();
  });

  request.on('error', (error) => {
    mainWindow.webContents.send('download-error', { url, error: error.message });
    processDownloadQueue();
  });

  file.on('error', (error) => {
    mainWindow.webContents.send('download-error', { url, error: error.message });
    processDownloadQueue();
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
