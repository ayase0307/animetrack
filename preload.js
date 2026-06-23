const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openViewer: (payload) => ipcRenderer.invoke('viewer:open', payload),
  loadAnimeList: () => ipcRenderer.invoke('anime:load'),
  saveAnimeList: (animeList) => ipcRenderer.invoke('anime:save', animeList),
  onEpisodeUpdated: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('episode:updated', listener);
    return () => ipcRenderer.removeListener('episode:updated', listener);
  },
  onViewerClosed: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('viewer:closed', listener);
    return () => ipcRenderer.removeListener('viewer:closed', listener);
  }
});
