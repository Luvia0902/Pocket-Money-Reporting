# 介面美化與設計資源指南

想要讓網頁看起來更專業、更具質感，不需要重建整個系統，通常只需要調整配色、間距與陰影即可。以下是一些非常實用的設計資源網站與優化建議：

## 1. 靈感來源 (Inspiration)
不知道該怎麼設計時，可以先參考別人的作品：
*   **[Dribbble](https://dribbble.com/)**: 全球頂尖設計師的作品集，搜尋 "Dashboard" 或 "Fintech App" 可以找到很多報帳系統的靈感。
*   **[Behance](https://www.behance.net/)**: 較完整的設計專案展示。
*   **[Mobbin](https://mobbin.com/)**: 收集真實 App 的截圖 (如 Uber, Airbnb)，參考大公司的介面設計。

## 2. 配色工具 (Colors)
顏色決定了第一印象：
*   **[Coolors](https://coolors.co/)**: 快速產生協調的配色方案。
*   **[Realtime Colors](https://www.realtimecolors.com/)**: 可以直接預覽配色在真實網頁上的效果。
*   **[Tailwind Colors](https://tailwindcss.com/docs/customizing-colors)**: 專業的 UI 色票系統 (目前的系統藍色即參考此色系)。

## 3. 圖示與插圖 (Icons & Illustrations)
*   **[FontAwesome](https://fontawesome.com/)**: 目前系統使用的圖示庫，經典且完整。
*   **[Heroicons](https://heroicons.com/)**: 風格較圓潤現代，適合簡約設計。
*   **[Undraw](https://undraw.co/)**: **強力推薦**！免費的扁平化插圖，可自訂顏色。適合放在「目前沒有報帳資料」的空白狀態，會讓系統看起來很不一樣。

## 4. 字型 (Typography)
*   **[Google Fonts](https://fonts.google.com/)**:
    *   繁體中文推薦：`Noto Sans TC` (思源黑體)
    *   英文數字推薦：`Inter`, `Roboto`, `Poppins` (數字顯示會很漂亮)

## 5. 具體的優化建議 (針對本系統)

如果您想自己動手修改 `css/style.css`，以下是幾個立竿見影的技巧：

### A. 增加「呼吸感」 (Whitespace)
不要把東西塞太擠。增加 `padding` (內距) 和 `margin` (外距)，讓內容有足夠的空間呼吸。
```css
/* 修改前 */
.card { padding: 10px; }

/* 修改後：看起來更高雅 */
.card { padding: 24px; }
```

### B. 優化陰影 (Shadows)
避免使用純黑色的陰影。使用帶有藍色或灰色的低透明度陰影，會讓介面看起來更乾淨。
```css
/* 高質感陰影範例 */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
```

### C. 圓角 (Border Radius)
現代 App 流行較大的圓角。
```css
/* 現代感圓角 */
--radius: 12px; /* 或 16px */
```

### D. 毛玻璃效果 (Glassmorphism)
我們目前的頂部導航欄已經使用了這個效果 (`backdrop-filter: blur(10px)`），您可以嘗試也應用在卡片背景上。

---

## 下一步您可以做的
如果您希望系統介面有大幅度的改變，建議可以嘗試引入 **CSS Framework** (如 TailwindCSS 或 Bootstrap)，或者讓設計師幫您出一張圖，我們再來實作。
