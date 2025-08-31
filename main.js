const { app, BrowserWindow, dialog, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Disable GPU hardware acceleration to prevent crashes on Windows
app.disableHardwareAcceleration();

let mainWindow;
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
      experimentalFeatures: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false // Don't show until ready
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:4200');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    // Open dev tools to debug the issue
    mainWindow.webContents.openDevTools();
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle('get-drives', async () => {
  try {
    const drives = [];
    
    // Check drives A-Z on Windows
    for (let i = 65; i <= 90; i++) {
      const driveLetter = String.fromCharCode(i);
      const drivePath = `${driveLetter}:\\`;
      
      try {
        // Check if drive exists by trying to access it
        const stats = fs.statSync(drivePath);
        if (stats.isDirectory()) {
          drives.push({
            name: `${driveLetter}: Drive`,
            path: drivePath,
            size: 0,
            modified: new Date(),
            extension: '',
            type: 'drive',
            isFolder: true,
            letter: driveLetter
          });
        }
      } catch (error) {
        // Drive doesn't exist or is not accessible, skip it
      }
    }
    
    return drives;
  } catch (error) {
    console.error('Error getting drives:', error);
    return [];
  }
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Video Folder'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('get-video-files', async (event, folderPath) => {
  const videoExtensions = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
  
  try {
    const files = fs.readdirSync(folderPath);
    const items = [];
    
    // Process each item in the directory
    files.forEach(file => {
      const fullPath = path.join(folderPath, file);
      
      try {
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          // Add folder
          items.push({
            name: file,
            path: fullPath,
            size: 0,
            modified: stats.mtime,
            extension: '',
            type: 'folder',
            isFolder: true
          });
        } else {
          // Add video file if it matches supported extensions
          const ext = path.extname(file).toLowerCase();
          if (videoExtensions.includes(ext)) {
            items.push({
              name: file,
              path: fullPath,
              size: stats.size,
              modified: stats.mtime,
              extension: ext,
              type: 'video',
              isFolder: false
            });
          }
        }
      } catch (fileError) {
        // Skip files/folders we can't access (like System Volume Information)
        console.log(`Skipping inaccessible item: ${file}`);
      }
    });
    
    // Sort: folders first, then videos, both alphabetically
    items.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });
    
    return items;
  } catch (error) {
    console.error('Error reading folder:', error);
    return [];
  }
});

ipcMain.handle('open-with-vlc', async (event, filePath) => {
  try {
    // Try common VLC installation paths
    const vlcPaths = [
      'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe',
      'C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe',
      'vlc' // If VLC is in PATH
    ];
    
    let vlcPath = null;
    
    // Check which VLC path exists
    for (const path of vlcPaths) {
      if (path === 'vlc' || fs.existsSync(path)) {
        vlcPath = path;
        break;
      }
    }
    
    if (vlcPath) {
      // Launch VLC with HTTP interface enabled for monitoring (as extra interface)
      const vlcArgs = [
        filePath,
        '--extraintf', 'http',
        '--http-password', 'mediatracker',
        '--http-port', '8080'
      ];
      
      console.log('Launching VLC with args:', vlcArgs);
      
      const vlcProcess = spawn(vlcPath, vlcArgs, { detached: true });
      
      vlcProcess.on('error', (error) => {
        console.error('VLC process error:', error);
      });
      
      vlcProcess.on('exit', (code, signal) => {
        console.log('VLC process exited with code:', code, 'signal:', signal);
      });
      
      // Store the process info for monitoring
      global.currentVlcProcess = {
        process: vlcProcess,
        filePath: filePath,
        startTime: new Date()
      };
      
      console.log('VLC launched successfully for file:', filePath);
      return { success: true };
    } else {
      // If VLC not found, try to open with default app
      shell.openPath(filePath);
      return { success: true, message: 'Opened with default application (VLC not found)' };
    }
  } catch (error) {
    console.error('Error opening file with VLC:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-in-folder', async (event, filePath) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle('get-file-info', async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
});

// VLC Monitoring Functions
async function getVlcStatus() {
  try {
    const http = require('http');
    const auth = Buffer.from(':mediatracker').toString('base64');
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 8080,
        path: '/requests/status.json',
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`
        },
        timeout: 1000
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const status = JSON.parse(data);
            resolve({
              success: true,
              position: status.position || 0, // Position as percentage (0-1)
              time: status.time || 0, // Current time in seconds
              length: status.length || 0, // Total length in seconds
              state: status.state || 'stopped', // playing, paused, stopped
              filename: status.information?.category?.meta?.filename || ''
            });
          } catch (parseError) {
            resolve({ success: false, error: 'Failed to parse VLC response' });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: 'VLC not responding' });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'VLC connection timeout' });
      });

      req.end();
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
}

ipcMain.handle('get-vlc-status', async (event) => {
  return await getVlcStatus();
});

ipcMain.handle('monitor-vlc-playback', async (event, filePath) => {
  // Start monitoring VLC playback for a specific file
  if (global.vlcMonitorInterval) {
    clearInterval(global.vlcMonitorInterval);
  }

  global.vlcMonitorInterval = setInterval(async () => {
    try {
      const status = await getVlcStatus(); // Use the extracted function directly
      
      console.log('VLC Status Check:', {
        success: status.success,
        state: status.state,
        position: status.position,
        time: status.time,
        length: status.length
      });
      
      if (status.success && (status.state === 'playing' || status.state === 'paused') && status.position > 0) {
        console.log('Sending VLC progress update:', {
          filePath: filePath,
          position: status.position,
          time: status.time,
          length: status.length,
          watchedPercentage: Math.round(status.position * 100)
        });
        
        // Send progress update to renderer
        mainWindow.webContents.send('vlc-progress-update', {
          filePath: filePath,
          position: status.position,
          time: status.time,
          length: status.length,
          watchedPercentage: Math.round(status.position * 100)
        });

        // Mark as watched if > 80% completed
        if (status.position > 0.8) {
          console.log('Video completed (>80%):', filePath);
          mainWindow.webContents.send('video-completed', { filePath: filePath });
        }
      } else if (!status.success || status.state === 'stopped') {
        // Stop monitoring when VLC closes
        clearInterval(global.vlcMonitorInterval);
        global.vlcMonitorInterval = null;
      }
    } catch (error) {
      console.error('VLC monitoring error:', error);
      // Continue monitoring even if there's an error
    }
  }, 2000); // Check every 2 seconds

  return { success: true };
});

ipcMain.handle('stop-vlc-monitoring', async (event) => {
  if (global.vlcMonitorInterval) {
    clearInterval(global.vlcMonitorInterval);
    global.vlcMonitorInterval = null;
  }
  return { success: true };
});

ipcMain.handle('generate-video-thumbnail', async (event, videoPath) => {
  try {
    // Simply return the video path - we'll handle thumbnail generation in the renderer
    return videoPath;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
});
