# Live2D Spine 角色展示服务

Express 服务，默认端口 8090（`config.js` 可改），提供 Spine 角色动画展示页面供 iframe 嵌入或直接 DOM 嵌入。

> **规则**: 不提交 `docs/superpowers/` 目录下的设计文档和计划文档（已在 .gitignore）。设计讨论直接写到本文件。

## 目录结构

- `config.js` — 端口等配置
- `src/index.js` — Express 入口
- `src/get-characters.js` — 角色目录扫描
- `src/preview-generator.js` — Puppeteer 自动生成角色预览图
- `src/puppeteer-launcher.js` — 共享的浏览器启动配置
- `views/` — EJS 模板（`player-core.ejs` 为共享 SpinePlayer 逻辑）
- `scripts/scrape-spine.js` — GameKee 爬虫 CLI
- `assets/` — 角色模型（每个角色一个文件夹，含 .skel .atlas .png）
- `public/spine-player/` — symlink → node_modules/@esotericsoftware/spine-player/dist/iife（已 gitignore）

## 命令

- 启动: `node src/index.js`
- PM2 启动: `pm2 start ecosystem.config.cjs`
- 端口改 `config.js`

## 路由

- `GET /` — 角色列表首页
- `GET /:character` — 角色展示页（透明背景，iframe 嵌入，左上角返回按钮）
- `GET /embed/:character.js` — 生成自执行 JS 脚本，供父页面直接嵌入（无 iframe，解决白底问题）
- `POST /api/scrape` — SSE 端点，接收 `{ url, name }` 抓取 GameKee 角色

## Web 抓取功能

首页顶部表单填入 GameKee URL 和角色名，点击下载按钮。

**流程**: 后端 `src/scraper.js` 调用 Puppeteer 抓取 Spine 文件 → SSE 实时推送进度 → 完成后自动调用 `generatePreviews` 生成预览 → 1s 后页面自动刷新。

**SSE 事件格式**: `data: {"step":"...","message":"..."}`

步骤: `browser` → `page` → `skins` → `download` → `preview` → `done`，错误时 `step: "error"`。

**并发控制**: 同一时间只允许一个抓取任务（全局 flag），第二个返回 409。

## 嵌入方式

### 方式一：直接嵌入（推荐）

父页面加载 spine-player.js 和 embed 脚本，直接在页面 DOM 中创建角色：

```html
<div id="live2d-widget" style="width:240px;height:350px"></div>
<script src="http://rpi:8090/public/spine-player/spine-player.js"></script>
<script src="http://rpi:8090/embed/anis.js?animation=idle&loop=true&touch=action"></script>
```

脚本自动在 `#live2d-widget` 容器内初始化角色，并向父页面发送 `size` 事件告知角色原始尺寸，父页面可按需动态调整容器大小。无 iframe 视口，透明背景直达父页面。

### 方式二：iframe（有白底限制）

`<iframe src="http://rpi:8090/anis?animation=idle&loop=true&touch=action">`

浏览器视口默认白色，iframe 透明无法穿透。

## 角色页面参数

`GET /anis?animation=idle&loop=true&touch=action`

| 参数 | 默认 | 说明 |
|------|------|------|
| animation | idle | 待机动画 |
| loop | true | 待机循环 |
| touch | action | 点击播放的动画 |

## postMessage API

父页面通过 postMessage 控制角色（iframe 和直接嵌入均支持）：

- `{ action: 'play', animation: 'delight' }` — 播放一次性动画
- `{ action: 'setIdle', animation: 'delight' }` — 切换待机动画
- `{ action: 'getAnimations' }` — 查询可用动画

角色发送给父页面的事件：

- `{ type: 'size', width, height }` — 角色原始包围盒尺寸（直接嵌入时用于动态调容器大小）
- `{ type: 'ready', animations }` — 初始化完成，animations 为可用动画列表
- `{ type: 'playing', animation }` — 开始播放一次性动画
- `{ type: 'ended', animation }` — 一次性动画播放完毕

## 添加新角色

1. **Web 抓取**: 首页表单填入 GameKee URL + 角色名，一键下载
2. **手动**: 在 `assets/` 下新建文件夹，放入 .skel .atlas .png 文件，服务自动发现
