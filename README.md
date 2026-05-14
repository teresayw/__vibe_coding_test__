# 霓虹貪食蛇

一個使用 React、TypeScript 與 Canvas 建構的 霓虹風格貪食蛇遊戲。

## 本地啟動

**前置需求:** Node.js

1. 安裝相依套件
   `npm install`
2. 啟動開發伺服器
   `npm run dev`

開啟瀏覽器並前往 `http://localhost:3000`。

## GitHub Pages 部署

此專案已設定 GitHub Actions 自動部署到 GitHub Pages。當 `main` 分支有新的 push 時，工作流程會自動建置並部署 `dist` 資料夾。

部署網址：`https://teresayw.github.io/__VIBE_CODING_TEST__/`

> Vite 的 `base` 已設定為 `/__VIBE_CODING_TEST__/`，確保資源路徑在 GitHub Pages 上正確載入。
