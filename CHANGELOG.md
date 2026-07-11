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

## 2026-07-12（第九批）— 併入 v0.5.0

使用者選七項：山水視差背景（素材向）＋成就集印冊、守護獸互動深化、封卷典禮、評分墨韻圖、追番香火 streak、開坑儀式（純代碼）。年鑑未選。全部只動 `index.html`。

- **多層山水視差**：`initParallax()` 依序建三層 `#paraFx .para-layer`（far/mid/near，`assets/bg-far/mid/near.png`），**逐張 probe、缺圖該層直接跳過**；層序用「先建 div 後補圖」保證不亂。滾動＋滑鼠 rAF 節流位移，reduced-motion 顯示靜態層不動。`z-index:-1` 靠 `.screen.active` 的 `isolation:isolate` 墊在內容下、背景上。淺色主題用 filter 反轉降飽和。**素材尚未生成，生成前此功能不可見**。
- **評分墨韻圖**：統計頁「評分墨韻」區＝五星分布毛筆橫條（不規則圓角＋青金漸層）＋分類佔比 conic-gradient 墨環（mask 挖洞）＋圖例。`renderInkCharts()`。
- **追番香火 streak**：`v4_streak`（localStorage，不動 DB）記 `{last,days}`，`bumpStreak()` 掛在 `highlightUpdatedCard`（覆蓋所有 +1 路徑）。**日期用本地 `_dkey()` 不用 toISOString（UTC+8 跨日會錯）**。斷火＝最後紀錄早於昨天。統計頁香爐 SVG＋煙霧三檔（1/7/30 天）。
- **成就集印冊**：九枚篆刻印（初墨/小成/十全/百集/化蛟/化龍/知音/香火/問籤），`SEALS` 條件函數陣列，達成永久記入 `v4_seals`（刪資料不掉印）。新達成播 `sealEarn` 蓋印動畫＋toast。求籤旗標 `v4_omi_used` 設在 `openOmikuji`。
- **封卷典禮**：`showSealFx` 改分流——reduced-motion 走原簡易蓋印；否則 `showFinishRite()` 全屏儀式：兩半卷軸 0.62s 閉合→0.72s 朱印「完」落下（SFX.seal 對準 0.7s）→金粉飄落→1.75s 淡出。z-index 6500。
- **開坑儀式**：`submitEdit` 偵測分類 watchlist→非 watchlist，`playKaikeng()`：橫卷「開卷」scaleX 展開＋墨滴落下＋古琴聲，toast「開坑大吉！」。reduce 只 toast。
- **守護獸互動深化**：(1) `spiritSay()` 墨泡吐字（+1 集觸發，2.2s）；(2) pointer 拖曳換位存 `v4_spirit_pos`（位移 <6px 視為點擊，維持原搖擺互動）；(3) 每 5 分鐘 25% 機率本尊複製體 `spirit-cross` 游過螢幕 9s（reduce／隱藏分頁不觸發）。
- **移除統計頁熱力圖後遺**：無（第八批補充已清乾淨）。
- 驗證：語法全過；Electron 截圖：統計頁三新區（墨韻條、墨環、香爐 5 天、印冊四紅五灰）、封卷典禮中段（閉合＋朱印＋金粉）、開坑橫卷、守護獸吐字「妙哉」。
- 山水視差素材三張已到位並驗證（深色透明度調降為 .4/.42/.36 避免搶卡片；淺色 filter 反轉後呈宣紙淡墨效果極佳）。v0.5.0 全部內容至此完成。

2026-07-12（第八批補充）

- 使用者 Codex 素材四張已到位（spirit-koi/jiao/long、koi-top），Electron 截圖驗證：錦鯉池游動、漣漪、守護獸三階段與進化 toast 全通。錦鯉游向已修正（順時針軌道 `--face:180deg`、逆時針 `0deg`）。
- **移除統計頁「追番週曆 · 更新熱力」**（使用者要求）：HTML 區塊、renderStats 內 weekHeat 渲染與點擊跳轉、`.week-heat`/`.heat-cell` 全部 CSS（含淺色覆寫）一併清除。每週更新排程（weekGrid）保留。

2026-07-12（第八批）— v0.5.0（已發版）

使用者選了六項：屏風摺頁過場、追番長卷、古琴音效包、節日彩蛋（純代碼四項）＋水墨守護獸養成、錦鯉池空狀態（素材向兩項）。全部只動 `index.html`。

