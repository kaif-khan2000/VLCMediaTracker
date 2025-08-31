import { Injectable } from '@angular/core';

declare global {
  interface Window {
    require: any;
  }
}

export interface AppState {
  id: number;
  lastFolder: string;
  lastPath: string;
  windowWidth: number;
  windowHeight: number;
  lastUpdated: string;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private db: any;
  private isElectron: boolean;

  constructor() {
    this.isElectron = this.isElectronApp();
    if (this.isElectron) {
      this.initDatabase();
    }
  }

  private isElectronApp(): boolean {
    return !!(window && window.process && window.process.versions && window.process.versions.electron);
  }

  private async initDatabase(): Promise<void> {
    if (!this.isElectron) return;

    try {
      const Database = window.require('better-sqlite3');
      const path = window.require('path');
      const os = window.require('os');
      
      // Create database in user data directory
      const dbPath = path.join(os.homedir(), '.mediatracker', 'app.db');
      
      // Ensure directory exists
      const fs = window.require('fs');
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = new Database(dbPath);
      console.log('Connected to SQLite database');
      this.createTables();
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  private createTables(): void {
    if (!this.db) return;

    const createStateTable = `
      CREATE TABLE IF NOT EXISTS app_state (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        last_folder TEXT,
        last_path TEXT,
        window_width INTEGER DEFAULT 1200,
        window_height INTEGER DEFAULT 800,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createWatchedVideosTable = `
      CREATE TABLE IF NOT EXISTS watched_videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT UNIQUE,
        file_name TEXT,
        file_size INTEGER,
        watched_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        watch_count INTEGER DEFAULT 1,
        last_position REAL DEFAULT 0,
        total_duration INTEGER DEFAULT 0,
        watched_percentage REAL DEFAULT 0
      )
    `;

    try {
      this.db.exec(createStateTable);
      console.log('App state table ready');
      this.ensureDefaultState();
    } catch (err) {
      console.error('Error creating app_state table:', err);
    }

    try {
      this.db.exec(createWatchedVideosTable);
      console.log('Watched videos table ready');
      this.migrateWatchedVideosTable();
    } catch (err) {
      console.error('Error creating watched_videos table:', err);
    }
  }

  private migrateWatchedVideosTable(): void {
    if (!this.db) return;

    const alterQueries = [
      'ALTER TABLE watched_videos ADD COLUMN last_position REAL DEFAULT 0',
      'ALTER TABLE watched_videos ADD COLUMN total_duration INTEGER DEFAULT 0',
      'ALTER TABLE watched_videos ADD COLUMN watched_percentage REAL DEFAULT 0'
    ];

    alterQueries.forEach(query => {
      try {
        this.db.exec(query);
        console.log('Added new column to watched_videos table');
      } catch (err: any) {
        if (!err.message.includes('duplicate column')) {
          console.log('Column migration note:', err.message);
        }
      }
    });
  }

  private ensureDefaultState(): void {
    if (!this.db) return;

    try {
      const row = this.db.prepare('SELECT * FROM app_state LIMIT 1').get();
      if (!row) {
        const stmt = this.db.prepare('INSERT INTO app_state (last_folder, last_path) VALUES (?, ?)');
        stmt.run('', '');
        console.log('Default state inserted');
      }
    } catch (err) {
      console.error('Error ensuring default state:', err);
    }
  }

  async saveState(folder: string, path: string): Promise<void> {
    if (!this.db) return;

    try {
      const stmt = this.db.prepare('UPDATE app_state SET last_folder = ?, last_path = ?, last_updated = CURRENT_TIMESTAMP WHERE id = 1');
      stmt.run(folder, path);
      console.log('State saved:', { folder, path });
    } catch (err) {
      console.error('Error saving state:', err);
      throw err;
    }
  }

  async getState(): Promise<AppState | null> {
    if (!this.db) return null;

    try {
      const row = this.db.prepare('SELECT * FROM app_state ORDER BY id DESC LIMIT 1').get();
      if (row) {
        const state: AppState = {
          id: row.id,
          lastFolder: row.last_folder || '',
          lastPath: row.last_path || '',
          windowWidth: row.window_width || 1200,
          windowHeight: row.window_height || 800,
          lastUpdated: row.last_updated
        };
        return state;
      }
      return null;
    } catch (err) {
      console.error('Error getting state:', err);
      throw err;
    }
  }

  async saveWindowSize(width: number, height: number): Promise<void> {
    if (!this.db) return;

    try {
      const stmt = this.db.prepare('UPDATE app_state SET window_width = ?, window_height = ?, last_updated = CURRENT_TIMESTAMP WHERE id = 1');
      stmt.run(width, height);
    } catch (err) {
      console.error('Error saving window size:', err);
      throw err;
    }
  }

  async markVideoAsWatched(filePath: string, fileName: string, fileSize: number): Promise<void> {
    if (!this.db) return;

    try {
      const checkStmt = this.db.prepare('SELECT * FROM watched_videos WHERE file_path = ?');
      const row = checkStmt.get(filePath);
      
      if (row) {
        // Video exists, increment watch count
        const updateStmt = this.db.prepare('UPDATE watched_videos SET watch_count = watch_count + 1, watched_date = CURRENT_TIMESTAMP WHERE file_path = ?');
        updateStmt.run(filePath);
        console.log('Watch count updated for:', fileName);
      } else {
        // New video, insert it
        const insertStmt = this.db.prepare('INSERT INTO watched_videos (file_path, file_name, file_size) VALUES (?, ?, ?)');
        insertStmt.run(filePath, fileName, fileSize);
        console.log('Video marked as watched:', fileName);
      }
    } catch (err) {
      console.error('Error marking video as watched:', err);
      throw err;
    }
  }

  async getWatchedVideos(): Promise<string[]> {
    if (!this.db) return [];

    try {
      const rows: any[] = this.db.prepare('SELECT file_path FROM watched_videos').all();
      return rows.map((row: any) => row.file_path);
    } catch (err) {
      console.error('Error getting watched videos:', err);
      throw err;
    }
  }

  async getWatchedVideosWithProgress(): Promise<any[]> {
    if (!this.db) return [];

    try {
      const rows: any[] = this.db.prepare('SELECT file_path, last_position, total_duration, watched_percentage, watched_date FROM watched_videos').all();
      return rows;
    } catch (err) {
      console.error('Error getting watched videos with progress:', err);
      throw err;
    }
  }

  async isVideoWatched(filePath: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      const row = this.db.prepare('SELECT id FROM watched_videos WHERE file_path = ?').get(filePath);
      return !!row;
    } catch (err) {
      console.error('Error checking if video is watched:', err);
      throw err;
    }
  }

  async removeFromWatched(filePath: string): Promise<void> {
    if (!this.db) return;

    try {
      const stmt = this.db.prepare('DELETE FROM watched_videos WHERE file_path = ?');
      stmt.run(filePath);
      console.log('Video removed from watched list');
    } catch (err) {
      console.error('Error removing from watched:', err);
      throw err;
    }
  }

  async updateVideoProgress(filePath: string, position: number, duration: number, percentage: number): Promise<void> {
    if (!this.db) return;

    try {
      const stmt = this.db.prepare(`UPDATE watched_videos 
                                    SET last_position = ?, total_duration = ?, watched_percentage = ?
                                    WHERE file_path = ?`);
      stmt.run(position, duration, percentage, filePath);
    } catch (err) {
      console.error('Error updating video progress:', err);
      throw err;
    }
  }

  async getVideoProgress(filePath: string): Promise<any> {
    if (!this.db) return null;

    try {
      const row = this.db.prepare('SELECT last_position, total_duration, watched_percentage FROM watched_videos WHERE file_path = ?').get(filePath);
      return row ? {
        position: row.last_position,
        duration: row.total_duration,
        percentage: row.watched_percentage
      } : null;
    } catch (err) {
      console.error('Error getting video progress:', err);
      throw err;
    }
  }

  async markVideoAsWatchedWithProgress(filePath: string, fileName: string, fileSize: number, position: number, duration: number, percentage: number): Promise<void> {
    if (!this.db) return;

    try {
      const checkStmt = this.db.prepare('SELECT id, watch_count FROM watched_videos WHERE file_path = ?');
      const row = checkStmt.get(filePath);

      if (row) {
        // Update existing video with new progress
        const updateStmt = this.db.prepare(`UPDATE watched_videos 
                                            SET watch_count = ?, last_position = ?, total_duration = ?, 
                                                watched_percentage = ?, watched_date = CURRENT_TIMESTAMP
                                            WHERE file_path = ?`);
        updateStmt.run(row.watch_count + 1, position, duration, percentage, filePath);
        console.log('Video progress updated:', fileName);
      } else {
        // New video, insert with progress
        const insertStmt = this.db.prepare(`INSERT INTO watched_videos 
                                            (file_path, file_name, file_size, last_position, total_duration, watched_percentage) 
                                            VALUES (?, ?, ?, ?, ?, ?)`);
        insertStmt.run(filePath, fileName, fileSize, position, duration, percentage);
        console.log('Video marked as watched with progress:', fileName);
      }
    } catch (err) {
      console.error('Error marking video as watched with progress:', err);
      throw err;
    }
  }

  close(): void {
    if (this.db) {
      try {
        this.db.close();
        console.log('Database connection closed');
      } catch (err) {
        console.error('Error closing database:', err);
      }
    }
  }
}
