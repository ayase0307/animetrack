const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openViewer: (payload) => ipcRenderer.invoke('viewer:open', payload),
  openViewerExternal: (url) => ipcRenderer.invoke('viewer:open-external', url),
  updateViewerUrl: (url) => ipcRenderer.invoke('viewer:update-url', url),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('window:toggle-maximize'),
  toggleFullscreenWindow: () => ipcRenderer.invoke('window:toggle-fullscreen'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isWindowMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  loadAnimeList: () => ipcRenderer.invoke('anime:load'),
  saveAnimeList: (animeList) => ipcRenderer.invoke('anime:save', animeList),
  onWindowMaximizedChanged: (callback) => {
    const listener = (_event, isMaximized) => callback(isMaximized);
    ipcRenderer.on('window:maximized-changed', listener);
    return () => ipcRenderer.removeListener('window:maximized-changed', listener);
  },
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
