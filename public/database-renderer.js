// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require('electron');
const { ChannelPrefix } = require('./database-shared.js');

contextBridge.exposeInMainWorld('databaseApi', {
  createDataSource: (database) => ipcRenderer.invoke(`${ChannelPrefix}:createDataSource`, database),
  insert: (database, table, itemOrItems) => ipcRenderer.invoke(`${ChannelPrefix}:insert`, database, table, itemOrItems),
  deleteAll: (database, table) => ipcRenderer.invoke(`${ChannelPrefix}:deleteAll`, database, table),
  save: (database, table, itemOrItems) => ipcRenderer.invoke(`${ChannelPrefix}:save`, database, table, itemOrItems),
  existsById: (database, table, itemId) => ipcRenderer.invoke(`${ChannelPrefix}:existsById`, database, table, itemId),
  findByIds: (database, table, itemIds) => ipcRenderer.invoke(`${ChannelPrefix}:findByIds`, database, table, itemIds),
  getAll: (database, table) => ipcRenderer.invoke(`${ChannelPrefix}:getAll`, database, table),
  findOneById: (database, table, itemId) => ipcRenderer.invoke(`${ChannelPrefix}:findOneById`, database, table, itemId),
  deleteByIds: (database, table, itemIdOrIds) => ipcRenderer.invoke(`${ChannelPrefix}:deleteByIds`, database, table, itemIdOrIds),
  findBetweenIds: (database, table, fromId, toId) => ipcRenderer.invoke(`${ChannelPrefix}:findBetweenIds`, database, table, fromId, toId),
  corporaGetPivotWords: (sourceName, side, filter, sort) => ipcRenderer.invoke(`${ChannelPrefix}:corporaGetPivotWords`, sourceName, side, filter, sort),
  languageFindByIds: (sourceName, languageIds) => ipcRenderer.invoke(`${ChannelPrefix}:languageFindByIds`, sourceName, languageIds),
  languageGetAll: (sourceName) => ipcRenderer.invoke(`${ChannelPrefix}:languageGetAll`, sourceName),
  corporaGetAlignedWordsByPivotWord: (sourceName, side, normalizedText, sort) => ipcRenderer.invoke(`${ChannelPrefix}:corporaGetAlignedWordsByPivotWord`, sourceName, side, normalizedText, sort),
  corporaGetLinksByAlignedWord: (sourceName, sourcesText, targetsText, sort) => ipcRenderer.invoke(`${ChannelPrefix}:corporaGetLinksByAlignedWord`, sourceName, sourcesText, targetsText, sort),
  updateLinkText: (database, linkIdOrIds) => ipcRenderer.invoke(`${ChannelPrefix}:updateLinkText`, database, linkIdOrIds),
  updateAllLinkText: (database) => ipcRenderer.invoke(`${ChannelPrefix}:updateAllLinkText`, database),
  findLinksByWordId: (database, side, wordId) => ipcRenderer.invoke(`${ChannelPrefix}:findLinksByWordId`, database, side, wordId),
  findLinksByBCV: (database, side, bookNum, chapterNum, verseNum) => ipcRenderer.invoke(`${ChannelPrefix}:findLinksByBCV`, database, side, bookNum, chapterNum, verseNum)
});
