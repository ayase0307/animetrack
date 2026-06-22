const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

const dataDir = path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'anime.json');

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({ animeList: [] }, null, 2), 'utf8');
  }
}

function readAnimeList() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    return Array.isArray(parsed.animeList) ? parsed.animeList : [];
  } catch (error) {
    dialog.showErrorBox('資料讀取失敗', `無法讀取 data/anime.json：${error.message}`);
    return [];
  }
}

function writeAnimeList(animeList) {
  ensureDataFile();
  const safeList = Array.isArray(animeList) ? animeList : [];
  fs.writeFileSync(dataFile, JSON.stringify({ animeList: safeList }, null, 2), 'utf8');
  return safeList;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: '#10110e',
    title: '追劇小幫手',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'anime-tracker-guoman-draft.html'));
}

app.whenReady().then(() => {
  ensureDataFile();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('anime:load', () => readAnimeList());

ipcMain.handle('anime:save', (_event, animeList) => writeAnimeList(animeList));

ipcMain.handle('viewer:open', async (event, payload) => {
  const sourceWindow = BrowserWindow.fromWebContents(event.sender);
  const anime = {
    id: payload && payload.id,
    title: payload && payload.title ? String(payload.title) : '未命名作品',
    url: payload && payload.url ? String(payload.url) : '',
    currentEp: Number(payload && payload.currentEp) || 0
  };

  if (!anime.url || !/^https?:\/\//i.test(anime.url)) {
    dialog.showMessageBoxSync(sourceWindow, {
      type: 'warning',
      title: '觀看連結無效',
      message: '請先設定有效的 http 或 https 觀看連結。'
    });
    return { opened: false };
  }

  const viewer = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 900,
    minHeight: 640,
    title: anime.title,
    parent: sourceWindow,
    backgroundColor: '#10110e',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  viewer.loadURL(anime.url);

  viewer.on('closed', () => {
    if (!sourceWindow || sourceWindow.isDestroyed()) return;

    const nextEp = anime.currentEp + 1;
    const choice = dialog.showMessageBoxSync(sourceWindow, {
      type: 'question',
      title: '更新觀看進度',
      message: `《${anime.title}》`,
      detail: `你看完第 ${anime.currentEp} 集了嗎？`,
      buttons: ['否，還沒看完', `是，更新到第 ${nextEp} 集`],
      defaultId: 1,
      cancelId: 0,
      noLink: true
    });

    if (choice === 1) {
      sourceWindow.webContents.send('episode:updated', {
        id: anime.id,
        episode: nextEp
      });
    }
  });

  return { opened: true };
});
