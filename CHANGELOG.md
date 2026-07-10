# 修改紀錄（CHANGELOG）

> **給 AI 助手 / Open Design 的須知（每次動工前先讀這份）**
>
> - **正式版頁面是 `index.html`**（約 2000 行，HTML/CSS/JS 全在單檔內）。
> - **`anime-tracker-guoman-draft.html` 是 Open Design 的國漫風格設計草稿**，僅供 OD 預覽 iframe 使用，不會被打包進 App（`package.json` 的 `build.files` 沒有包含它）。設計定稿後才手動搬進 `index.html`。
> - 舊版草稿 `anime-tracker-v3.html`、`anime-tracker-v4.html` 已刪除，**不要再引用或重建它們**，歷史版本在 git 裡都找得到。
> - 資料檔位置：開發模式在專案內 `data/anime.json`；打包後在 `%APPDATA%/追劇小幫手/data/anime.json`（`app.getPath('userData')`）。**不要把資料路徑改回 `__dirname`**，asar 是唯讀的。
> - `viewer.html` 的 `<webview>` **不可以加回 `allowpopups`**；彈窗與非 http(s) 導向已在 `main.js` 統一封鎖（`web-contents-created` handler）。要開外部連結一律走 `electronAPI.openViewerExternal()`。
> - 圖片引用現況：`index.html` 用到 `background2.png`、`logo-transparent.png`、`enso-play-icon.png`。`background.png`（無 2）已刪除。
> - `assets/` 內的 `RUN.mp4`、`boat.gif`、`output.gif`、仙俠少女圖為設計素材／展示媒體，未被程式引用，未進版控（約 47MB）。

---

## 2026-07-11 — 修復資料儲存、更新發佈方式、webview 安全（by Claude Code）

### 1. 修 bug：打包後資料存不進去、更新會洗掉紀錄（`main.js`）
- **原因**：資料檔原本寫在 `__dirname/data/anime.json`。打包後 `__dirname` 位於唯讀的 `app.asar`，`writeFileSync` 直接失敗；就算可寫，自動更新換掉 app 檔案時也會把使用者紀錄整個蓋掉。
- **修法**：`app.isPackaged` 時改用 `app.getPath('userData')/data/anime.json`；開發模式維持專案內 `data/`，方便直接檢視編輯。
- 連帶把 `package.json` `build.files` 裡的 `"data/**/*"` 移除——之前會把開發者自己的追劇清單打包進每個使用者的安裝檔。

### 2. 存檔改為原子寫入（`main.js` `writeAnimeList`）
- 先寫 `anime.json.tmp` 再 `renameSync` 覆蓋，避免寫到一半當機/斷電毀掉整份 JSON。

### 3. webview 安全（`viewer.html` + `main.js`）
- `viewer.html:340` 的 `<webview>` 移除 `allowpopups`——第三方影音站的廣告彈窗不再能開新視窗。
- `main.js` 新增全域 `app.on('web-contents-created')`：
  - `setWindowOpenHandler` 一律 `deny`（涵蓋所有視窗與 webview 的 `window.open`）。
  - `will-navigate` 擋掉非 `http(s)://` 的導向（防 `file://`、自訂協定挾持）。

### 4. 更新發佈改走 GitHub Releases（`package.json` + `.gitignore`）
- publish provider 由 `generic`（GitHub Pages `updates/` 目錄）改為 `github`（owner: `ayase0307`, repo: `animetrack`）。
- `updates/` 從 git 移除追蹤並加入 `.gitignore`（檔案仍留在磁碟）。安裝檔 .exe 進 git 會讓 repo 無限膨脹。
- **⚠️ 後續要做的事**：
  1. 下次發版：設好 `GH_TOKEN` 環境變數後跑 `npx electron-builder --publish always`，或手動把安裝檔 + `latest.yml` 上傳到 GitHub Release。
  2. 已安裝的 0.1.2 以前版本仍會去舊的 Pages URL 檢查更新，收不到新版通知——需要手動下載安裝一次新版本後才會接上 Releases 頻道。
  3. git 歷史裡仍有舊 .exe（repo 體積不會自動變小）；若在意，之後可用 `git filter-repo` 清理（有風險，需重推）。

### 5. 清理無引用的檔案（已 `git rm`，歷史可找回）
- `anime-tracker-v3.html`、`anime-tracker-v4.html`（舊版草稿）
- `sample.png`、`background.png`、`ChatGPT Image 2026年4月24日 下午11_33_30.png`（無任何檔案引用）

### 未動的項目（刻意保留）
- `index.html` 單檔 2000 行未拆分——目前可運作，且拆檔會影響 Open Design 的單檔預覽流程；等下次大改功能時再evaluate。
- `assets/` 內大型媒體（47MB）未刪——無法確認是否為不可重建的素材，僅未進版控。
- 專案仍在 OneDrive 目錄內——建議之後搬到本機路徑（如 `C:\dev\`）或對此資料夾設 OneDrive 排除，`node_modules/` 與 `.git/` 被同步引擎鎖檔會拖慢速度、偶發衝突。
