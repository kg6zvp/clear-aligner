const { DataSource } = require('typeorm');
const isDev = require('electron-is-dev');
const path = require('path');
const { app } = require('electron');
const sanitize = require('sanitize-filename');
const fs = require('fs');


class DataSourceStatus {
  constructor() {
    this.isLoading = false;
    this.isLoaded = false;
    this.dataSource = undefined;
  }
}


class BaseRepository {
  static DB_WAIT_IN_MS = 1000;

  constructor() {
    this.isLoggingTime = true;
    this.dataSources = new Map();
  }

  logDatabaseTime = (label) => {
    if (this.isLoggingTime) {
      console.time(label);
    }
  };

  logDatabaseTimeLog = (label, ...args) => {
    if (this.isLoggingTime) {
      console.timeLog(label, ...args);
    }
  };

  logDatabaseTimeEnd = (label) => {
    if (this.isLoggingTime) {
      console.timeEnd(label);
    }
  };

  getDataDirectory = () => {
    return isDev
      ? path.join(path.basename(path.resolve(__dirname, '..')), '../sql')
      : path.join(app.getPath('appData'), sanitize(app.getName()).slice(0, 40));
  };


  getDataSourceWithEntities = async (sourceName, entities, generationFile = "", dir = "") => {
    const sourceStatus = this.dataSources.get(sourceName) ?? new DataSourceStatus();
    if (sourceStatus.isLoaded) {
      return sourceStatus.dataSource;
    }
    this.logDatabaseTime('getDataSourceWithEntities()');
    try {
      while (sourceStatus.isLoading) {
        await new Promise(resolve => setTimeout(resolve, BaseRepository.DB_WAIT_IN_MS));
      }
      if (sourceStatus.isLoaded) {
        return sourceStatus.dataSource;
      }

      sourceStatus.isLoading = true;
      this.dataSources.set(sourceName, sourceStatus);

      const fileName = `${sanitize(app.getName()).slice(0, 40)}-${sanitize(sourceName).slice(0, 200)}.sqlite`;
      const databasePath = path.join(this.getDataDirectory(), dir);
      fs.mkdirSync(databasePath, { recursive: true });
      const databaseFile = path.join(databasePath, fileName);

      if (!fs.existsSync(databaseFile) && generationFile) {
        fs.copyFileSync(generationFile, databaseFile);
      }

      this.logDatabaseTimeLog('getDataSourceWithEntities()', sourceName, databaseFile);
      const newDataSource = new DataSource({
        type: 'better-sqlite3',
        database: databaseFile,
        synchronize: false,
        statementCacheSize: 1000,
        prepareDatabase: (db) => {
          db.pragma('journal_mode = WAL');
          db.pragma('synchronous = normal');
          db.pragma('cache_size = -8000000');
        },
        entities
      });
      await newDataSource.initialize();

      sourceStatus.dataSource = newDataSource;
      sourceStatus.isLoaded = true;

      return sourceStatus.dataSource;
    } catch (ex) {
      console.error('getDataSourceWithEntities()', ex);
    } finally {
      sourceStatus.isLoading = false;
      this.logDatabaseTimeEnd('getDataSourceWithEntities()');
    }
  };
}

module.exports = {
  BaseRepository
}