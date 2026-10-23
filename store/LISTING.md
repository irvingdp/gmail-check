# Chrome 線上應用程式商店上架指南

上傳檔：`dist/gmail-require-to-1.0.0.zip`（用 `./build-zip.sh` 產生，只包含 manifest、content.js/css、_locales、icons 四個 PNG）。

---

## 1. 註冊開發人員帳戶（只需做一次）

1. 開 https://chrome.google.com/webstore/devconsole ，用要當發布者的 Google 帳號登入。
2. 同意開發人員協議，付一次性註冊費 US$5。
3. 在「帳戶」頁填發布者名稱、驗證聯絡用 email（沒驗證不能送審）。

## 2. 新增項目、上傳 zip

1. 開發人員資訊主頁 →「新增項目」→ 上傳 `gmail-require-to-1.0.0.zip`。
2. 名稱與簡短說明會自動從 manifest 讀出（英文為預設語言，另有繁體中文）。

## 3.「商店資訊」分頁

- **類別**：Productivity（生產力）→ Communication（通訊）
- **語言**：English（預設）。另外在右上角語言選單加「中文（繁體）」，貼中文版說明。
- **商店圖示**：`icons/icon128.png`（128×128）
- **螢幕截圖**（至少 1 張，1280×800 或 640×400）：
  - `store/screenshot-features-1280x800-en.png`（英文）/ `-zh.png`（中文）
  - 建議再加 1 張實際畫面：在 Gmail 撰寫郵件只填副本，讓「傳送」變灰並跳出紅色提示，截圖後裁成 1280×800。Mac 可用 ⌘+Shift+4 截圖，再用「預覽程式 → 工具 → 調整大小」。
- **小型宣傳圖塊**（440×280）：`store/promo-tile-440x280-en.png` / `-zh.png`
- **大型宣傳圖塊（1400×560）**：選填，可略過。
- **官方網址 / 首頁網址**：可留空。支援網址可留空，或填 GitHub repo（若改公開）。

### 詳細說明 — English

```
Ever sent an email with only CC or BCC filled in and nobody in To? Gmail Require To stops that from happening.

When the To field of a Gmail message is empty, this extension blocks sending, even if CC or BCC already have recipients.

What it does
• Greys out the Send button and shows a hint when To is empty
• Shows a red notice if you try to send anyway
• Also blocks Ctrl+Enter / ⌘+Enter, the schedule-send arrow, and pressing Enter on a focused Send button
• Works in multiple compose windows, pop-out windows, and inline reply / forward
• Detects the To field by Gmail's structure, not by text, so it works in any Gmail language

Privacy
• Runs only on mail.google.com
• Collects no data, makes no network requests, and needs no extra permissions
• Everything happens locally in your browser

If Gmail changes its layout and the To field can't be found, the extension lets the email through rather than blocking all sending.
```

### 詳細說明 — 繁體中文

```
曾經只填了「副本」或「密件副本」，卻忘了填「收件者」就把信寄出去嗎？「Gmail 收件者檢查」幫你擋下來。

在 Gmail 撰寫郵件時，只要「收件者」(To) 欄位是空的，就無法傳送，即使副本 / 密件副本已經有填。

功能
• 收件者為空時，「傳送」按鈕會變灰並顯示提示
• 若仍按下傳送，會跳出紅色提醒，不會寄出
• 同時擋下 Ctrl+Enter / ⌘+Enter、排程傳送的下拉箭頭，以及在傳送按鈕上按 Enter
• 支援多個撰寫視窗、彈出視窗，以及在信件中直接回覆 / 轉寄
• 依 Gmail 的頁面結構判斷收件者欄位，不依賴文字，任何介面語言都能用

隱私
• 只在 mail.google.com 執行
• 不收集任何資料、不發出任何網路請求、不需要額外權限
• 所有判斷都在你的瀏覽器內完成

如果 Gmail 改版導致找不到收件者欄位，擴充功能會放行而不是擋住，避免你完全無法寄信。
```

## 4.「隱私權」分頁（照貼即可）

**單一用途說明（Single purpose）**

```
Prevents sending a Gmail message when the To field is empty, even if CC or BCC have recipients.
```

**主機權限理由（Host permission justification）** — 針對 content script 的 `https://mail.google.com/*`

```
The extension's content script must run on mail.google.com to inspect the Gmail compose window locally, check whether the To field has a recipient, and disable the Send button and keyboard shortcut when it is empty. It runs on no other site. No page content is stored or transmitted.
```

**是否使用遠端程式碼（Remote code）**：選「否，我未使用遠端程式碼」。

**資料使用（Data usage）**：所有資料類型都**不要勾**（不收集任何使用者資料）。下方三個聲明全部勾選：
- 我不會將使用者資料販售或轉讓給第三方…
- 我不會將使用者資料用於與項目單一用途無關的用途…
- 我不會將使用者資料用於判斷信用度或放款…

**隱私權政策網址**：`https://irvingdp.github.io/gmail-check/site/privacy.html`（GitHub Pages 從 main 分支根目錄發布）。

## 5.「發布」分頁

- **可見度**：「公開」(Public)；只想給特定人用可選「不公開」(Unlisted，有連結才能安裝)。
- **發布地區**：全部地區。
- 可勾「審核通過後自動發布」，或審完後手動按發布。

## 6. 送審

1. 右上角「送交審查」。如有欄位沒填，會在左側分頁顯示紅點。
2. 審核通常數天內完成（只有一個 content script、沒有額外權限，通常較快）。結果會寄到開發人員 email。
3. 之後要更新：改 `manifest.json` 的 `version`（例如 1.0.1）→ `./build-zip.sh` → 在「套件」分頁上傳新 zip → 再次送審。
