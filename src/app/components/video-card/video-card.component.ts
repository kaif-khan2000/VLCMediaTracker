import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { VideoFile } from '../../app.component';
import { ElectronService } from '../../services/electron.service';

@Component({
  selector: 'app-video-card',
  templateUrl: './video-card.component.html',
  styleUrls: ['./video-card.component.scss']
})
export class VideoCardComponent implements OnInit {
  @Input() videoFile!: VideoFile;
  @Output() videoPlayed = new EventEmitter<VideoFile>();

  constructor(private electronService: ElectronService) {}

  // Make Math available in template
  Math = Math;

  ngOnInit() {
    // Debug log for progress data
    if (this.videoFile.watchedPercentage && this.videoFile.watchedPercentage > 0) {
      console.log('Video card progress data:', {
        name: this.videoFile.name,
        watchedPercentage: this.videoFile.watchedPercentage,
        isWatched: this.videoFile.isWatched,
        lastPosition: this.videoFile.lastPosition,
        totalDuration: this.videoFile.totalDuration
      });
    }
  }

  async openVideo() {
    await this.playWithVLC();
  }

  async playWithVLC() {
    try {
      const result = await this.electronService.openWithVLC(this.videoFile.path);
      if (result.success) {
        // Emit event when video is successfully played
        this.videoPlayed.emit(this.videoFile);
      } else {
        console.error('Failed to open with VLC:', result.error);
        // Could show a toast notification here
      }
    } catch (error) {
      console.error('Error opening video:', error);
    }
  }

  async showInFolder() {
    try {
      await this.electronService.showInFolder(this.videoFile.path);
    } catch (error) {
      console.error('Error showing in folder:', error);
    }
  }

  getFileSize(): string {
    const bytes = this.videoFile.size;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  getFormattedDate(): string {
    return new Date(this.videoFile.modified).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getFileIcon(): string {
    const ext = this.videoFile.extension.toLowerCase();
    switch (ext) {
      case '.mp4':
      case '.m4v':
        return 'movie';
      case '.avi':
      case '.mkv':
      case '.mov':
      case '.wmv':
        return 'videocam';
      case '.webm':
      case '.flv':
        return 'play_circle';
      default:
        return 'video_file';
    }
  }

  getThumbnailColor(): string {
    const colors = [
      '#667eea', '#764ba2', '#f093fb', '#f5576c',
      '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
      '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
    ];
    
    // Use file name length to determine color
    const index = this.videoFile.name.length % colors.length;
    return colors[index];
  }
}
