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

## 2026-07-13（第二十二批）— 殘影根治＋喝茶動作（未發版）

動 `index.html`＋`assets/`。使用者回報所有動圖有殘影；並排重現（GIF 原始 vs WebP 轉檔各放大 390px 連拍）**實錘殘影只出現在 WebP 側**：跳舞扇子疊影、驚嚇紫邊拖尾。

- **根因**：ffmpeg 的 libwebp 動態編碼對透明背景的幀處置（dispose method）設定不當，新幀透明處透出上一幀殘像。`anim_dump` 單幀看不出來（libwebp 自家合成器容錯），**必須在 Chromium 裡並排播放才看得到**。
- **修法**：全部 12 套改用 Google 官方 libwebp 的 `gif2webp -m 6 -mt` 重轉（本機沒裝，直接抓官方 zip：`storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.6.0-windows-x64.zip` 免安裝解壓即用）。fox 系的 loop=1 gif2webp 給不了，用同包 `webpmux -set loop 1`（注意是 `-set loop`，別寫成 `-loop`；in-place 覆寫要先寫 temp 再搬）。fox-back 反轉中繼 GIF 用 ffmpeg `reverse＋palettegen(reserve_transparent=1)＋paletteuse` 產生後再過 gif2webp。**教訓：GIF→動態 WebP 一律用 gif2webp，別用 ffmpeg**。
- **喝茶新動作**：使用者出「居家夜寐-飲茶-透明循環」（308×285、24 幀@25/6、同 5.76s 週期）→ `yueli-tea.webp` 入閒置池：19 點後 35%／白天 15% 喝茶，其餘散步／跳跳／跳舞照舊。
- 驗證：harness 23/23（新增喝茶項）＋並排截圖確認 WebP 與 GIF 逐幀一致。**harness 時序又踩兩坑**：斷言餘裕貼著計時邊界會假紅（統一留 ≥1s）；測試收尾補發的 pointerup 會被算成一次完整點擊、把選單打開，後續點擊測試就變成「關閉」——收尾後要先驗 `_fuEls` 把選單收回。

---

## 2026-07-13（第二十一批）— 月璃四式新動作（未發版）

動 `index.html`＋`assets/`。使用者再出四套像素 GIF（側躺睡覺 24 幀@25/6、驚嚇炸毛／害羞遮臉／召喚狐火 18 幀@25/8——**幀數 fps 不同但週期都是 5.76 秒**，`YUELI_DUR=5800` 通用），轉無損 WebP：`yueli-sleep/startle/shy/fire.webp`（皆無限循環）。

- **睡眠改人形側躺**（使用者指定）：`spiritSleepCheck()` 狀態翻轉時 `yueliReset`＋換 `yueliBase(el)`（睡＝sleep、醒＝sit），狀態沒變不碰 src（不打斷炸毛等播放中動作）。新增 `yueliBase()`，所有動作播畢／散步歸位／pointerdown 歸位一律回 base 而非寫死 sit——跨 23:00 播到一半也會正確落入睡姿。`.sleeping` 的變暗＋12s 漂浮＋Zzz 照舊疊在側躺上。
- **變身改點擊觸發**（使用者指定）：清醒點擊＝`yueliFox()`＋扇形選單照開（原跳躍讓位，跳躍保留給餵食成功與閒置池）；閒置池移除 12% 變身，改散步 50%／跳跳 40%／跳舞 10%。
- **驚嚇炸毛＝睡覺被戳**：取代原 wiggle，播完自動回側躺續睡，夢話 toast 照舊。
- **害羞遮臉＝拖曳抱起**：pointermove 越過 6px 門檻那刻換 shy（睡著就不害羞、繼續睡），放下先歸位 base 再跑 `spiritFeedCheck`（**順序不能反**，否則餵食的跳躍／生氣反應會被歸位蓋掉）。
- **召喚狐火＝求籤施法**：選單「籤」符 `yueliPlay('fire')`＋`openOmikuji()`；抽中大吉會被跳舞接管，施法→慶祝的順序自然。
- **等比顯示**：四套新圖畫布差很大（201~347px 寬），固定 110px 會讓高畫布動作縮成小隻。`updateSpirit` 建立時掛 `img load` 監聽：`el.style.width=naturalWidth*(≤820px?0.32:0.55)`，坐姿 201→110px 基準不變，害羞 297→163px、炸毛 347→190px；`resize` 也重算。
- 驗證：harness 擴到 22/22（新增：等比寬度、點擊變身＋選單、拖曳害羞＋放下歸位、睡戳炸毛＋續睡、時段醒睡、狐火）＋施法截圖。**harness 要時間感知**：跑在 23:00 後月璃建立即側躺，「預期坐姿」的斷言全會假紅（本批實跑就撞到，`NIGHT` 旗標分流解決）。

