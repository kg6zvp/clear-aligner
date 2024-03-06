const { DataSource, EntitySchema, In } = require('typeorm');
const { ipcMain } = require('electron');
const { ChannelPrefix } = require('./database-shared.js');
const path = require('path');
const fs = require('fs');
const { app, BrowserWindow } = require('electron');
const isDev = require('electron-is-dev');

class Link {
  constructor() {
    this.id = undefined;
    this.sources = [];
    this.targets = [];
  }
}

class Project {
  constructor() {
    this.id = undefined;
    this.bookStats = [];
  }
}

class User {
  constructor() {
    this.id = undefined;
  }
}

const linkSchema = new EntitySchema({
  name: 'link',
  tableName: 'link',
  target: Link,
  columns: {
    id: {
      primary: true,
      type: 'varchar',
      generated: false
    },
    sources: {
      type: 'simple-array'
    },
    targets: {
      type: 'simple-array'
    }
  }
});

const projectSchema = new EntitySchema({
  name: 'project',
  tableName: 'project',
  target: Project,
  columns: {
    id: {
      primary: true,
      type: 'varchar',
      generated: false
    },
    bookStats: {
      type: 'simple-json'
    }
  }
});

const userSchema = new EntitySchema({
  name: 'user',
  tableName: 'user',
  target: User,
  columns: {
    id: {
      primary: true,
      type: 'varchar',
      generated: false
    },
    bookStats: {
      type: 'simple-json'
    }
  }
});

const DbWaitInMs = 1000;

class DatabaseAccessMain {

