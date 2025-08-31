import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { ElectronService } from './services/electron.service';
import { DatabaseService } from './services/database.service';

export interface VideoFile {
  name: string;
  path: string;
  size: number;
  modified: Date;
  extension: string;
  type: 'video' | 'folder' | 'drive';
  isFolder: boolean;
  isWatched?: boolean;
  watchedDate?: Date;
  watchedPercentage?: number;
  lastPosition?: number;
  totalDuration?: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'MediaTracker';
  videoFiles: VideoFile[] = [];
  selectedFolder: string = '';
  currentPath: string = '';
  isLoading = false;
  breadcrumbs: string[] = [];

  constructor(
    private electronService: ElectronService,
    private databaseService: DatabaseService,
    private ngZone: NgZone
  ) {}

  async ngOnInit() {
    console.log('AppComponent initialized');
    // Check if running in Electron
    if (this.electronService.isElectron) {
      console.log('Running in Electron');
      
      // Set up VLC monitoring listeners
      this.electronService.onVlcProgressUpdate((data) => {
        this.onVlcProgressUpdate(data);
      });

      this.electronService.onVideoCompleted((data) => {
        this.onVideoCompleted(data);
      });

      await this.loadSavedState();
    } else {
      console.log('Not running in Electron');
    }
  }

  ngOnDestroy() {
    // Close database connection when component is destroyed
    this.databaseService.close();
    
    // Remove VLC listeners
    if (this.electronService.isElectron) {
      this.electronService.removeVlcListeners();
      this.electronService.stopVlcMonitoring();
    }
  }

  async loadSavedState() {
    try {
      const savedState = await this.databaseService.getState();
      
      if (savedState && savedState.lastPath) {
        console.log('Restoring saved state:', savedState);
        this.currentPath = savedState.lastPath;
        this.selectedFolder = savedState.lastFolder;
        this.updateBreadcrumbs();
        await this.loadVideoFiles();
      } else {
        console.log('No saved state found, loading drives');
        await this.loadDrives();
      }
    } catch (error) {
      console.error('Error loading saved state:', error);
      // Fallback to drives view
      await this.loadDrives();
    }
  }