- **屏風摺頁過場**：分頁切換的 view-transition 改為四摺屏風開合（comb 形 clip-path 的 `screenFold`/`screenUnfold`）。**技術地雷：規則掛在 `html:not(.theme-vt)` 上**，主題切換的墨暈（`html.theme-vt`）機制不受影響，兩者不可互蓋。reduced-motion 時 JS 既有分流直接跳過 VT。
- **追番長卷**：統計頁新增 `#scrollTl` 橫向手卷時間軸（入卷／完結事件、完結朱印帶星等、上下交錯、金軸卷邊）。事件取自 `addedDate`/`finishedDate`，`renderAll` 內呼叫 `renderScrollTl()`。支援拖曳與滾輪橫捲，渲染後自動捲到卷尾（最新）。
- **古琴音效包**：Web Audio 純合成（無音檔）：+1 集古琴泛音（掛在 `highlightUpdatedCard`，覆蓋 incEp/markWatched/Ctrl+Enter）、蓋印鈍響＋磬聲餘韻（`showSealFx`）、求籤搖筒沙響（`drawOmikuji`，reduce 時不播）。header 新增「音」鈕（`#sfxBtn`，`aria-pressed`），**預設關閉**，`localStorage v4_sfx`。所有播放包 try/catch。
- **節日彩蛋**：`initFestivalFx()` 依日期查 `FESTIVALS` 表（**農曆節日 2026–2031 寫死查表，到期補表**）：春節雙紅燈籠（連三天）、中秋滿月、端午龍舟 SVG 掠過下緣、七夕星河鵲橋。`#festFx` 疊層 z-index:2、pointer-events:none，reduced-motion 整層不建。每個節日當天第一次開啟會 toast 問候（`fest_greet_*`）。
- **水墨守護獸**：`updateSpirit()`（`renderAll` 內呼叫）依累積集數升階：0 錦鯉→300 蛟→1000 龍（`SPIRIT_STAGES` 寫死）。素材 `assets/spirit-koi.png`/`spirit-jiao.png`/`spirit-long.png`，**用 Image probe，缺圖自動不顯示**。左下角浮動、點擊搖擺＋短語 toast、升階播金光進化動畫（localStorage `v4_spirit` 記上次階段，只在升階時報喜）。<820px 隱藏。
- **錦鯉池空狀態**：追蹤列表空狀態時 `#trackEmpty` 前置 `.koi-pond`（三尾 `assets/koi-top.png` 以旋轉軌道游動、負 delay 錯開），**缺圖退回原本墨字「空」**（`has-pond` class 控制）。點水面起漣漪＋魚群加速散開 1.6s。
- 驗證：三段 inline script `new Function` 語法檢查全過；Electron offscreen 截圖驗證統計頁長卷（深／淺色）、音效鈕開啟態、中秋滿月、春節燈籠。
- **待辦**：使用者用 Codex 生成四張素材（spirit-koi/jiao/long、koi-top）丟進 `assets/` 即生效；錦鯉朝向（`--face`/`--flip`）可能需依實際素材方向微調。版本號尚未 bump（發版時一併 0.5.0）。

2026-07-11（第七批）— v0.4.1 自動更新改水墨卡片（by Claude Code）

使用者問「桌面版是否要手動雙擊安裝檔」——其實 v0.2.0 起 autoUpdater 就會在開啟 3 秒後查 GitHub Releases，只是用**原生系統對話框**，看起來不像 app 的一部分。本批把整個更新 UX 改成右下角水墨更新卡片。

1. **main.js**：`setupAutoUpdate()` 移除 `dialog.showMessageBox`／`showErrorBox`，改為 `mainWindow.webContents.send('update:event',{type,...})` 轉發四種事件（`available`／`progress`／`downloaded`／`error`），新增 `ipcMain.handle('update:download'/'update:install')`。`quitAndInstall` 會觸發 before-quit → `isQuitting=true`，不會被 close-to-tray 攔下（沿用既有機制，勿改）。
2. **preload.js**：暴露 `downloadUpdate()`、`installUpdate()`、`onUpdateEvent(cb)`（回傳解除函式）。
3. **index.html**：`#updateCard` 右下角固定卡片（金框、朱印「新」旋 -6°、`updateIn` 浮入動畫），三狀態：發現新版（稍後／下載更新）→ 下載中（**重用毛筆 `.progress-bar`/`.progress-fill`**＋百分比）→ 已備妥（稍後／重啟安裝）。錯誤走既有 `toast('error')`。淺色主題有對應覆蓋。「稍後」關卡片即可——electron-updater `autoInstallOnAppQuit` 預設 true，下載完的更新退出時會自動裝，卡片文案有說明。
4. 驗證：三個檔案語法檢查通過；用 `npx electron` 載入 index.html 注入三種狀態截圖（深色 available/downloading、淺色 downloaded）比對風格。**測試坑：`show:false` 或從未顯示的視窗 `capturePage` 只會回首繪畫格**，要 `show:true` 才抓得到 DOM 變更。
5. 注意：v0.4.0（含）以前的舊版收到 0.4.1 更新時，仍會用**舊的原生對話框**下載安裝；裝上 0.4.1 之後的更新才會看到水墨卡片。

