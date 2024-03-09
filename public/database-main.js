const { DataSource, EntitySchema, In } = require('typeorm');
const { ipcMain } = require('electron');
const { ChannelPrefix } = require('./database-shared.js');
const path = require('path');
const fs = require('fs');
const { app, BrowserWindow } = require('electron');
const isDev = require('electron-is-dev');
const sanitize = require('sanitize-filename');

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

class DataSourceStatus {
  constructor() {
    this.dataSource = undefined;
    this.isLoading = false;
    this.isLoaded = false;
  }
}

class DatabaseAccessMain {

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

  getDataSource = async (sourceName) => {
    const sourceStatus = this.dataSources.get(sourceName) ?? new DataSourceStatus();
    if (sourceStatus.isLoaded) {
      return sourceStatus.dataSource;
    }
    this.logDatabaseTime('getDataSource()');
    try {
      while (sourceStatus.isLoading) {
        await new Promise(resolve => setTimeout(resolve, DbWaitInMs));
      }
      if (sourceStatus.isLoaded) {
        return sourceStatus.dataSource;
      }

      sourceStatus.isLoading = true;
      this.dataSources.set(sourceName, sourceStatus);

      const fileName = `${sanitize(app.getName()).slice(0, 40)}-${sanitize(sourceName).slice(0, 200)}.sql`;
      let databaseFile;
      if (isDev) {
        databaseFile = fileName;
      } else {
        const databasePath = app.getPath('userData');
        fs.mkdirSync(databasePath, { recursive: true });
        databaseFile = path.join(databasePath, fileName);
      }

      this.logDatabaseTimeLog('getDataSource()', sourceName, databaseFile);
      const newDataSource = new DataSource({
        type: 'better-sqlite3',
        database: databaseFile,
        synchronize: true,
        entities: [linkSchema, projectSchema, userSchema]
      });
      await newDataSource.initialize();

      sourceStatus.dataSource = newDataSource;
      sourceStatus.isLoaded = true;

      return sourceStatus.dataSource;
    } catch (ex) {
      console.error('getDataSource()', ex);
    } finally {
      sourceStatus.isLoading = false;
      this.logDatabaseTimeEnd('getDataSource()');
    }
  };

  createDataSource = async (sourceName) => {
    this.logDatabaseTime('createDataSource()');
    try {
      const result = !!(await this.getDataSource(sourceName));
      this.logDatabaseTimeLog('createDataSource()', sourceName, result);
      return result;
    } catch (ex) {
      console.error('createDataSource()', ex);
    } finally {
      this.logDatabaseTimeEnd('createDataSource()');
    }
  };

  insert = async (sourceName, table, itemOrItems) => {
    this.logDatabaseTime('insert()');
    try {
      await (await this.getDataSource(sourceName))
        .getRepository(table)
        .insert(itemOrItems);
      this.logDatabaseTimeLog('insert()', sourceName, table, itemOrItems?.length ?? itemOrItems);
    } catch (ex) {
      console.error('insert()', ex);
    } finally {
      this.logDatabaseTimeEnd('insert()');
    }
  };

  deleteAll = async (sourceName, table) => {
    this.logDatabaseTime('deleteAll()');
    try {
      await (await this.getDataSource(sourceName))
        .getRepository(table)
        .clear();
      this.logDatabaseTimeLog('deleteAll()', sourceName, table);
    } catch (ex) {
      console.error('deleteAll()', ex);
    } finally {
      this.logDatabaseTimeEnd('deleteAll()');
    }
  };

  save = async (sourceName, table, itemOrItems) => {
    this.logDatabaseTime('save()');
    try {
      const result =
        await (await this.getDataSource(sourceName))
          .getRepository(table)
          .save(itemOrItems);
      this.logDatabaseTimeLog('save()', sourceName, table, result?.length ?? result);
      return result;
    } catch (ex) {
      console.error('save()', ex);
    } finally {
      this.logDatabaseTimeEnd('save()');
    }
  };

