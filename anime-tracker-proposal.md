# 專案提案：動畫觀看追蹤器（Electron 桌面應用）

## 專案概述

將現有的 HTML 動畫觀看追蹤網站，升級為 Electron 桌面應用程式。
核心目標：讓使用者在不離開追蹤器的情況下觀看動畫，看完後自動更新觀看集數。

---

## 現有基礎

- 已有一個純 HTML 網站
- 網站功能：追蹤每部動畫目前看到第幾集
- 目前有按鈕可導向外部動畫網站（會跳轉離開）
- 集數資料記錄在網站本身

---

## 目標功能

### 核心流程

1. 使用者在追蹤器中點擊「觀看」按鈕
2. Electron 開啟一個新視窗載入外部動畫網站（不跳轉、不開瀏覽器）
3. 使用者在新視窗內觀看動畫
4. 使用者關閉觀看視窗後，自動彈出提示對話框
5. 對話框詢問：「看完了嗎？」並顯示目前集數
6. 使用者點擊「是，+1 集」→ 集數自動更新
7. 使用者點擊「否」→ 不做任何變更

### 彈出對話框規格

```
┌─────────────────────────────────┐
│  📺 更新觀看進度                 │
│                                 │
│  《進擊的巨人》                  │
│  你看完第 12 集了嗎？            │
│                                 │
│  [否，還沒看完]   [是，更新到第13集] │
└─────────────────────────────────┘
```

---

## 技術規格

### 技術棧

- **框架**：Electron（桌面應用）
- **前端**：純 HTML + CSS + JavaScript（沿用現有網站）
- **資料儲存**：localStorage 或本地 JSON 檔案（持久化儲存集數）
- **IPC 通訊**：Electron ipcMain / ipcRenderer

### 專案結構

```
anime-tracker/
├── main.js              # Electron 主程式
├── preload.js           # 安全橋接層（contextBridge）
├── index.html           # 現有追蹤網站主頁面
├── package.json
└── data/
    └── anime.json       # 動畫資料儲存檔案
```

### 資料結構（anime.json）

```json
{
  "animeList": [
    {
      "id": 1,
      "title": "進擊的巨人",
      "currentEp": 12,
      "url": "https://animeweb.com/aot"
    },
    {
      "id": 2,
      "title": "鬼滅之刃",
      "currentEp": 5,
      "url": "https://animeweb.com/kny"
    }
  ]
}
```

---

## 各檔案功能說明

### main.js 負責

- 建立主視窗載入 index.html
- 監聽「開啟觀看視窗」的 IPC 事件
- 建立新的 BrowserWindow 載入外部動畫網站
- 監聽觀看視窗的 `closed` 事件
- 觸發彈出對話框（使用 Electron dialog 模組）
- 將更新結果透過 IPC 回傳給主視窗

### preload.js 負責

- 使用 contextBridge 安全地暴露 API 給前端
- 橋接 `openViewer(id, url, title, currentEp)` 方法
- 橋接 `onUpdateEp(callback)` 監聽集數更新事件

### index.html 負責

- 顯示動畫清單與目前集數
- 點擊「觀看」按鈕呼叫 `window.electronAPI.openViewer()`
- 監聽集數更新事件並即時更新畫面顯示
- 從 anime.json 讀取並儲存資料

---

## 實作優先順序

1. **Phase 1**：建立 Electron 基本架構，能開啟外部網站視窗
2. **Phase 2**：實作視窗關閉後的彈出確認對話框
3. **Phase 3**：實作集數 +1 自動更新並寫回 anime.json
4. **Phase 4**：整合現有 HTML 網站樣式與資料

---

## 注意事項

- 使用 `contextIsolation: true` + `preload.js` 確保安全性，不要使用 `nodeIntegration: true`
- 觀看視窗使用標準 `BrowserWindow.loadURL()` 載入外部網址，不需要 `<webview>` 標籤
- 集數資料需持久化儲存，應用程式重啟後資料不能遺失
- 對話框使用 `dialog.showMessageBoxSync()` 確保是阻塞式（等使用者回應才繼續）
- 打包工具使用 `electron-builder`，最終輸出 Windows `.exe` 安裝檔

---

## 驗收標準

- [ ] 點擊「觀看」能在新視窗開啟外部動畫網站
- [ ] 關閉觀看視窗後自動彈出確認對話框
- [ ] 對話框正確顯示動畫名稱與目前集數
- [ ] 點擊「是」後集數 +1 且畫面即時更新
- [ ] 重啟應用程式後集數資料仍然保留
- [ ] 能成功打包為 `.exe` 安裝檔
