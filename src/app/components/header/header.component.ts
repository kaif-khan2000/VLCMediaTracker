import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() selectedFolder: string = '';
  @Input() currentPath: string = '';
  @Input() videoCount: number = 0;
  @Input() folderCount: number = 0;
  @Input() breadcrumbs: string[] = [];
  @Output() folderSelected = new EventEmitter<void>();
  @Output() refreshClicked = new EventEmitter<void>();
  @Output() breadcrumbClicked = new EventEmitter<number>();

  onSelectFolder() {
    this.folderSelected.emit();
  }

  onRefresh() {
    this.refreshClicked.emit();
  }

  onBreadcrumbClick(index: number) {
    this.breadcrumbClicked.emit(index);
  }

  getFolderName(): string {
    if (!this.selectedFolder) return '';
    return this.selectedFolder.split('\\').pop() || this.selectedFolder.split('/').pop() || '';
  }

  getCurrentFolderName(): string {
    if (!this.currentPath) return '';
    return this.currentPath.split('\\').pop() || this.currentPath.split('/').pop() || '';
  }
}
