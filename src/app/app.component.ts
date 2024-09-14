import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, from, of, merge } from 'rxjs';
import { map, catchError, mergeMap, finalize } from 'rxjs/operators';
import { contextBridge, ipcRenderer, IpcRenderer } from 'electron';
import { FormControl } from '@angular/forms';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
      send: (channel: any, data: any) => ipcRenderer.send(channel, data),
      on: (channel: any, func: any) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
  }
});

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  urls: string[] = [];
  downloadProgress: { [key: string]: { progress: number, speed: string, status: string } } = {};
  ipcRenderer: IpcRenderer | undefined;
  private lastLoaded: { [url: string]: number } = {};
  private lastTime: { [url: string]: number } = {};
  private speedBuffer: { [url: string]: number[] } = {};
  private bufferSize = 20;
  maxDownloadSpeed: number = 0;
  maxConcurrentDownloads: number = 3;
  desiredFileTypes: string[] = [];
  @ViewChild('urlInput') urlInput!: ElementRef<HTMLTextAreaElement>;

  constructor(private http: HttpClient, private ngZone: NgZone) {
    if (window.require) {
      try {
        this.ipcRenderer = window.require('electron').ipcRenderer;
      } catch (e) {
        throw e;
      }
    }
  }

  ngOnInit() {
    this.setupIpcListeners();
    this.loadSettings();
  }

  setupIpcListeners() {
    if (this.ipcRenderer) {
      this.ipcRenderer.on('download-progress', (event, data) => {
        this.ngZone.run(() => {
          const { url, progress, speed, status } = data;
          this.downloadProgress[url] = {
            progress,
            speed: `${speed.toFixed(2)} MB/s`,
            status
          };
        });
      });

      this.ipcRenderer.on('download-complete', (event, url) => {
        this.ngZone.run(() => {
          this.urls = this.urls.filter(u => u !== url);
          delete this.downloadProgress[url];
        });
      });
    }
  }

  startDownloads(): void {
    const downloadObservables: Observable<any>[] = this.urls.map(url => this.downloadFile(url));
    merge(...downloadObservables).subscribe();
  }

  updateDownloadProgress(url: string, progress: number, speed: string, status: string) {
    this.downloadProgress[url] = {
      progress,
      speed,
      status
    };
  }
  
  downloadFile(url: string): Observable<any> {
    return new Observable((observer) => {
      this.ipcRenderer!.send('download-file', url);
      this.ipcRenderer!.on('download-progress', (event, progress, speed, status) => {
        this.updateDownloadProgress(url, progress, speed, status);
        observer.next();
      });
      this.ipcRenderer!.on('download-complete', (event, filePath) => {
        this.updateDownloadProgress(url, 100, '0.00', 'Completed');
        observer.complete();
      });
      this.ipcRenderer!.on('download-error', (event, error) => {
        this.updateDownloadProgress(url, 0, '0.00', 'Error');
        observer.error(error);
      });
    });
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
    const speed = Number(($event.target as HTMLInputElement).value);
    if (this.ipcRenderer) {
      this.ipcRenderer.send('set-max-speed', speed);
    }
  }

  setMaxConcurrentDownloads($event: Event): void {
    const maxConcurrentDownloads = Number(($event.target as HTMLInputElement).value);
    if (this.ipcRenderer) {
      this.ipcRenderer.send('set-max-concurrent-downloads', maxConcurrentDownloads);
    }
  }

  saveSettings(): void {
    if (this.ipcRenderer) {
      this.ipcRenderer.send('save-settings', {
        desiredFileTypes: this.desiredFileTypes,
        downloadSpeed: this.maxDownloadSpeed,
        concurrentDownloads: this.maxConcurrentDownloads
      });
    }
  }
  
  loadSettings(): void {
    if (this.ipcRenderer) {
      this.ipcRenderer.send('load-settings');
      this.ipcRenderer.once('settings-loaded', (event, settings) => {
        this.desiredFileTypes = settings.desiredFileTypes || [];
        this.maxConcurrentDownloads = settings.maxConcurrentDownloads || 3;
        this.maxDownloadSpeed = settings.downloadSpeed || 0;
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
          this.downloadProgress[trimmedUrl] = { progress: 0, speed: '0 MB/s', status: 'Pending'};
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

  private calculateSpeed(url: string, loaded: number, timestamp: number): string {
    if (!this.lastLoaded[url] || !this.lastTime[url]) {
      this.lastLoaded[url] = loaded;
      this.lastTime[url] = timestamp;
      this.speedBuffer[url] = [];
      return '0 MB/s';
    }
  
    const loadDiff = loaded - this.lastLoaded[url];
    const timeDiff = timestamp - this.lastTime[url];
    const speedBps = loadDiff / (timeDiff / 1000);
    const speedMBps = speedBps / (1024 * 1024);
  
    // Add current speed to buffer
    this.speedBuffer[url].push(speedMBps);
    if (this.speedBuffer[url].length > this.bufferSize) {
      this.speedBuffer[url].shift();
    }
  
    // Calculate average speed
    const avgSpeed = this.speedBuffer[url].reduce((a, b) => a + b, 0) / this.speedBuffer[url].length;
  
    this.lastLoaded[url] = loaded;
    this.lastTime[url] = timestamp;
  
    return `${avgSpeed.toFixed(2)} MB/s`;
  }

  downloadFileOld(url: string): Observable<void> {
    console.log(`Downloading ${url}`);
    const filename = url.split(/[/\\]/).pop() || 'unknown';
  
    return this.http.get(url, {
        reportProgress: true,
        responseType: 'arraybuffer',
        observe: 'events'
    }).pipe(
      map((event: HttpEvent<ArrayBuffer>) => {
        switch (event.type) {
            case HttpEventType.DownloadProgress:
                if (event.total) {
                  const percentDone = Math.round(100 * event.loaded / event.total);
                  const currentTime = Date.now();
                  const speed = this.calculateSpeed(url, event.loaded, currentTime);
                  this.downloadProgress[url] = { 
                    progress: percentDone, 
                    speed: speed, 
                    status: 'Downloading',
                  };
                }
                break;
            case HttpEventType.Response:
                if (event.body) {
                  this.saveFile(event.body, filename);
                  this.downloadProgress[url] = { 
                    progress: 100, 
                    speed: '0 MB/s', 
                    status: 'Completed' 
                  };
                  // Remove the URL from the list
                  this.urls = this.urls.filter(u => u !== url);
                  // Remove the progress entry
                  delete this.downloadProgress[url];
                }
                break;
          }
      }),
      catchError(error => {
        console.error(`Error downloading ${url}:`, error);
        this.downloadProgress[url] = { 
          progress: 0, 
          speed: '0 MB/s', 
          status: 'Failed' 
        };
        return of(void 0);
      }),
      finalize(() => {
        console.log(`Download finished for ${url}`);
      })
    );
  }

  private saveFile(data: ArrayBuffer, fileName: string): void {
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
  }
}