---

## 2026-07-13（第二十批）— 守護獸換角：月璃上任（未發版）

動 `index.html`＋`assets/`。守護獸「錦鯉→蛟→龍」概念整個退役，改由**月璃（像素風九尾狐娘）**駐守左下角。扇形選單、拖曳餵番、親密度（40/120/300）、睡眠（23–07）、叼信、對話泡全部原樣保留，只換視覺與動作層。

- **素材**：使用者提供 6 套 24 幀像素 GIF（原檔中文名，未進版控；builder 白名單本就不含 `*.gif`），ffmpeg 轉無損動態 WebP 進版控：`yueli-sit/dance/jump/angry/walk`（無限循環）＋`yueli-fox`／`yueli-fox-back`（變身／變回，`-loop 1` 播完定格；fox-back 由原 GIF `-vf reverse` 反轉而得）。每套 24 幀 @ 25/6fps ≈ 5.76 秒一輪（JS 常數 `YUELI_DUR=5800`）。
- **動作播放器**：`yueliPlay(name)` 換 `img.src` 播一段、時間到回坐姿；`yueliReset()` 統一取消計時鏈與位移。**fox 系 loop=1 必須 `?t=` cache-bust 才會從頭播**（同 URL 會停在已播完的最後一幀）；循環系不 bust（省線上版流量）。
- **對應**：點擊／餵食成功＝跳躍；親密度升級／求籤大吉＝跳舞；餵食被拒（完結・想看清單）＝跺腳生氣（原完結是靜默 return，本批補了拒吃台詞）；閒置 35–90 秒隨機＝散步 50%／跳跳 28%／跳舞 10%／變身小狐狸彩蛋 12%。
- **散步**：`yueliStroll()` 往右走 `translateX`（最多 150px，右側沒路不走）4 秒、回程 `scaleX(-1)` 鏡像 4 秒。**pointerdown 先 `yueliReset` 歸位再量 `getBoundingClientRect`**，否則散步中被抓住、拖曳落點會帶著位移偏掉。
- **移除**：`SPIRIT_STAGES`／`spiritStage()`／進化動畫（evolve）／`v4_spirit` 階段記錄／每 5 分鐘 25% 錦鯉游屏（`.spirit-cross`，由散步取代）／CSS hop・twirl 假動作（真動圖取代，wiggle 留給睡眠戳醒）／`#spiritPet` 整體漂浮 `spiritFloat`（清醒動圖自帶動態；**睡眠仍用 12s spiritFloat，keyframes 勿刪**）。`assets/spirit-koi/jiao/long.png` 已 `git rm`（git 歷史可還原）。印譜「化蛟／化龍」成就鍵值不變、只改敘述文字（使用者已解鎖的不受影響）。
- **像素風**：`#spiritPet img{image-rendering:pixelated}`；睡眠沿用變暗濾鏡＋Zzz（月璃人形闔眼睡，狐狸變身依使用者定案只當清醒彩蛋）。
- 驗證：Electron harness（真 index.html＋DRAFT_PREVIEW iframe）14/14——坐姿載入、pixelated、跳躍、選單健在、播畢回坐、散步去回鏡像歸位、變身定格變回、抓住取消散步、舊制無殘留＋跳舞截圖。**測試坑：閒置生活 tick 20 秒後會亂入手動動作測試，harness 要先 override `document.hidden=true` 凍結**；散步／變身斷言貼著計時邊界（4000/8400ms）驗，機器一卡就假紅，斷言時間要留 ≥500ms 餘裕。

