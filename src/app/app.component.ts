import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { Observable, from, merge } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  urls: string[] = [];
  downloadProgress: { [key: string]: { progress: number, speed: string, status: string } } = {};
  ipcRenderer: any = false; //Default to false so that if its not set in the constructor correctly we exit.
  maxDownloadSpeed: number = 5;
  maxConcurrentDownloads: number = 2; // Default value
  desiredFileTypes: string[] = [];
  @ViewChild('urlInput') urlInput!: ElementRef<HTMLTextAreaElement>;

  constructor(private ngZone: NgZone) {
    this.ipcRenderer = window?.Electron?.ipcRenderer;

    if (this.ipcRenderer) {
      this.ipcRenderer.invoke('get-app-path')
        .then((result: string) => {
          console.log('App path:', result);
        })
        .catch((error: any) => {
          console.error('Error getting app path:', error);
        });
    } else {
      console.error('Electron is not defined in the window context.');
    }
  }

  ngOnInit() {
    this.setupIpcListeners();
    this.loadSettings();
  }

  setupIpcListeners() {
    if (this.ipcRenderer) {
      this.ipcRenderer.on('download-progress', (event: any, data: any) => {
        this.ngZone.run(() => {
          const { url, progress, speed, status } = data;
          this.downloadProgress[url] = {
            progress,
            speed: `${speed.toFixed(2)} MB/s`,
            status
          };
        });
      });

      this.ipcRenderer.on('download-complete', (event: any, url: any) => {
        this.ngZone.run(() => {
          this.urls = this.urls.filter(u => u !== url);
          delete this.downloadProgress[url];
        });
      });

      this.ipcRenderer.on('download-error', (event: any, data: any) => {
        this.ngZone.run(() => {
          const { url, error } = data;
          this.downloadProgress[url] = {
            progress: 0,
            speed: '0 MB/s',
            status: 'Error'
          };
          console.error(`Download error for ${url}:`, error);
        });
      });
    }
  }

  startDownloads(): void {
    if (this.ipcRenderer) {
      // Send the URLs and speed settings to Electron
      this.ipcRenderer.send('start-downloads', { urls: this.urls, maxSpeed: this.maxDownloadSpeed });
    }
  }

  pauseDownload(url: string): void {
    if (this.ipcRenderer) {
      this.ipcRenderer.send('pause-download', url);
    }
  }

  resumeDownload(url: string): void {
    if (this.ipcRenderer) {
      this.ipcRenderer.send('resume-download', url);
    }
  }

  stopDownload(url: string): void {
    if (this.ipcRenderer) {
      this.ipcRenderer.send('stop-download', url);
    }
  }

  setMaxDownloadSpeed($event: Event): void {
    this.maxDownloadSpeed = Number(($event.target as HTMLInputElement).value);
    if (this.ipcRenderer) {
      this.ipcRenderer.send('set-max-speed', this.maxDownloadSpeed);
    }
  }

  setMaxConcurrentDownloads($event: Event): void {
    this.maxConcurrentDownloads = Number(($event.target as HTMLInputElement).value);
    if (this.ipcRenderer) {
      this.ipcRenderer.send('set-max-concurrent-downloads', this.maxConcurrentDownloads);
    }
  }

  saveSettings(): void {
    if (this.ipcRenderer) {
      this.ipcRenderer.send('save-settings', {
        desiredFileTypes: this.desiredFileTypes,
        maxConcurrentDownloads: this.maxConcurrentDownloads,
        maxDownloadSpeed: this.maxDownloadSpeed
      });
    }
  }

  loadSettings(): void {
    if (this.ipcRenderer) {
      this.ipcRenderer.send('load-settings');
      this.ipcRenderer.once('settings-loaded', (event: any, settings: any) => {
        this.desiredFileTypes = settings.desiredFileTypes || [];
        this.maxConcurrentDownloads = settings.maxConcurrentDownloads || 2;
        this.maxDownloadSpeed = settings.maxDownloadSpeed || 5;
      });
    }
  }

  addFileType(fileType: string): void {
    if (!this.desiredFileTypes.includes(fileType)) {
      this.desiredFileTypes.push(fileType);
    }
  }

  removeFileType(fileType: string): void {
    this.desiredFileTypes = this.desiredFileTypes.filter(type => type !== fileType);
  }

  addUrls(input: string): void {
    input.split('\n').forEach(url => {
      const trimmedUrl = url.trim();
      if ((trimmedUrl.includes('http') || trimmedUrl.includes('https')) && !this.urls.includes(trimmedUrl)) {
        const fileExtension = this.getFileExtension(trimmedUrl);
        if (this.desiredFileTypes.length === 0 || this.desiredFileTypes.includes(fileExtension)) {
          this.urls.push(trimmedUrl);
          this.downloadProgress[trimmedUrl] = { progress: 0, speed: '0 MB/s', status: 'Pending' };
        }
      }
    });
  }

  private getFileExtension(url: string): string {
    const filename = url.split('/').pop() || '';
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  clearUrls(): void {
    this.urls = [];
    this.downloadProgress = {};
  }
}
