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

## 2026-07-11（第四批）— v0.3.0 七項設計／功能：卷軸開場、卡片生滅、快速面板、求籤等（by Claude Code）

僅動 `index.html`（＋版本號）。使用者核准全部七項提案：

### 動畫
1. **卷軸開場** `playScrollOpen()`：進入 app 畫面時兩半卷軸（`#scrollOpen`，含金軸 `.rod`）向外滾開。`sessionStorage.scrollOpened` 保證每次啟動只播一次；reduced-motion 直接跳過；有 2.6s 保險絲強制移除 overlay。
2. **卡片生滅套組**：
   - 落墨而生 `.ink-born`：`submitAdd` 設 `pendingBornId` → `renderTrack` 渲染後對新卡片套 clip-path 墨暈動畫。
   - 墨散而逝 `.ink-dissolve`：`delAnime` 確認後先播 0.52s 散墨再真正 `dbDelete`。
   - 鎏金拂過：`.card-cover::before` 金色 sheen，hover 掃過（**注意 `.card-cover::after` 已被佔用**做色調覆蓋，sheen 只能用 `::before`）。
3. **今日更新呼吸墨暈** `.is-today`：`cardHTML()` 對今天更新且未完結的卡片加 class，非 hover 時 4.5s 玉青呼吸光暈。
4. **時辰問候** `#shichen`：header logo 旁，十二時辰＋古風短語，每 10 分鐘刷新；窄於 820px 隱藏。

### 功能
5. **Ctrl+K 快速面板** `#quickOverlay`：搜尋作品，↑↓ 選、Enter 播放（`openPlayer`）、Ctrl+Enter +1 集（`incEp`）、Esc 關。快捷鍵說明 modal 已加一列。
6. **求籤** `#omikujiOverlay`：header「籤」鈕 → 籤筒搖晃 0.95s → 從未完結作品隨機抽一部，顯示籤等（大吉…）＋籤詩＋「就看這部」。
7. **追番總結圖** `exportSummaryImg()`：設定區「生成總結圖」鈕，canvas 畫 1080×1350 夜墨風統計卡（累計集數、追蹤中/已完結/最常更新日、正在追前三部、朱印），直接下載 PNG。等 `document.fonts.ready` 再畫，Noto Serif TC 才會生效。

### 給 Open Design 的補充
- 所有新動畫都收在同一個 reduced-motion 區塊（搜 `ink-born,.anime-card.ink-dissolve`）。
- `Escape` 全域處理多了 `closeQuick()`、`closeOmikuji()`；新 overlay 沿用 `.modal-overlay`＋`.show` 機制。
- 求籤籤詩在 `OMI_POEMS` 陣列、時辰短語在 `SHICHEN_LINES`，改文案直接改陣列即可。

## 2026-07-11（第三批）— v0.2.1 視覺升級：墨暈換主題、毛筆進度條、蓋印儀式（by Claude Code）

僅動 `index.html`，三個視覺提案（使用者從提案清單選了 1＋2＋4）：

1. **墨暈換主題**：`toggleTheme(event)` 改用 View Transition API——新主題從日月按鈕的點擊位置以圓形 `clip-path` 暈開（560ms）。切換期間 `<html>` 掛 `theme-vt` class 停用預設 crossfade，**該 class 的 CSS 規則（`html.theme-vt::view-transition-*`）不可刪**，否則會跟分頁過場互相打架。不支援 VT 或 reduced-motion 時直接切換。
2. **毛筆進度條**：`.progress-fill` 套 SVG 筆觸 mask（data URI，`preserveAspectRatio='none'` 隨寬度拉伸，筆尾收尖）。完結卡片的進度條轉朱砂漸層（`.is-finished .progress-fill`）。mask 寫了 `-webkit-mask` 和 `mask` 兩份，改的時候兩份要同步。
3. **蓋印升級**：
   - `sealDrop` 改為高空落下＋回彈（-140px、2.15x 起手，62% 落地過衝）；新增 `.seal-blot` 墨漬在落地時暈開。reduced-motion 下印章靜態顯示後淡出、環與墨漬隱藏。
   - **完結卡片封面右上角永久蓋 `.cover-seal` 朱印**（「完」＋完結年份，旋轉 8°，`cardHTML()` 內 `fin` 分支輸出）。分類標籤 `.cat-tag` 在完結卡片上讓位下移（`top:60px`）。