---

## 2026-07-13（第十九批）— 側立女角對話框（未發版）

只動 `index.html`。**使用者最終目標：點女角可「說話」（語音）——本批以文字對話框過渡**，未來接 TTS 時沿用 `sideSay()` 的觸發點。

- **台詞庫**：查證角色人設後撰寫（小白＝誅仙九尾天狐：千年狐慵懶調侃、玄火壇／狐岐山／靈酒梗、「你也是個傷心人麼」化用；司幼幽＝牧神記司婆婆真身：慈愛催睡催飯＋幽冥威嚴、招牌「天黑，別出門」、縫衣／秦牧／殘老村梗）。各 10 句，混追番情境。
- **對話框設計**：`.side-bubble` 沿用宣紙字條語彙（同 toast：紙色漸層＋墨字＋微旋轉），左下角角色朱印章（白＝朱砂、幽＝墨青 `#3d6b8f`），底部 45° 小尾巴指向角色。JS 依 `getBoundingClientRect` 定位在頭頂、水平 clamp 不出視窗，顯示 7 秒。
- **觸發**：閒置每 50–120 秒隨機一位開口（`document.hidden` 跳過、角色隱藏時跳過）；**點擊角色即說**（`pointer-events` 由 none 改 auto＋cursor:pointer，為未來語音互動鋪路）。
- 驗證：語法全過；harness 5/5（點擊互動、雙印章、泡頂位置、視窗 clamp）＋截圖。**截圖坑：capturePage 在視窗被遮擋時回空 buffer，截圖前 `win.show();win.focus();win.moveTop()`＋等 1.2s**。

## 2026-07-13（第十八批・素材已接）— 兩側侍立女角上線（與十七批一起發 v0.5.3）

素材：使用者生成 5120×7680 透明原圖（`side-char-*-8k.png`，17–21MB，**不進版控**；electron-builder 加 `!assets/*-8k.png` 排除），壓成 `side-char-xiaobai.webp`／`side-char-siyouyou.webp`（h1040 yuva420p q85，各 ~110KB）。
尺寸公式改為**寬度跟留白掛鉤**：`width:calc((100vw - 1520px)/2 + 24px);max-width:320px;height:auto`，門檻 1600→**1700px**——第一版固定 `height:46vh` 在 1920 會寬到 306px、小白九尾壓到第一張卡標題；改掛留白後最多滲入 app-main padding 24px，壓不到卡片（harness 1920 驗證通過）。

## 2026-07-13（第十八批）— 兩側侍立女角預接（等素材，未發版）

只動 `index.html`＋提示詞文件。因靈訊女角只在「今日有更新」時現身，使用者要在頁面兩側留白區（內容 max-width 1520px 置中）加常駐站姿女角：左＝誅仙小白、右＝牧神記司幼幽。

- **程式端預接**：`.side-char` 兩個 `<img>`（`onerror="this.remove()"` 缺檔不佔位）；`position:fixed` 貼底、高 `min(46vh,520px)`、`pointer-events:none`、z-index 2（守護獸 z60 在前）；**≥1600px 才顯示**（避免壓到內容）；浮動＋淡入動畫，reduced-motion 只留淡入。
- **提示詞**：`guoman-character-prompts.md` 新增第三節（1024×1536 站姿、腳貼底、臉朝中間；司幼幽外觀請使用者按動畫造型微調）。素材丟 assets/ 後我壓 webp 即現身。
- 驗證：語法全過；harness（1760px 寬）缺檔自動移除 PASS。

## 2026-07-12（第十七批）— 靈訊雙女角排版（未發版）

