import { Injectable } from '@angular/core';

declare global {
  interface Window {
    require: any;
    process: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  ipcRenderer: any;
  isElectron: boolean;

  constructor() {
    this.isElectron = this.isElectronApp();
    if (this.isElectron) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
    }
  }

  private isElectronApp(): boolean {
    return !!(window && window.process && window.process.versions && window.process.versions.electron);
  }

  async getDrives(): Promise<any[]> {
    if (!this.isElectron) return [];
    return await this.ipcRenderer.invoke('get-drives');
  }

  async selectFolder(): Promise<string | null> {
    if (!this.isElectron) return null;
    return await this.ipcRenderer.invoke('select-folder');
  }

  async getVideoFiles(folderPath: string): Promise<any[]> {
    if (!this.isElectron) return [];
    return await this.ipcRenderer.invoke('get-video-files', folderPath);
  }

  async openWithVLC(filePath: string): Promise<any> {
    if (!this.isElectron) return { success: false };
    return await this.ipcRenderer.invoke('open-with-vlc', filePath);
  }

  async showInFolder(filePath: string): Promise<void> {
    if (!this.isElectron) return;
    await this.ipcRenderer.invoke('show-in-folder', filePath);
  }

  async getFileInfo(filePath: string): Promise<any> {
    if (!this.isElectron) return null;
    return await this.ipcRenderer.invoke('get-file-info', filePath);
  }

  async generateVideoThumbnail(videoPath: string): Promise<string | null> {
    if (!this.isElectron) return null;
    return await this.ipcRenderer.invoke('generate-video-thumbnail', videoPath);
  }

  // VLC Monitoring Methods
  async getVlcStatus(): Promise<any> {
    if (!this.isElectron) return { success: false };
    return await this.ipcRenderer.invoke('get-vlc-status');
  }

  async startVlcMonitoring(filePath: string): Promise<any> {
    if (!this.isElectron) return { success: false };
    console.log('ElectronService: Starting VLC monitoring for:', filePath);
    const result = await this.ipcRenderer.invoke('monitor-vlc-playback', filePath);
    console.log('ElectronService: VLC monitoring result:', result);
    return result;
  }

  async stopVlcMonitoring(): Promise<any> {
    if (!this.isElectron) return { success: false };
    return await this.ipcRenderer.invoke('stop-vlc-monitoring');
  }

  // Listen for VLC progress updates
  onVlcProgressUpdate(callback: (data: any) => void): void {
    if (!this.isElectron) return;
    console.log('ElectronService: Setting up VLC progress update listener');
    
    // Remove any existing listeners first
    this.ipcRenderer.removeAllListeners('vlc-progress-update');
    
    this.ipcRenderer.on('vlc-progress-update', (_event: any, data: any) => {
      console.log('ElectronService: Received VLC progress update:', data);
      callback(data);
    });
  }

  // Listen for video completion events
  onVideoCompleted(callback: (data: any) => void): void {
    if (!this.isElectron) return;
    console.log('ElectronService: Setting up video completion listener');
    
    // Remove any existing listeners first
    this.ipcRenderer.removeAllListeners('video-completed');
    
    this.ipcRenderer.on('video-completed', (_event: any, data: any) => {
      console.log('ElectronService: Received video completion:', data);
      callback(data);
    });
  }

  // Remove listeners
  removeVlcListeners(): void {
    if (!this.isElectron) return;
    this.ipcRenderer.removeAllListeners('vlc-progress-update');
    this.ipcRenderer.removeAllListeners('video-completed');
  }
}