## 2026-07-11（第二批）— v0.2.0 功能更新：主題、Bangumi、系統匣、通知（by Claude Code）

> **已部署**：線上版＝push main 後 GitHub Pages 自動更新（https://ayase0307.github.io/animetrack/）；
> 桌面版＝https://github.com/ayase0307/animetrack/releases/tag/v0.2.0 （exe＋blockmap＋latest.yml 三件都要上傳，electron-updater 才收得到）。
> 之後發版 SOP：改 version → commit/push → `npx electron-builder --win --publish never` → `gh release create vX.Y.Z dist/AnimeTrack-Setup-X.Y.Z.exe dist/*.blockmap dist/latest.yml`。

### 新增功能（`index.html`）
1. **宣紙／夜墨雙主題**：header 新增日月切換鈕。實作方式＝`html[data-theme="light"]` 覆蓋 `:root` 設計變數＋少數材質層（body 紋理、`.screen.active` 背景、捲軸），元件規則完全共用。持久化 key：`localStorage.v4_theme`（預設 `dark`）。`<head>` 有一行 inline script 在繪製前套主題防閃爍。**淺色模式下 `--paper` 變數轉為墨色前景**（該變數只當文字色用）；淺色下 `--fantasy-bg-image` 設為 `none`（不用暗色玄幻背景圖）。
2. **Bangumi 自動填入**：新增表單「作品名稱」旁有「自動填入」鈕 → `api.bgm.tv` 搜尋（legacy search API）→ 點選結果 → v0 subject API 帶回封面（URL 模式）、總集數、更新日（infobox 放送星期）。新 CSS class：`.name-fetch-row`、`.bgm-results`、`.bgm-item`。
3. **今日更新桌面通知**：`notifyToday()`，僅桌面版（`IS_ELECTRON`），每天最多一次（`localStorage.notif_YYYY-MM-DD`），在 `loadData()` 成功後觸發。
4. **看完集數自動推測**：`guessNextN()` 從最後觀看網址的 ep/episode/第N/結尾數字猜「+N」預設值（差值限 1–99，猜錯可用 +/- 修正）。
5. **封面 fallback 改本地書法字卡**：`FALLBACK()` 改為生成 SVG data URI（墨底、金色首字、enso 圈、朱砂「追」印），**不再依賴 ui-avatars.com 外部服務**（離線可用）。
6. **空狀態重設計**：`#trackEmpty` 改為水墨風（「空」字圓框＋「硯臺還是乾的」＋「添上一筆」按鈕）。新 CSS：`.empty-ink`。

### 桌面版（`main.js`）
- **系統匣常駐**：按 X 縮到系統匣不退出；系統匣選單「開啟／結束」。退出要走 `isQuitting` flag（`before-quit` 會設 true，autoUpdater 的 quitAndInstall 也走這條路）。
- `app.setAppUserModelId()`：Windows 通知必需，勿移除。

### 修正
- `package.json` `build.files` 補上 `assets/*.png` —— 今日橫幅的仙俠少女圖（`assets/xianxia-girl-jade-scroll-1024x1280.png`）之前沒被打包，桌面版會破圖。
- 版本號 0.1.2 → 0.2.0。

### 給 Open Design 的補充紅線
- 主題切換依賴 `html[data-theme]` 屬性選擇器，改版時**保留 `<head>` 的主題 inline script** 與 `.ic-moon`/`.ic-sun` 顯示規則。
- 淺色主題只靠變數覆蓋；若新增元件請一律用 `var(--…)` 取色，不要寫死 `rgba(246,241,225,…)` 這類紙色常數，否則淺色模式會壞。
- 淺色主題是第一版，紙色細節（硬編碼的紙色 tint、卡片 scrim）尚未逐一調整，OD 可在此基礎上打磨。

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
