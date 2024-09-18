import { IpcRenderer } from 'electron';

declare global {
  interface Window {
    Electron: {
      ipcRenderer: {
        send: (channel: string, data?: any) => void;
        on: (channel: string, listener: (...args: any[]) => void) => void;
        once: (channel: string, listener: (...args: any[]) => void) => void;
        invoke: (channel: string, ...args: any[]) => Promise<any>;
      };
      getAppPath: () => Promise<string>;
      saveSettings: (settings: any) => void;
      loadSettings: () => void;
      startDownloads: (data: any) => void;
      pauseDownload: (url: string) => void;
      resumeDownload: (url: string) => void;
      stopDownload: (url: string) => void;
      setMaxSpeed: (speed: number) => void;
      setMaxConcurrentDownloads: (maxConcurrent: number) => void;
      onDownloadProgress: (callback: (data: any) => void) => void;
      onDownloadComplete: (callback: (url: string) => void) => void;
      onDownloadError: (callback: (data: any) => void) => void;
      onSettingsLoaded: (callback: (settings: any) => void) => void;
    };
  }
}

export {};