  constructor() {
    this.isLoggingTime = true;
    this.dataSource = undefined;
    this.isDataSourceLoading = false;
    this.isDataSourceLoaded = false;
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

  waitForDataSource = async () => {
    while (this.isDataSourceLoading) {
      await new Promise(resolve => setTimeout(resolve, DbWaitInMs));
    }
  };

  checkDataSource = async () => {
    this.logDatabaseTime('createDataSource()');
    if (this.isDataSourceLoading) {
      await this.waitForDataSource();
    }
    if (this.isDataSourceLoaded) {
      return;
    }
    this.isDataSourceLoading = true;
    try {
      let databaseFile;
      if (isDev) {
        databaseFile = `${app.getName()}.sql`;
      } else {
        const databasePath = app.getPath('userData');
        fs.mkdirSync(databasePath, { recursive: true });
        databaseFile = path.join(databasePath, `${app.getName()}.sql`);
      }
      this.logDatabaseTimeLog('createDataSource()', databaseFile);
      const newDataSource = new DataSource({
        type: 'better-sqlite3',
        database: databaseFile,
        synchronize: true,
        entities: [linkSchema, projectSchema, userSchema]
      });
      await newDataSource.initialize();

      this.dataSource = newDataSource;
      this.isDataSourceLoaded = true;
    } catch (ex) {
      console.error('createDataSource()', ex);
    } finally {
      this.isDataSourceLoading = false;
      this.logDatabaseTimeEnd('createDataSource()');
    }
  };

  insert = async (table, itemOrItems) => {
    this.logDatabaseTime('insert()');
    try {
      if (!this.isDataSourceLoaded) {
        await this.checkDataSource();
      }
      await this.dataSource.getRepository(table).insert(itemOrItems);
      this.logDatabaseTimeLog('insert()', table, itemOrItems?.length ?? itemOrItems);
    } catch (ex) {
      console.error('insert()', ex);
    } finally {
      this.logDatabaseTimeEnd('insert()');
    }
  };

  deleteAll = async (table) => {
    this.logDatabaseTime('deleteAll()');
    try {
      if (!this.isDataSourceLoaded) {
        await this.checkDataSource();
      }
      await this.dataSource.getRepository(table).clear();
      this.logDatabaseTimeLog('deleteAll()', table);
    } catch (ex) {
      console.error('deleteAll()', ex);
    } finally {
      this.logDatabaseTimeEnd('deleteAll()');
    }
  };

  save = async (table, itemOrItems) => {
    this.logDatabaseTime('save()');
    try {
      if (!this.isDataSourceLoaded) {
        await this.checkDataSource();
      }
      const result = await this.dataSource.getRepository(table).save(itemOrItems);
      this.logDatabaseTimeLog('save()', table, result?.length ?? result);
      return result;
    } catch (ex) {
      console.error('save()', ex);
    } finally {
      this.logDatabaseTimeEnd('save()');
    }
  };

  existsById = async (table, itemId) => {
    this.logDatabaseTime('existsById()');
    try {
      if (!this.isDataSourceLoaded) {
        await this.checkDataSource();
      }
      const result = await this.dataSource.getRepository(table).existsBy({ id: itemId });
      this.logDatabaseTimeLog('existsById()', table, itemId, result);
      return result;
    } catch (ex) {
      console.error('existsById()', ex);
    } finally {
      this.logDatabaseTimeEnd('existsById()');
    }
  };

  findByIds = async (table, itemIds) => {
    this.logDatabaseTime('findByIds()');
    try {
      if (!this.isDataSourceLoaded) {
        await this.checkDataSource();
      }
      const result = await this.dataSource.getRepository(table).findBy({ id: In(itemIds) });
      this.logDatabaseTimeLog('findByIds()', table, itemIds, result);
      return result;
    } catch (ex) {
      console.error('findByIds()', ex);
    } finally {
      this.logDatabaseTimeEnd('findByIds()');
    }
  };

  getAll = async (table) => {
    this.logDatabaseTime('getAll()');
    try {
      if (!this.isDataSourceLoaded) {
        await this.checkDataSource();
      }
      const result = (await this.dataSource.getRepository(table)
        .createQueryBuilder()
        .getMany())
        .filter(Boolean);
      this.logDatabaseTimeLog('getAll()', table, result.length);
      return result;
    } catch (ex) {
      console.error('getAll()', ex);
    } finally {
      this.logDatabaseTimeEnd('getAll()');
    }
  };

  findOneById = async (table, itemId) => {
    this.logDatabaseTime('findOneById()');
    try {
      if (!this.isDataSourceLoaded) {
        await this.checkDataSource();
      }
      const result = await this.dataSource.getRepository(table).findOneBy({ id: itemId });
      this.logDatabaseTimeLog('findOneById()', table, itemId, result);
      return result;
    } catch (ex) {
      console.error('findOneById()', ex);
    } finally {
      this.logDatabaseTimeEnd('findOneById()');
    }
  };

  deleteByIds = async (table, itemIdOrIds) => {
    this.logDatabaseTime('deleteByIds()');
    try {
      if (!this.isDataSourceLoaded) {
        await this.checkDataSource();
      }
      await this.dataSource.getRepository(table).delete(itemIdOrIds);
      this.logDatabaseTimeLog('deleteByIds()', table, itemIdOrIds?.length ?? itemIdOrIds);
    } catch (ex) {
      console.error('deleteByIds()', ex);
    } finally {
      this.logDatabaseTimeEnd('deleteByIds()');
    }
  };

  findBetweenIds = async (table, fromId, toId) => {
    this.logDatabaseTime('findBetweenIds()');
    try {
      if (!this.isDataSourceLoaded) {
        await this.checkDataSource();
      }
      const result = await this.dataSource.getRepository(table)
        .createQueryBuilder('item')
        .where('item.id >= :fromId and item.id <= :toId',
          { fromId, toId })
        .getMany();
      this.logDatabaseTimeLog('findBetweenIds()', table, fromId, toId, result?.length ?? result);
      return result;
    } catch (ex) {
      console.error('findBetweenIds()', ex);
    } finally {
      this.logDatabaseTimeEnd('findBetweenIds()');
    }
  };
}

const DatabaseAccessMainInstance = new DatabaseAccessMain();

module.exports = {
  setUpIpcMain() {
    try {
      ipcMain.handle(`${ChannelPrefix}:createDataSource`, async (event, ...args) => {
        return await DatabaseAccessMainInstance.checkDataSource(...args);
      });
      ipcMain.handle(`${ChannelPrefix}:insert`,
        async (event, ...args) => {
          return await DatabaseAccessMainInstance.insert(...args);
        });
      ipcMain.handle(`${ChannelPrefix}:deleteAll`,
        async (event, ...args) => {
          return await DatabaseAccessMainInstance.deleteAll(...args);
        });
      ipcMain.handle(`${ChannelPrefix}:save`,
        async (event, ...args) => {
          return await DatabaseAccessMainInstance.save(...args);
        });
      ipcMain.handle(`${ChannelPrefix}:existsById`,
        async (event, ...args) => {
          return await DatabaseAccessMainInstance.existsById(...args);
        });
      ipcMain.handle(`${ChannelPrefix}:findByIds`,
        async (event, ...args) => {
          return await DatabaseAccessMainInstance.findByIds(...args);
        });
      ipcMain.handle(`${ChannelPrefix}:getAll`,
        async (event, ...args) => {
          return await DatabaseAccessMainInstance.getAll(...args);
        });
      ipcMain.handle(`${ChannelPrefix}:findOneById`,
        async (event, ...args) => {
          return await DatabaseAccessMainInstance.findOneById(...args);
        });
      ipcMain.handle(`${ChannelPrefix}:deleteByIds`,
        async (event, ...args) => {
          return await DatabaseAccessMainInstance.deleteByIds(...args);
        });
      ipcMain.handle(`${ChannelPrefix}:findBetweenIds`,
        async (event, ...args) => {
          return await DatabaseAccessMainInstance.findBetweenIds(...args);
        });
    } catch (ex) {
      console.error('ipcMain.handle()', ex);
    }
  }
};