只動 `index.html`。使用者夜間測試以為守護獸功能被拿掉——實為第十二批睡眠機制（23–07 點擊不開選單），harness 實測選單／餵番／信件／拖曳全數健在，無程式問題。

- **靈訊橫幅改雙女角**：取消日夜切換，兩張常駐——雲韻臥左（原圖頭朝右＝朝中間）、美杜莎臥右（`scaleX(-1)` 鏡像讓頭朝中間；因 animation 蓋 transform，鏡像寫進專用 `charFloatM` keyframes，reduced-motion 時靠 `.spirit-char-night` 的靜態 transform 保底）。文字改置中（`justify-content:center`），padding 左右各 250px（≤920px 200px、≤680px 隱藏雙姝）。
- 驗證：語法全過；harness 4/4（兩張 naturalWidth、左右歸位、鏡像動畫名、置中）＋兩主題截圖。

## 2026-07-12（第十六批）— 躺姿女角上線（日夜各一張）＋守護獸閒置小動作（發 v0.5.2）

- **靈訊女角**：使用者以 AI 生成美杜莎系／雲韻系躺姿原圖（實際 7680×3840 透明 PNG，各 12–15MB，**留在 assets/ 但不進版控**）。ffmpeg 壓成 `spirit-char-medusa.webp`／`spirit-char-yunyun.webp`（高 400、yuva420p、q85，各 ~55KB）進版控。HTML 兩張 `<img>` 常駐、CSS `html[data-theme=dark/light]` 各顯一張（夜墨＝美杜莎、宣紙＝雲韻）。`.today-banner` padding-right 156→262px；≤920px 圖高 94px／留白 212px；≤680px 隱藏不變。舊 `xianxia-girl-jade-scroll`／`spirit-fox` 兩張已無引用（仍在版控，未刪）。
- **修 keyframes 撞名**：`spiritFloat` 定義兩次（女角＋守護獸），後者覆蓋前者害躺姿圖會左右搖——女角改用獨立 `charFloat`。
- **守護獸閒置小動作**（使用者決定不生成動圖的替代方案）：每 35–90 秒隨機做 wiggle／hop（彈跳兩下）／twirl（rotateY 轉身）一次；睡眠中、分頁隱藏（document.hidden）、reduced-motion 均跳過。動態 webp 支援保留，之後有素材仍可 drop-in。
- 驗證：語法全過；harness 8/8（兩主題圖片切換與 naturalWidth、留白 262px、hop/twirl animationName、charFloat 未被覆蓋）＋兩主題截圖。**測試坑：23–07 時測守護獸，`#spiritPet.sleeping` 規則在源碼較後會蓋掉 hop/twirl（行為正確），手動驗 class 前要先移除 sleeping**。

## 2026-07-12（第十五批）— 設計向優化四項（未發版）

只動 `index.html`。與十四批一起等素材到位發 v0.5.2。

