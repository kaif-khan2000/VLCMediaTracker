import { Component, Input, Output, EventEmitter } from '@angular/core';
import { VideoFile } from '../../app.component';

@Component({
  selector: 'app-video-list',
  templateUrl: './video-list.component.html',
  styleUrls: ['./video-list.component.scss']
})
export class VideoListComponent {
  @Input() videoFiles: VideoFile[] = [];
  @Output() folderSelected = new EventEmitter<string>();
  @Output() videoPlayed = new EventEmitter<VideoFile>();

  searchTerm: string = '';
  sortBy: string = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  get filteredAndSortedVideos(): VideoFile[] {
    let filtered = this.videoFiles;

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(video => 
        video.name.toLowerCase().includes(term)
      );
    }

    // Sort videos
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'modified':
          comparison = new Date(a.modified).getTime() - new Date(b.modified).getTime();
          break;
        case 'extension':
          comparison = a.extension.localeCompare(b.extension);
          break;
      }

      return this.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }

  getFolders(): VideoFile[] {
    return this.filteredAndSortedVideos.filter(item => item.isFolder);
  }

  getVideos(): VideoFile[] {
    return this.filteredAndSortedVideos.filter(item => !item.isFolder);
  }

  onSortChange(sortBy: string) {
    if (this.sortBy === sortBy) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortOrder = 'asc';
    }
  }

  getSortIcon(column: string): string {
    if (this.sortBy !== column) return 'unfold_more';
    return this.sortOrder === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
  }

  trackByPath(index: number, video: VideoFile): string {
    return video.path;
  }

  onFolderClick(folderPath: string) {
    this.folderSelected.emit(folderPath);
  }

  onVideoPlayed(video: VideoFile) {
    this.videoPlayed.emit(video);
  }
}
