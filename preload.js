const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('Electron', {
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => {
        // Ensure the channel and function are valid before setting up the listener
        if (typeof channel === 'string' && typeof func === 'function') {
          ipcRenderer.on(channel, (event, ...args) => {
            try {
              func(...args);
            } catch (error) {
              console.error(`Error in IPC handler for channel ${channel}:`, error);
            }
          });
        }
      },
      once: (channel, func) => {
        if (typeof channel === 'string' && typeof func === 'function') {
          ipcRenderer.once(channel, (event, ...args) => {
            try {
              func(...args);
            } catch (error) {
              console.error(`Error in IPC handler for channel ${channel}:`, error);
            }
          });
        }
      },
    invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  }
});

window.addEventListener('DOMContentLoaded', () => {
    // Check if `window.Electron` is defined
    if (window.Electron && window.Electron.ipcRenderer) {
      const { ipcRenderer } = window.Electron;
  
      ipcRenderer.on('download-progress', (progressData) => {
        try {
          if (progressData && typeof progressData === 'object') {
            const { url, progress, speed, status } = progressData;
            console.log('Download progress:', { url, progress, speed, status });
            // Handle progress update
          } else {
            console.error('Invalid progress data:', progressData);
          }
        } catch (error) {
          console.error('Error handling download-progress event:', error);
        }
      });
  
      ipcRenderer.on('download-complete', (url) => {
        console.log('Download complete:', url);
        // Handle download completion
      });
  
      ipcRenderer.on('download-error', (errorData) => {
        console.error('Download error:', errorData);
        // Handle download error
      });
    } else {
      console.error('window.Electron is not defined or ipcRenderer is missing');
    }
});