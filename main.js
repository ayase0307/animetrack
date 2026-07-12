const { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu, globalShortcut } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

let mainWindow;
let tray = null;
let isQuitting = false;

// 單一實例鎖：關窗縮到系統匣後再點捷徑，喚回原視窗而不是開第二個實例
// （第二個實例的 localStorage 會被鎖住，導致 Supabase 設定每次都讀不到）
if (!app.requestSingleInstanceLock()) {
  app.exit(0);
}
app.on('second-instance', () => showMainWindow());

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.show();
  mainWindow.focus();
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'enso-play-icon.png'));
  tray.setToolTip('追劇小幫手');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '開啟追劇小幫手', click: showMainWindow },
    { type: 'separator' },
    { label: '結束', click: () => { isQuitting = true; app.quit(); } }
  ]));
  tray.on('click', showMainWindow);
}

// 打包後 __dirname 位於唯讀的 app.asar，寫檔會失敗、更新也會洗掉資料，
// 因此正式版資料一律放 userData；開發模式維持專案內 data/ 方便直接檢視
const dataDir = app.isPackaged
  ? path.join(app.getPath('userData'), 'data')
  : path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'anime.json');

function wireWindowStateEvents(win) {
  const sendMaximizedState = () => {
    if (!win || win.isDestroyed()) return;
    win.webContents.send('window:maximized-changed', win.isMaximized());
  };
  win.on('maximize', sendMaximizedState);
  win.on('unmaximize', sendMaximizedState);
}

// 更新流程改由前端水墨卡片呈現（取代原生系統對話框），
// main 只負責轉發 electron-updater 事件與接收下載/安裝指令
function setupAutoUpdate() {
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = false;

  const send = (type, payload = {}) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.webContents.send('update:event', { type, ...payload });
  };

  autoUpdater.on('update-available', (info) => send('available', { version: info.version }));
  autoUpdater.on('download-progress', (p) => send('progress', { percent: Math.round(p.percent || 0) }));
  autoUpdater.on('update-downloaded', () => send('downloaded'));
  autoUpdater.on('error', (error) => {
    console.error('Auto update failed:', error);
    send('error', { message: error.message });
  });

  ipcMain.handle('update:download', () => {
    autoUpdater.downloadUpdate().catch((error) => send('error', { message: error.message }));
  });
  // quitAndInstall 會觸發 before-quit，isQuitting 因此設 true，不會被 close-to-tray 攔下
  ipcMain.handle('update:install', () => autoUpdater.quitAndInstall(false, true));

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
  // 先寫暫存檔再改名，避免寫到一半當機毀掉整份資料
  const tmpFile = `${dataFile}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify({ animeList: safeList }, null, 2), 'utf8');
  fs.renameSync(tmpFile, dataFile);
  return safeList;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 720,
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    backgroundColor: '#10110e',
    title: '追劇小幫手',
    icon: path.join(__dirname, 'enso-play-icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  wireWindowStateEvents(mainWindow);

  // 按 X 縮到系統匣常駐，不直接結束；要退出走系統匣選單的「結束」
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

// 影音站廣告彈窗一律擋掉（含 webview 內的 window.open），
// 並禁止導向 http/https 以外的協定；要開外部連結走 viewer:open-external
app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  contents.on('will-navigate', (event, url) => {
    if (!/^https?:\/\//i.test(url)) event.preventDefault();
  });
});

app.whenReady().then(() => {
  app.setAppUserModelId('com.ayase0307.animetrack'); // Windows 桌面通知需要
  ensureDataFile();
  createMainWindow();
  createTray();
  setupAutoUpdate();

  // 全域快捷鍵：Ctrl+Alt+= 幫最近播放的作品 +1（被其他程式占用時靜默略過）
  try {
    globalShortcut.register('Control+Alt+=', () => {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('global:inc');
    });
  } catch (e) {}

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    else showMainWindow();
  });
});

app.on('before-quit', () => { isQuitting = true; });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => { globalShortcut.unregisterAll(); });

// ── 自動備份：寫入 userData/backups，保留最近 14 份 ──
const BACKUP_DIR = path.join(app.getPath('userData'), 'backups');
ipcMain.handle('backup:write', (_event, json) => {
  try {
    if (typeof json !== 'string' || json.length > 50 * 1024 * 1024) return { ok: false, error: 'invalid payload' };
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const d = new Date();
    const file = `anime-backup-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
    fs.writeFileSync(path.join(BACKUP_DIR, file), json, 'utf8');
    const olds = fs.readdirSync(BACKUP_DIR).filter(f => /^anime-backup-.*\.json$/.test(f)).sort();
    while (olds.length > 14) fs.unlinkSync(path.join(BACKUP_DIR, olds.shift()));
    return { ok: true, file };
  } catch (err) { return { ok: false, error: err.message }; }
});
ipcMain.handle('backup:open-dir', () => {
  try { fs.mkdirSync(BACKUP_DIR, { recursive: true }); shell.openPath(BACKUP_DIR); } catch (e) {}
});

ipcMain.handle('anime:load', () => readAnimeList());

ipcMain.handle('anime:save', (_event, animeList) => writeAnimeList(animeList));

ipcMain.handle('window:minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) win.minimize();
});

ipcMain.handle('window:toggle-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || win.isDestroyed()) return false;
  if (win.isMaximized()) win.unmaximize();
  else win.maximize();
  return win.isMaximized();
});

ipcMain.handle('window:close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) win.close();
});

ipcMain.handle('window:is-maximized', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return !!(win && !win.isDestroyed() && win.isMaximized());
});

ipcMain.handle('window:toggle-fullscreen', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || win.isDestroyed()) return false;
  const next = !win.isFullScreen();
  win.setFullScreen(next);
  return next;
});

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
    frame: false,
    titleBarStyle: 'hidden',
    title: anime.title,
    parent: sourceWindow,
    autoHideMenuBar: true,
    backgroundColor: '#10110e',
    icon: path.join(__dirname, 'enso-play-icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    }
  });

  viewer.setMenuBarVisibility(false);
  viewer.__lastViewerUrl = anime.url;
  wireWindowStateEvents(viewer);
  viewer.loadFile(path.join(__dirname, 'viewer.html'), {
    query: {
      title: anime.title,
      url: anime.url,
      currentEp: String(anime.currentEp),
      cover: anime.cover
    }
  });

  viewer.on('closed', () => {
    if (!sourceWindow || sourceWindow.isDestroyed()) return;
    sourceWindow.focus();
    // 改由前台顯示水墨自製彈窗（取代原生系統對話框）
    sourceWindow.webContents.send('viewer:closed', {
      id: anime.id,
      title: anime.title,
      lastUrl: viewer.__lastViewerUrl || anime.url,
      currentEp: anime.currentEp,
      cover: anime.cover
    });
  });

  return { opened: true };
});

ipcMain.handle('viewer:update-url', (event, url) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const safeUrl = typeof url === 'string' ? url : '';
  if (!win || win.isDestroyed() || !/^https?:\/\//i.test(safeUrl)) return false;
  win.__lastViewerUrl = safeUrl;
  return true;
});

ipcMain.handle('viewer:open-external', async (event, url) => {
  const safeUrl = typeof url === 'string' ? url : '';
  if (!/^https?:\/\//i.test(safeUrl)) return false;
  await shell.openExternal(safeUrl);
  return true;
});