- **彈窗宣紙化**：toast 改宣紙字條（紙色漸層底＋墨字、左緣色條依型別、微旋轉滾入，兩主題共用紙色；已從 `.modal` 群組選擇器移除 `.toast`）；印章字圖示 妥／誤／訊。確認框 emoji 在 `showConfirm` 內映射成字印（🚪離 🗑️焚 ⚠️慎 📥納，未知 icon 原樣通過）、`.confirm-icon` 改朱砂方印、`.confirm-modal` 上下加卷軸金線（::before/::after）。
- **今日燈籠**：`todayBreath` 由青轉暖紅金；純 CSS 小燈籠掛在 **`.card-scrim::after`**（簷下搖曳 `lanternSway`）。**坑：`.card-cover::after` 是既有材質疊層，第一版掛那裡直接把它劫持（追印消失＋定位錯亂），勿再犯**。掛 scrim 另有翻面自動隱藏的好處。hover 補 `perspective(700px) rotateX(1.4deg)` 微傾斜（其餘 hover 效果本就豐富，未加碼）。
- **週曆竹簡化**：`.wc-col` 竹節紋（repeating-linear-gradient 48px）＋圓筒感＋簡首穿孔（::before）＋整排繩線（`.week-cal::before`）；今日簡 `translateY(7px)` 抽出；空日「閒」字（原「—」）。淺色主題竹簡變體另寫（原 `.wc-col` 在 light 群組選擇器裡，已拆出）。≤900px 隱藏繩線與穿孔、取消抽出。
- **行動版**：守護獸 ≤820px 改 64px 縮小版不再隱藏；時辰台詞包 `.shichen-line`，≤820px 只顯「節氣·X時」、≤480px 全隱；≤560px 工具列下拉 2-up 排列（`flex:1 1 calc(50% - 8px)`）、搜尋框整行。
- 驗證：inline JS 語法全過；Electron harness 桌面＋390px 各項 getComputedStyle 檢查全過＋三張截圖。**測試坑：未渲染分頁裡的元素 `transform` 一律回報 none，驗 transform 前要先 `switchTab()` 並等 view transition；tab 按鈕 `.click()` 在 harness 內不觸發切換，直呼 `switchTab('week')`**。

## 2026-07-12（第十四批）— 守護獸顯眼化＋動圖支援（未發版）

只動 `index.html`＋新增 `guoman-character-prompts.md`（素材提示詞，不影響程式）。發版等女角／守護獸素材到位一起。

- **守護獸顯眼化**：`#spiritPet` 84→110px；新增 `::before` 青玉靈氣光暈（radial-gradient＋`spiritAura` 呼吸動畫，與 `spiritFloat` 同 5.4s 週期）；睡眠時光暈調暗至 .22 不呼吸；reduced-motion 光暈停在 .6。
- **動圖支援**：`updateSpirit` 改為優先載 `assets/spirit-{stage}.webp`（動態貼圖），onerror 退回 `.png`，PNG 也缺才整個隱藏——之後丟動態 webp 進 assets/ 即生效，不用改程式。
- **素材提示詞**：`guoman-character-prompts.md` 收錄靈訊女角（斗破風性感**躺姿橫圖** 1536×768，美杜莎系＋雲韻系兩組）與守護獸三階段動態貼圖（512×512 無縫循環）提示詞。女角素材到位後需調 `.spirit-char` CSS（橫圖寬度上限、避免壓橫幅文字）。
- 驗證：inline JS 語法全過；Electron harness 5/5（webp 缺檔退 PNG、110px、光暈存在＋動畫運行）＋截圖。

## 2026-07-12（第十三批）— 星等篩選＋手動置頂（併第十～十二批發 v0.5.1）

只動 `index.html`（＋版本號）。本批與第十～十二批一起發 v0.5.1（十、十一批動過 main.js/preload.js，需重跑 electron-builder）。

- **星等篩選**：追蹤列表與完結作品工具列各加 `#starSelect`／`#finStarSelect`（全部星等／只看五星／四星以上／三星以上／未評分），共用 `starMatch(a,v)`（`'0'`＝未評分）。持久化 `v4_star`／`v4_finstar`。今日更新橫幅的「無篩選」條件加上 `curStar==='all'`。
- **手動置頂**：置頂狀態存 localStorage `pin_<user.id>`（比照 catMap/customOrder，**不動 DB schema**，跨裝置不同步是已知取捨）。`getTrackList` 在 `sortList` 之後做穩定排序 `isPinned(b)-isPinned(a)`——任何排序模式（含自訂拖曳）置頂都在最前、組內維持原順序。UI：封面左下圖釘鈕 `.pin-btn`（hover 顯示、置頂常駐金色，沿用 `.change-img-btn` 樣式模式；清單檢視隱藏）＋封面左上金色「置頂」徽章（走既有 `.card-badges` 機制）。`flipCard` 排除 `.pin-btn`；`dbDelete` 同步清 pinSet。
- 驗證：inline JS `node --check` 全過；Electron＋DRAFT_PREVIEW 測試 15/15（星等各檔位卡數、置頂排序／徽章／還原、完結頁篩選與空狀態文案）＋截圖比對。

