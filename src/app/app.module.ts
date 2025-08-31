import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { VideoListComponent } from './components/video-list/video-list.component';
import { VideoCardComponent } from './components/video-card/video-card.component';
import { FolderCardComponent } from './components/folder-card/folder-card.component';
import { HeaderComponent } from './components/header/header.component';
import { ElectronService } from './services/electron.service';

@NgModule({
  declarations: [
    AppComponent,
    VideoListComponent,
    VideoCardComponent,
    FolderCardComponent,
    HeaderComponent
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [ElectronService],
  bootstrap: [AppComponent]
})
export class AppModule { }
