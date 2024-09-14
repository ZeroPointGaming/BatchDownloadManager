import { IpcRenderer } from 'electron';

interface Window {
    Electron: {
    ipcRenderer: IpcRenderer;
  };
}