## 2026-07-12（第十二批）— 守護獸功能化＋季度新番（未發版）

只動 `index.html`（本批**不動 main.js／preload.js**，不新增發版打包需求）。

- **靈符扇形選單**：點守護獸改為展開 5～6 張符紙（`.spirit-fu`，fixed 定位、JS 算半圓座標並夾邊）：「追」快速 +1 最近播放（`v4_last_played`）、「籤」求籤、「尋」搜尋（Ctrl+K）、「計」統計分頁、「語」聊兩句（原點擊台詞彩蛋移到這）、「備」立即備份（僅桌面版，直呼 `writeBackup`）。睡眠中點擊維持原「被吵醒」台詞、不開選單；貼近頂端往下開扇；外點／Escape 關閉。
- **通知使者**：`spiritLetter(txt,act)` 守護獸叼「信」徽章（`.spirit-letter`，pointerdown stopPropagation 避免觸發拖曳），點擊拆閱→吐字泡＋執行動作；佇列多封依序掛上。接線：`notifyToday`（改為線上版也走，Electron 才發原生通知；點信跳追蹤列表）、`autoBackup` 成功後叼信、自動更新 available 時吐字（原水墨更新卡**保留不動**）。守護獸不在（缺圖／窄螢幕隱藏）3 秒後退回 toast。
- **拖曳餵番**：`spiritFeedCheck`——把守護獸拖放到卡片上＝該番 +1（`elementsFromPoint` 命中 `.anime-card[data-id]`，排除守護獸自身）。完結番不吃、想看分類回「這部還沒開坑呢」、睡眠中回「明天再吃」。
- **親密度**：`v4_spirit_bond` 累積（選單動作 +1、餵番 +3、每日首開 +2，日增上限 10，`v4_bond_today` 記量）。四階：初識/相熟(40)/知音(120)/莫逆(300)；升階 toast＋吐字；title 顯示親密度；台詞池隨階擴充（`BOND_LINES`）；知音以上開選單 20% 機率翻滾（`spirit-flip`，reduced-motion 停用）。
- **季度新番一覽**：頁首新增「新」鈕，`openSeason()` 拉 Bangumi `GET /calendar`（記憶體快取），依放送日分組、**今日排最前**（高亮玉色）。每項封面／中文名／放送日＋「收入想看」→ `dbAdd`（想看分類、帶封面與更新日 `weekday.id%7`）；已在片單（比對 name/name_cn）顯示停用。日曆 API 無 `eps` 欄位，總集數留空。Escape／點背景關閉。
- 驗證：三段 inline script 語法全過；Electron iframe 測試（DRAFT_PREVIEW 樣本資料）截圖確認：扇形選單五符展開、語符吐字、叼信拆閱、親密度 title、想看卡婉拒餵食、新番面板（今日排序＋撞名停用）、Escape 全關，零 console 錯誤。真 Bangumi API 已實測回 7 天資料。
- 測試坑（勿再犯）：`show:false` 的 BrowserWindow 裡 CSS `animation` 不推進，`.modal-overlay` 的 `fadeIn` 會凍在 opacity 0——截圖驗 modal 必須 `show:true`（`backgroundThrottling:false` 也救不了）；iframe 內頂層 `let/const`（`anime`、`_seasonData`）非 window 屬性，要用 `contentWindow.eval` 才碰得到。

---

## 2026-07-12（第十一批）— 實用補強＋趣味加值（未發版）

六項：自動備份、Bangumi 一鍵同步、全域快捷鍵 +1（動 main.js＋preload.js）＋每日一筆、卡片墨痕等級、守護獸睡眠（index.html）。

