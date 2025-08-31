# MediaTracker

A powerful desktop application for managing and tracking your video library with VLC integration.

![MediaTracker](https://img.shields.io/badge/Platform-Windows-blue)
![Version](https://img.shields.io/badge/Version-1.0.0-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

### � Video Management
- **Browse Drives**: Automatically detect and browse all available drives
- **Video Detection**: Automatically identify video files in directories
- **File Information**: View file details including size and format
- **Breadcrumb Navigation**: Easy navigation through folder hierarchies

### 📊 Progress Tracking
- **Watch Progress**: Track viewing progress for each video
- **VLC Integration**: Real-time progress monitoring through VLC HTTP interface
- **Auto-Complete**: Automatically mark videos as watched at 80% completion
- **Resume Playback**: Continue watching from where you left off

### 🎨 User Interface
- **Dark Theme**: Modern dark interface for comfortable viewing
- **Responsive Grid**: Uniform video cards with enhanced icons
- **Drive Icons**: Visual drive representation with appropriate icons
- **Progress Indicators**: Visual progress bars showing watch status

### 💾 Data Persistence
- **SQLite Database**: Local database for storing preferences and watch history
- **State Management**: Remember last visited folder and window settings
- **Watch History**: Complete history of watched videos with timestamps
- **Automatic Migration**: Database schema updates handled automatically

## Installation

### Option 1: Portable Application (Recommended)
1. Download `MediaTracker-1.0.0-win-x64.zip`
2. Extract to your preferred location (e.g., `C:\Program Files\MediaTracker`)
3. Run `MediaTracker.exe`
4. Optionally create a desktop shortcut

### Option 2: Manual Setup
1. Ensure you have [VLC Media Player](https://www.videolan.org/vlc/) installed
2. Extract the application files
3. Run `MediaTracker.exe`

## System Requirements

- **Operating System**: Windows 10 or later (64-bit)
- **Memory**: 4GB RAM minimum
- **Storage**: 200MB free disk space
- **Dependencies**: VLC Media Player (for video playback)

## Supported Video Formats

- MP4 (.mp4, .m4v)
- AVI (.avi)
- MKV (.mkv)
- MOV (.mov)
- WMV (.wmv)
- FLV (.flv)
- WebM (.webm)
- MPG (.mpg, .mpeg)

## Usage

### Getting Started
1. **Launch MediaTracker**: Double-click `MediaTracker.exe`
2. **Browse Content**: Click on any drive to explore video files
3. **Play Videos**: Click the play button to open videos in VLC
4. **Track Progress**: Progress is automatically tracked while watching

### Navigation
- **Drive Selection**: Click on drive icons (C:, D:, etc.) to browse
- **Folder Navigation**: Use breadcrumb navigation at the top
- **Back Navigation**: Click on parent folders in breadcrumbs

### Video Management
- **Play Video**: Click the play icon to launch in VLC
- **View Progress**: Progress bars show completion percentage
- **Watch Status**: Green checkmarks indicate completed videos

## Technical Details

### Built With
- **Frontend**: Angular 17 with TypeScript
- **Desktop Framework**: Electron 27
- **Database**: Better-SQLite3
- **Styling**: SCSS with dark theme
- **Icons**: Material Design Icons

### Architecture
```
MediaTracker/
├── src/                    # Angular application source
│   ├── app/               # Application components
│   │   ├── components/    # UI components
│   │   │   ├── header/    # App header component
│   │   │   ├── video-list/# Video list component
│   │   │   ├── video-card/# Video card component
│   │   │   └── folder-card/# Folder card component
│   │   └── services/      # Business logic services
│   │       ├── electron.service.ts  # IPC communication
│   │       └── database.service.ts  # SQLite operations
│   └── assets/           # Static assets
├── main.js               # Electron main process
├── package.json          # Dependencies and scripts
└── release/              # Built application
```

### Database Schema
The application uses SQLite with two main tables:
- **app_state**: Stores application preferences and last folder
- **watched_videos**: Tracks video viewing progress and history

## Development

### Prerequisites
- Node.js 18 or later
- npm package manager
- Git

### Setup Development Environment
```bash
# Clone the repository
git clone <repository-url>
cd MediaTracker

# Install dependencies
npm install

# Run in development mode
npm start
```

### Available Scripts
```bash
npm start          # Start development server
npm run build      # Build Angular app
npm run electron   # Run Electron app
npm run dist       # Build distribution package
```

### Building from Source
```bash
# Install dependencies
npm install

# Build Angular application
npm run build

# Create distribution package
npm run dist
```

## Configuration

### VLC Integration
MediaTracker automatically configures VLC with the HTTP interface:
- **Port**: 8080
- **Password**: vlcremote
- **Interface**: HTTP interface enabled alongside normal GUI

### Database Location
Application data is stored in:
```
%USERPROFILE%\.mediatracker\app.db
```

## Troubleshooting

### Common Issues

**VLC Integration Not Working**
- Ensure VLC Media Player is installed
- Check that VLC is not already running with HTTP interface
- Restart MediaTracker if VLC was installed after launching

**Videos Not Playing**
- Verify VLC Media Player is properly installed
- Check file permissions for video files
- Ensure video files are in supported formats

**Progress Not Tracking**
- Confirm VLC HTTP interface is active (check port 8080)
- Ensure videos are played through MediaTracker
- Check that database file has write permissions

**Application Won't Start**
- Verify Windows version compatibility (Windows 10+)
- Check available disk space (minimum 200MB)
- Run as administrator if permission issues occur

### Support
For technical support or bug reports, please check the application logs in the terminal output.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Third-Party Software
- **VLC Media Player**: Licensed under GPL v2+. MediaTracker interfaces with VLC through HTTP API without linking or embedding VLC code. Users must install VLC separately.

## Acknowledgments

- **VLC Media Player** - For excellent video playback capabilities
- **Electron** - For cross-platform desktop application framework
- **Angular** - For robust frontend framework
- **Better-SQLite3** - For reliable database functionality

## Version History

### v1.0.0 (August 2025)
- Initial release
- Complete video library management
- VLC integration with progress tracking
- Dark theme interface
- SQLite database with migration support
- Portable Windows application

---

**MediaTracker** - Organize, track, and enjoy your video collection with ease!
