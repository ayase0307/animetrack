const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

let mainWindow;

const dataDir = path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'anime.json');

function setupAutoUpdate() {
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = false;

  autoUpdater.on('update-available', async (info) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '發現新版本',
      message: `追劇小幫手 ${info.version} 已可更新。`,
      detail: '要現在下載更新檔嗎？下載完成後會再詢問是否重新啟動安裝。',
      buttons: ['稍後再說', '下載更新'],
      defaultId: 1,
      cancelId: 0,
      noLink: true
    });

    if (result.response === 1) {
      autoUpdater.downloadUpdate().catch((error) => {
        dialog.showErrorBox('更新下載失敗', error.message);
      });
    }
  });

  autoUpdater.on('update-not-available', () => {
    console.log('No updates available.');
  });

  autoUpdater.on('update-downloaded', async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    const result = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      title: '更新已下載',
      message: '新版追劇小幫手已下載完成。',
      detail: '要現在重新啟動並安裝更新嗎？',
      buttons: ['稍後', '重新啟動安裝'],
      defaultId: 1,
      cancelId: 0,
      noLink: true
    });

    if (result.response === 1) {
      autoUpdater.quitAndInstall(false, true);
    }
  });

  autoUpdater.on('error', (error) => {
    console.error('Auto update failed:', error);
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      console.error('Update check failed:', error);
    });
  }, 3000);
}

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
    icon: path.join(__dirname, 'enso-play-icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  ensureDataFile();
  createMainWindow();
  setupAutoUpdate();

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
    currentEp: Number(payload && payload.currentEp) || 0,
    cover: payload && payload.cover ? String(payload.cover) : ''
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
    sourceWindow.focus();
    // 改由前台顯示水墨自製彈窗（取代原生系統對話框）
    sourceWindow.webContents.send('viewer:closed', {
      id: anime.id,
      title: anime.title,
      currentEp: anime.currentEp,
      cover: anime.cover
    });
  });

  return { opened: true };
});