- **自動備份（桌面版）**：`renderAll` 內 `autoBackup()`（`v4_backup_date` 日期守門，每日一次）→ IPC `backup:write` 寫 `userData/backups/anime-backup-YYYY-MM-DD.json`，main.js 輪替保留 14 份。統計頁底部 `#backupLine` 顯示上次備份＋「開啟備份資料夾」（`backup:open-dir`／shell.openPath）。payload 上限 50MB 防呆。
- **全域快捷鍵 +1（桌面版）**：main.js 註冊 `Ctrl+Alt+=`（try/catch，被占用靜默跳過；will-quit unregisterAll）→ `global:inc` → renderer 對 `v4_last_played`（launchUrl 時記錄）的未完結作品 incEp。preload 暴露 `onGlobalInc`。
- **Bangumi 一鍵同步**：共用 `bgmFindInfo(name)`（search top1→subject 詳情→總集數＋放送星期）。編輯 modal 總集數 label 旁「同步 Bangumi」鈕填 editTotal/editDay；統計頁「同步 Bangumi 集數」批次跑追蹤中（排除想看），每部間隔 400ms 節流，只在總集數有變時 dbUpdate，結束 toast 統計。
- **每日一筆**：header 新增 `#dailyLine`（36 句古風短句庫，依年中日輪換，點擊隨機抽），<1180px 隱藏。
- **卡片墨痕等級**：cardHTML 依 episode 加 class——50 集 `ink-t1` 泛青框、100 集 `ink-t2` 鎏金框、200 集 `ink-t3` 金框＋右上朱紋角飾。純 CSS，深淺主題都有。
- **守護獸睡眠**：23:00–07:00（子～卯時）`#spiritPet.sleeping`——浮動變 12s、降飽和、`::after` 冒 Zzz；點擊吵醒改抽 `SPIRIT_SLEEP_LINES` 不悅語。`spiritSleepCheck` 每 5 分鐘＋updateSpirit 後各跑一次。
- 驗證：main/preload `node --check`＋inline script 全過；截圖：墨痕分級正確（123→t2、38→無、169→t2）、每日一筆、睡眠 Zzz、編輯 modal 同步鈕、統計頁備份列。自動備份與全域快捷鍵的 IPC 端需真桌面版驗（offscreen 測試無 preload）。

## 2026-07-12（第十批）— 連結基礎功能優化（未發版）

使用者痛點：連結都是單一網站、每部手動貼。四項全選，只動 `index.html`。

- **link 欄位新相容格式**（不動 DB schema，TEXT 存多行）：單一網址（舊資料照舊）或多行「`站名|網址`」＝多來源；網址中 `{ep}` 播放時替換成「下一集」集數（`episode+1`）。核心：`parseLinks(a)`／`resolveLink(url,a)`。
- **openPlayer 重構**：拆出 `launchUrl(a,url)`（Electron viewer／web window.open 共用）。多來源→`showSourcePicker` 水墨小選單（顯示站名＋網域，{ep} 連結顯示「第 N 集」）；無連結→改走預設搜尋站。
- **預設搜尋站**：新增分頁底部「預設搜尋站（全域・選填）」輸入框，模板含 `{name}`，存 `localStorage v4_search_tpl`。無連結作品按播放＝用作品名搜尋，不再只報錯。
- **貼上網址智慧辨識**：`attachLinkSmart` 掛在 addLink/editLink（已改 textarea 多行）。貼上網址即顯示網域；path/query 末位數字（1–2999 才視為集數）建議一鍵「換成 {ep} 模板」。openEdit 填值後 dispatch input 刷新提示。
- **回寫保護（重要）**：viewer「最後停留網址」回寫 link 的機制，遇到多行或含 `{ep}` 的 link **不回寫**（`watchCtx.plainLink` 守門），否則會把多來源／模板整包蓋掉。
- 驗證：parseLinks/resolveLink 單元測試 4/4；截圖確認智慧提示＋一鍵換模板 toast、多來源選單（B站 第124集／巴哈）、搜尋 fallback。
- **測試坑**：測試腳本裡 `null.click()` 會讓 executeJavaScript rejection 懸住整個 electron 程序不退出——eval 一律用 `?.` 保護。

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
