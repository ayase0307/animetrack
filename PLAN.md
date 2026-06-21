# 追劇小幫手 v3 — 重構計畫

## 目標
1. 全新 UI/UX 設計（Glassmorphism 深色主題）
2. Supabase 雲端同步（可在任何裝置使用）
3. 功能優化（評分、進度條、備註、Toast 通知）

## 進度狀態

- [x] 讀取並分析 v2.2 原始碼
- [x] 建立 PLAN.md
- [x] 寫出 anime-tracker-v3.html（主體作業）
- [ ] 用戶執行 Supabase SQL 建立資料表
- [ ] 用戶測試登入 / 新增 / 同步功能
- [ ] 收集回饋後進行細部修正

---

## Supabase 設定（用戶需手動執行）

### 步驟 1：建立專案
前往 https://supabase.com → 新建免費專案

### 步驟 2：在 SQL Editor 執行以下 SQL

```sql
-- 建立資料表
CREATE TABLE public.anime_list (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    link TEXT,
    episode INTEGER DEFAULT 0 NOT NULL,
    total_episodes INTEGER,
    image_url TEXT,
    update_day TEXT,
    finished BOOLEAN DEFAULT FALSE NOT NULL,
    finished_date TIMESTAMPTZ,
    added_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT
);

-- 啟用 Row Level Security
ALTER TABLE public.anime_list ENABLE ROW LEVEL SECURITY;

-- 只有本人能存取自己的資料
CREATE POLICY "Users manage own anime" ON public.anime_list
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 自動更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_anime_list_updated_at
    BEFORE UPDATE ON public.anime_list
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 步驟 3：取得 API 金鑰
Supabase 專案 → Settings → API
- 複製 **Project URL**
- 複製 **anon public key**

---

## v3 新功能對比 v2.2

| 功能 | v2.2 | v3 |
|------|------|-----|
| 儲存 | localStorage（本機） | Supabase（雲端）+ localStorage 快取 |
| 通知 | `alert()` 彈窗 | Toast 通知（右上角滑入） |
| 評分 | ❌ | ✅ 1-5 星 |
| 總集數 | ❌ | ✅ 顯示進度條百分比 |
| 備註 | ❌ | ✅ 筆記欄位 |
| 統計頁 | ❌ | ✅ 看了幾集、平均評分、週排程 |
| 卡片設計 | 封面+文字分離 | Poster 風格（大圖+覆蓋資訊）|
| 刪除確認 | `confirm()` 彈窗 | 自訂確認 Modal |
| 預設分頁 | 新增 | 追蹤列表 |
| 排序選項 | 6 種 | 7 種（+評分排序） |
| 登入/登出 | ❌ | ✅ Email/Password |
| 同步狀態 | ❌ | ✅ Header 顯示 synced/syncing/offline |

---

## v4 重新設計（anime-tracker-v4.html）

視覺方向改為 **Cinematic Dark**：中性深底 + 單一珊瑚粉強調色，海報級卡片，emoji 圖示全改單線 SVG。v3 保留可比對。

### 修正的問題
- **HTML escape**：所有作品名稱經 `esc()` 處理，含 `"`/`<`/`&` 不再破版（修 XSS / 屬性破壞）。
- **Logo 外部化**：168KB 內嵌 base64 → `assets/logo.png`（單檔大幅瘦身）。
- **狀態持久化**：排序、更新日篩選、分類、檢視模式、完結頁排序都記入 localStorage。
- **完結頁**：新增搜尋與排序。
- **壓縮**：PNG 來源輸出 PNG 以保留透明背景。
- **快取**：localStorage 滿時改為「剝除 base64 圖片後再存」，不再整包清空。
- 其他：彈窗自動聚焦、`window.open` 被攔截時提示。

### 新增功能
- **拖曳排序**：排序選「自訂順序」即可拖曳卡片，順序記入 localStorage。
- **重複新增偵測**：新增同名作品時跳出確認。
- **分類標籤**：番劇 / 劇場版 / 想看清單，卡片標籤 + 篩選 chips。
- **鍵盤快捷鍵**：`/` 搜尋、`N` 新增、`1–4` 切分頁、`Esc` 關閉、`?` 說明。

### 分類的雲端同步（已啟用）
已執行 `ALTER TABLE public.anime_list ADD COLUMN category TEXT DEFAULT 'tv';`，v4 的分類現在**讀寫 DB `category` 欄位**，可跨裝置同步。

- 首次載入會自動把本機既有分類遷移上雲（`catmig_<uid>` 旗標，只跑一次）。
- 若 DB 沒有該欄位，會自動退回本機儲存（`dbHasCategory` 保護），不會壞。
- 匯出 JSON 含 `category`，匯入會一併寫回。