  async loadDrives() {
    this.isLoading = true;
    try {
      const drives = await this.electronService.getDrives();
      this.videoFiles = drives;
      this.currentPath = '';
      this.selectedFolder = '';
      this.breadcrumbs = ['Drives'];
    } catch (error) {
      console.error('Error loading drives:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async selectFolder() {
    this.isLoading = true;
    try {
      const folderPath = await this.electronService.selectFolder();
      if (folderPath) {
        this.selectedFolder = folderPath;
        this.currentPath = folderPath;
        this.updateBreadcrumbs();
        await this.loadVideoFiles();
        
        // Save state to database
        try {
          await this.databaseService.saveState(this.selectedFolder, this.currentPath);
        } catch (error) {
          console.error('Error saving state:', error);
        }
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadVideoFiles() {
    if (!this.currentPath) return;
    
    this.isLoading = true;
    try {
      this.videoFiles = await this.electronService.getVideoFiles(this.currentPath);
      // Load watched status for videos
      await this.loadWatchedStatus();
    } catch (error) {
      console.error('Error loading video files:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadWatchedStatus() {
    try {
      const watchedVideos = await this.databaseService.getWatchedVideosWithProgress();
      console.log('Loaded watched videos with progress:', watchedVideos);
      
      // Create a map for quick lookup
      const watchedMap = new Map();
      watchedVideos.forEach(video => {
        const watchedPercentage = video.watched_percentage || 0;
        watchedMap.set(video.file_path, {
          isWatched: watchedPercentage >= 80, // Only mark as watched if 80% or more complete
          watchedPercentage: watchedPercentage,
          lastPosition: video.last_position || 0,
          totalDuration: video.total_duration || 0,
          watchedDate: new Date(video.watched_date)
        });
      });
      
      console.log('Watched map created:', watchedMap);
      
      // Update videoFiles with watched status and progress
      this.videoFiles = this.videoFiles.map(file => {
        if (!file.isFolder && watchedMap.has(file.path)) {
          const watchedData = watchedMap.get(file.path);
          file.isWatched = watchedData.isWatched;
          file.watchedPercentage = watchedData.watchedPercentage;
          file.lastPosition = watchedData.lastPosition;
          file.totalDuration = watchedData.totalDuration;
          file.watchedDate = watchedData.watchedDate;
          console.log('Updated file with progress:', file.name, file.watchedPercentage);
        }
        return file;
      });
    } catch (error) {
      console.error('Error loading watched status:', error);
    }
  }

  async refreshFiles() {
    await this.loadVideoFiles();
  }

  async navigateToFolder(folderPath: string) {
    this.currentPath = folderPath;
    this.selectedFolder = folderPath;
    this.updateBreadcrumbs();
    await this.loadVideoFiles();
    
    // Save state to database
    try {
      await this.databaseService.saveState(this.selectedFolder, this.currentPath);
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  private updateBreadcrumbs() {
    if (!this.currentPath) {
      this.breadcrumbs = ['Drives'];
      return;
    }
    
    const parts = this.currentPath.split('\\').filter(part => part.length > 0);
    this.breadcrumbs = ['Drives', ...parts];
  }

  async navigateToBreadcrumb(index: number) {
    if (index === 0) {
      // Navigate back to drives
      await this.loadDrives();
      // Clear saved state when going back to drives
      try {
        await this.databaseService.saveState('', '');
      } catch (error) {
        console.error('Error clearing state:', error);
      }
    } else {
      // Navigate to specific breadcrumb
      const parts = this.breadcrumbs.slice(1, index + 1); // Skip 'Drives'
      this.currentPath = parts.join('\\');
      
      // Fix drive paths - ensure they end with backslash
      if (parts.length === 1 && parts[0].endsWith(':')) {
        this.currentPath = parts[0] + '\\';
      }
      
      this.selectedFolder = this.currentPath;
      this.updateBreadcrumbs();
      await this.loadVideoFiles();
      
      // Save state to database
      try {
        await this.databaseService.saveState(this.selectedFolder, this.currentPath);
      } catch (error) {
        console.error('Error saving state:', error);
      }
    }
  }

  async onVideoPlayed(videoFile: VideoFile) {
    try {
      await this.databaseService.markVideoAsWatched(videoFile.path, videoFile.name, videoFile.size);
      
      // Start VLC monitoring for this video
      await this.electronService.startVlcMonitoring(videoFile.path);
      
      // Don't immediately mark as watched - let the progress monitoring handle this
      // The video will be marked as watched based on actual progress (80%+)
      const index = this.videoFiles.findIndex(file => file.path === videoFile.path);
      if (index !== -1) {
        this.videoFiles[index].watchedDate = new Date();
        // Remove immediate isWatched = true - this should be based on progress
      }
    } catch (error) {
      console.error('Error marking video as watched:', error);
    }
  }

  onVlcProgressUpdate(data: any): void {
    console.log('VLC Progress Update:', data);
    
    // Run inside Angular zone to ensure change detection
    this.ngZone.run(() => {
      // Update video progress in database
      if (data.position && data.length) {
        this.databaseService.updateVideoProgress(
          data.filePath, 
          data.time, 
          data.length, 
          data.watchedPercentage
        ).catch(error => {
          console.error('Error updating video progress:', error);
        });
      }

      // Update UI with progress
      const index = this.videoFiles.findIndex(file => file.path === data.filePath);
      if (index !== -1) {
        this.videoFiles[index].watchedPercentage = data.watchedPercentage;
        this.videoFiles[index].lastPosition = data.time;
        this.videoFiles[index].totalDuration = data.length;
        
        // Update isWatched status based on progress (80% threshold)
        this.videoFiles[index].isWatched = data.watchedPercentage >= 80;
        
        console.log('Updated UI for video:', this.videoFiles[index].name, 
                   'Progress:', data.watchedPercentage, 
                   'IsWatched:', this.videoFiles[index].isWatched);
      }
    });
  }

  onVideoCompleted(data: any): void {
    console.log('Video Completed:', data);
    
    // Run inside Angular zone to ensure change detection
    this.ngZone.run(() => {
      // Mark video as fully watched
      const videoFile = this.videoFiles.find(file => file.path === data.filePath);
      if (videoFile) {
        this.databaseService.markVideoAsWatchedWithProgress(
          videoFile.path,
          videoFile.name,
          videoFile.size,
          videoFile.totalDuration || 0,
          videoFile.totalDuration || 0,
          100
        ).catch(error => {
          console.error('Error marking video as completed:', error);
        });

        // Update UI
        const index = this.videoFiles.findIndex(file => file.path === data.filePath);
        if (index !== -1) {
          this.videoFiles[index].isWatched = true;
          this.videoFiles[index].watchedPercentage = 100;
          this.videoFiles[index].watchedDate = new Date();
        }
      }
    });
  }

  get videoCount(): number {
    return this.videoFiles.filter(file => !file.isFolder).length;
  }

  get folderCount(): number {
    return this.videoFiles.filter(file => file.isFolder).length;
  }
}