  existsById = async (sourceName, table, itemId) => {
    this.logDatabaseTime('existsById()');
    try {
      const result =
        await (await this.getDataSource(sourceName))
          .getRepository(table)
          .existsBy({ id: itemId });
      this.logDatabaseTimeLog('existsById()', sourceName, table, itemId, result);
      return result;
    } catch (ex) {
      console.error('existsById()', ex);
    } finally {
      this.logDatabaseTimeEnd('existsById()');
    }
  };

  findByIds = async (sourceName, table, itemIds) => {
    this.logDatabaseTime('findByIds()');
    try {
      const result =
        await (await this.getDataSource(sourceName))
          .getRepository(table)
          .findBy({ id: In(itemIds) });
      this.logDatabaseTimeLog('findByIds()', sourceName, table, itemIds, result);
      return result;
    } catch (ex) {
      console.error('findByIds()', ex);
    } finally {
      this.logDatabaseTimeEnd('findByIds()');
    }
  };

  getAll = async (sourceName, table) => {
    this.logDatabaseTime('getAll()');
    try {
      const result =
        (await (await this.getDataSource(sourceName))
          .getRepository(table)
          .createQueryBuilder()
          .getMany())
          .filter(Boolean);
      this.logDatabaseTimeLog('getAll()', sourceName, table, result.length);
      return result;
    } catch (ex) {
      console.error('getAll()', ex);
    } finally {
      this.logDatabaseTimeEnd('getAll()');
    }
  };

  findOneById = async (sourceName, table, itemId) => {
    this.logDatabaseTime('findOneById()');
    try {
      const result =
        await (await this.getDataSource(sourceName))
          .getRepository(table)
          .findOneBy({ id: itemId });
      this.logDatabaseTimeLog('findOneById()', sourceName, table, itemId, result);
      return result;
    } catch (ex) {
      console.error('findOneById()', ex);
    } finally {
      this.logDatabaseTimeEnd('findOneById()');
    }
  };

  deleteByIds = async (sourceName, table, itemIdOrIds) => {
    this.logDatabaseTime('deleteByIds()');
    try {
      await (await this.getDataSource(sourceName))
        .getRepository(table)
        .delete(itemIdOrIds);
      this.logDatabaseTimeLog('deleteByIds()', sourceName, table, itemIdOrIds?.length ?? itemIdOrIds);
    } catch (ex) {
      console.error('deleteByIds()', ex);
    } finally {
      this.logDatabaseTimeEnd('deleteByIds()');
    }
  };

  findBetweenIds = async (sourceName, table, fromId, toId) => {
    this.logDatabaseTime('findBetweenIds()');
    try {
      const result =
        await (await this.getDataSource(sourceName))
          .getRepository(table)
          .createQueryBuilder('item')
          .where('item.id >= :fromId and item.id <= :toId',
            { fromId, toId })
          .getMany();
      this.logDatabaseTimeLog('findBetweenIds()', sourceName, table, fromId, toId, result?.length ?? result);
      return result;
    } catch (ex) {
      console.error('findBetweenIds()', ex);
    } finally {
      this.logDatabaseTimeEnd('findBetweenIds()');
    }
  };

  corporaGetPivotWords = async (sourceName, side, filter, sort) => {
    const em = (await this.getDataSource(sourceName)).manager;
    return await em.query(`select
                        normalized_text t,
                        language_id l,
                        count(1) c
      from words_or_parts w
        ${filter === 'aligned' ? `inner join links__${side === 'sources' ? 'source' : 'target'}_words j
                                    on w.id = j.word_id` : ''}
      where w.side = '${side}'
      group by t
        ${this._buildOrderBy(sort, { frequency: 'c', normalizedText: 't' })};`);
  };

  languageFindByIds = async (sourceName, languageIds) => {
    const em = (await this.getDataSource(sourceName)).manager;
    return await em.query(`SELECT code, text_direction textDirection, font_family fontFamily from language WHERE code in (${languageIds.map(id => `'${id}'`).join(',')});`);
  }


