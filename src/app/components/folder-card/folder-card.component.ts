import { Component, Input, Output, EventEmitter } from '@angular/core';
import { VideoFile } from '../../app.component';
import { ElectronService } from '../../services/electron.service';

@Component({
  selector: 'app-folder-card',
  templateUrl: './folder-card.component.html',
  styleUrls: ['./folder-card.component.scss']
})
export class FolderCardComponent {
  @Input() folder!: VideoFile;
  @Output() folderSelected = new EventEmitter<string>();

  constructor(private electronService: ElectronService) {}

  openFolder() {
    this.folderSelected.emit(this.folder.path);
  }

  async showInFolder() {
    try {
      await this.electronService.showInFolder(this.folder.path);
    } catch (error) {
      console.error('Error showing in folder:', error);
    }
  }

  getFormattedDate(): string {
    return new Date(this.folder.modified).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getThumbnailColor(): string {
    const colors = [
      '#667eea', '#764ba2', '#f093fb', '#f5576c',
      '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
      '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
    ];
    
    // Use folder name length to determine color
    const index = this.folder.name.length % colors.length;
    return colors[index];
  }

  getIcon(): string {
    return this.folder.type === 'drive' ? 'storage' : 'folder';
  }

  getType(): string {
    return this.folder.type === 'drive' ? 'Drive' : 'Folder';
  }
}
