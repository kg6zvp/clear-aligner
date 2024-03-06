// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require('electron');
const { ChannelPrefix } = require('./database-shared.js');

contextBridge.exposeInMainWorld('databaseApi', {
  createDataSource: () => ipcRenderer.invoke(`${ChannelPrefix}:createDataSource`),
  insert: (table, itemOrItems) => ipcRenderer.invoke(`${ChannelPrefix}:insert`, table, itemOrItems),
  deleteAll: (table) => ipcRenderer.invoke(`${ChannelPrefix}:deleteAll`, table),
  save: (table, itemOrItems) => ipcRenderer.invoke(`${ChannelPrefix}:save`, table, itemOrItems),
  existsById: (table, itemId) => ipcRenderer.invoke(`${ChannelPrefix}:existsById`, table, itemId),
  findByIds: (table, itemIds) => ipcRenderer.invoke(`${ChannelPrefix}:findByIds`, table, itemIds),
  getAll: (table) => ipcRenderer.invoke(`${ChannelPrefix}:getAll`, table),
  findOneById: (table, itemId) => ipcRenderer.invoke(`${ChannelPrefix}:findOneById`, table, itemId),
  deleteByIds: (table, itemIdOrIds) => ipcRenderer.invoke(`${ChannelPrefix}:deleteByIds`, table, itemIdOrIds),
  findBetweenIds: (table, fromId, toId) => ipcRenderer.invoke(`${ChannelPrefix}:findBetweenIds`, table, fromId, toId)
});