  languageGetAll = async (sourceName) => {
    const em = (await this.getDataSource(sourceName)).manager;
    return await em.query(`SELECT code, text_direction textDirection, font_family fontFamily from language;`);
  }

  corporaGetAlignedWordsByPivotWord = async (sourceName, side, normalizedText, sort) => {
    const em = (await this.getDataSource(sourceName)).manager;
    console.log('corporaGetAlignedWordsByPivotWord()');
    switch (side) {
      case 'sources':
        const sourceQueryTextWLang = `
            SELECT sw.normalized_text t, sw.language_id sl, l.sources_text st, tw.language_id tl, l.targets_text tt, count(1) c
            FROM words_or_parts sw
                     INNER JOIN links__source_words lsw
                                ON sw.id = lsw.word_id
                     INNER JOIN links l
                                ON l.id = lsw.link_id
                     INNER JOIN links__target_words ltw
                                ON l.id = ltw.link_id
                     INNER JOIN words_or_parts tw
                                ON tw.id = ltw.word_id
            WHERE sw.normalized_text = '${normalizedText}'
              AND sw.side = 'sources'
              AND l.targets_text <> ''
            GROUP BY l.targets_text
                ${this._buildOrderBy(sort, { frequency: 'c', sourceWordTexts: 'sources_text', targetWordTexts: 'targets_text' })};`;
        console.log('sources', sourceQueryTextWLang);
        return await em.query(sourceQueryTextWLang);
      case 'targets':
        const targetQueryText = `
            SELECT tw.normalized_text t, sw.language_id sl, l.sources_text st, tw.language_id tl, l.targets_text tt, count(1) c
            FROM words_or_parts tw
                     INNER JOIN links__target_words ltw
                                ON tw.id = ltw.word_id
                     INNER JOIN links l
                                ON l.id = ltw.link_id
                     INNER JOIN links__source_words lsw
                                ON l.id = lsw.link_id
                     INNER JOIN words_or_parts sw
                                ON sw.id = lsw.word_id
            WHERE tw.normalized_text = '${normalizedText}'
              AND tw.side = 'targets'
              AND l.sources_text <> ''
            GROUP BY l.sources_text
              ${this._buildOrderBy(sort, { frequency: 'c', sourceWordTexts: 'st', targetWordTexts: 'tt' })};`;
        console.log('targets', targetQueryText);
        return await em.query(targetQueryText);
    }
  }

  _buildOrderBy = (sort, fieldMap) => {
    if (!sort || !sort.field || !sort.sort) return '';
    return `order by ${fieldMap && fieldMap[sort.field] ? fieldMap[sort.field] : sort.field} ${sort.sort}`;
  }
}

const DatabaseAccessMainInstance = new DatabaseAccessMain();

module.exports = {
  setUpIpcMain() {
    try {
      ipcMain.handle(`${ChannelPrefix}:createDataSource`,
        async (event, ...args) => {
          return await DatabaseAccessMainInstance.createDataSource(...args);
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
      ipcMain.handle(`${ChannelPrefix}:corporaGetPivotWords`,
        async (event, ...args) => {
          return await DatabaseAccessMainInstance.corporaGetPivotWords(...args);
        });
      ipcMain.handle(`${ChannelPrefix}:languageFindByIds`,
        async (event, ...args) => {
          return await DatabaseAccessMainInstance.languageFindByIds(...args);
        });
      ipcMain.handle(`${ChannelPrefix}:corporaGetAlignedWordsByPivotWord`,
        async (event, ...args) => {
          return await DatabaseAccessMainInstance.corporaGetAlignedWordsByPivotWord(...args);
        });
      ipcMain.handle(`${ChannelPrefix}:languageGetAll`,
        async (event, ...args) => {
          return await DatabaseAccessMainInstance.languageGetAll(...args);
        });
    } catch (ex) {
      console.error('ipcMain.handle()', ex);
    }
  }
};