## 2026-07-11（第六批）— v0.4.0 週曆分頁、匯入合併、淺色打磨、四季節氣、卡片翻面、磨墨 +1（by Claude Code）

僅動 `index.html`（＋版本號）。使用者選了六項：週更時間表、匯出匯入補強、淺色主題打磨＋設計提案三項（四季節氣、卡片翻面、磨墨入硯）。

### 功能
1. **週曆分頁**（新第 2 個分頁）：七欄（週一～週日）封面縮圖卡，今日欄描金高亮＋「今日」朱字。點卡片＝`openPlayer`，hover 出現「＋」＝`incEp`。想看清單與未設更新日者不排入；底部顯示未設定更新日的數量提示。快捷鍵 1–5 對應五個分頁（原 1–4），說明 modal 已更新。`renderWeekCal()` 掛在 `renderAll()`。
2. **匯入合併模式**：原「匯入資料」改名「匯入（覆蓋）」，新增「匯入（合併）」——同名（不分大小寫）略過、只插入清單沒有的作品，不清除現有資料。共用 `importRow()`/`insertImported()`，覆蓋與合併兩條路都走它。

### 設計
3. **淺色主題打磨**：國漫暗色覆蓋層（header、tab-nav、卡片、toolbar、modal、toast、輸入框、statistic 卡、empty、today-banner…）全部補上 `html[data-theme="light"]` 對應版。**注意星星規則要用 `.star:not(.filled)`**，否則會蓋掉金色實星。
4. **四季節氣氛圍**：`initSeasonFx()` 依月份生成粒子層 `#seasonFx`（春櫻瓣／夏螢火／秋葉／冬雪，z-index:2、pointer-events:none）。落下粒子用負 animation-delay 讓開場即散佈。時辰問候前面加當前節氣（`SOLAR_TERMS` 固定日期近似，±1 天誤差可接受）。**`SOLAR_TERMS` 宣告在 `renderShichen()` 呼叫之前執行——別把呼叫移回宣告前，會踩 TDZ**。reduced-motion 整層不生成。
5. **卡片翻面**：點封面翻到背面（名稱、進度、分類、更新日、評分、加入/完結日、備註），再點翻回。**技術地雷：`.card-cover` 有 `overflow:hidden` 會 flatten `preserve-3d`，所以是 img 與 `.cover-back` 各自 rotateY，不是翻整個容器**。清單檢視不翻（JS 擋）；封面上的換圖按鈕不觸發翻面。
6. **磨墨入硯**：`highlightUpdatedCard()` 在 +1 時於進度條末端（依 `progress-fill` 寬度定位）落一滴玉青墨滴＋漣漪（`.ink-drip`/`.ink-splash`），與既有 `just-updated` 動畫疊加。`.progress-bar` 因此加了 `position:relative`。

### 驗證
- 用本機靜態伺服器＋iframe（觸發 `DRAFT_PREVIEW` 範例資料）以 Playwright 實測：週曆七欄／今日高亮、翻面正反、墨滴漣漪、淺色主題全頁截圖，均通過；inline script 語法檢查通過。

## 2026-07-11（第五批）— v0.3.1 修復視窗控制鈕、Supabase 設定遺失、滑鼠特效改版（by Claude Code）

### 修 bug
1. **視窗控制鈕回歸**（`index.html`）：主視窗是 `frame:false`，國漫改版時自訂標題列按鈕遺失了（viewer.html 一直有、index.html 沒有）。新增 `#winDrag` 拖曳區（頂部 26px，右側讓出 138px）＋ `.win-controls` 最小化／最大化／關閉鈕，**只在 `body.electron` 顯示**（`IS_ELECTRON` 時 JS 加 class），web 版完全隱藏。最大化狀態靠 `body.maximized` class 切換圖示（`onWindowMaximizedChanged`）。關閉鈕行為＝縮到系統匣（沿用 close-to-tray）。
2. **Supabase 設定每次開啟都遺失**（`main.js`）：根因是**沒有單一實例鎖**——關窗縮到系統匣後再點捷徑會開出第二個實例，localStorage（LevelDB）被第一個實例鎖住讀不到 `sb_url`/`sb_key`，看起來像設定消失。加 `app.requestSingleInstanceLock()`，搶不到鎖就 `app.exit(0)`，`second-instance` 事件喚回原視窗。**這條鎖不可移除**。

### 滑鼠特效改版（使用者從四個選項中選了「墨滴漣漪（點擊限定）」）
- 移除整段「水墨拖尾鼠標特效」（跟隨圓環＋移動撒墨點），改為**點擊限定**的墨滴漣漪：mousedown 時兩圈玉青漣漪自指尖暈開（560ms），移動時零特效。淺色主題有對應色。觸控裝置與 reduced-motion 不啟用。
- 舊的 `#ink-cursor`／`.ink-dot` CSS 與相關淺色覆蓋規則已全部移除，新 class 是 `.ink-ripple`。

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
