# Live2D Spine 角色展示服务

Express 服务，默认端口 8090（`config.js` 可改），提供 Spine 角色动画展示页面供 iframe 嵌入或直接 DOM 嵌入。

> **规则**: 不提交 `docs/superpowers/` 目录下的设计文档和计划文档（已在 .gitignore）。

## 目录结构

```
src/
├── server.js                  # Express 启动，只管 listen
├── app.js                     # Express 实例创建 + 中间件挂载
├── routes/
│   ├── pages.js               # GET / 首页, GET /:character 角色页
│   ├── embed.js               # GET /embed/:character.js
│   └── api.js                 # POST /api/scrape, DELETE/PUT /api/characters
├── services/
│   ├── character-service.js   # 扫描、缓存、删除、重命名
│   ├── scraper-service.js     # GameKee 爬虫
│   └── preview-service.js     # 预览图生成
├── middleware/
│   ├── cors.js
│   ├── domain-guard.js        # 域名访问只读检测，通过 config.allowHosts 判断
│   └── error-handler.js
└── lib/
    ├── download-file.js       # 纯 HTTP 下载函数
    └── puppeteer-launcher.js  # Chromium 自动发现 + 启动

public/js/
└── player-core.js             # SpinePlayer 核心逻辑（纯 JS，通过 data-* 属性配置）

views/
├── home.ejs                   # 首页 + 角色管理按钮（域名访问时隐藏）
├── character.ejs              # 角色展示页 + 角色导航 + 皮肤栏 + 动画栏
└── embed.ejs                  # 嵌入脚本（内联 player-core.js）

scripts/scrape-spine.js        # GameKee 爬虫 CLI
assets/                        # 角色模型（每个角色一个文件夹）
```

## 命令

- 启动: `node src/server.js`
- PM2 启动: `pm2 start ecosystem.config.cjs`
- 测试: `npx vitest run`

## 路由

- `GET /` — 角色列表首页（本地访问时可删除、重命名、下载角色；域名访问只读）
- `GET /:character` — 角色展示页（透明背景，角色导航 + 皮肤切换 + 动画栏）
- `GET /embed/:character.js` — 生成自执行 JS 脚本，供父页面直接嵌入
- `POST /api/scrape` — SSE 端点，抓取 GameKee 角色（域名访问返回 403）
- `DELETE /api/characters/:name` — 删除角色（域名访问返回 403）
- `PUT /api/characters/:name` — 重命名角色 `{ newName: "xxx" }`（域名访问返回 403）

## 域名访问只读

通过中间件 `domain-guard.js` 检测访问来源。`config.js` 中 `allowHosts` 配置允许写操作的主机模式（支持通配符 `*`），无点号主机名（如 `rpi`）始终允许。

环境变量 `ALLOW_HOSTS` 可逗号分隔覆盖，如 `ALLOW_HOSTS=myhost,192.168.*`。

## 角色展示页控件

- **角色导航**: 页面左右边缘箭头按钮（`<` `>`）切换上一个/下一个角色，首尾循环；也可按住页面任意位置（动画栏除外）左右拖动切换
- **皮肤栏**: 页面顶部居中胶囊条，列出皮肤名称（如 default、acc）。点击切换皮肤，当前选中高亮。只有 1 个皮肤时自动隐藏
- **动画栏**: 页面底部居中胶囊条，列出除 idle/action 外的所有动画。鼠标滚轮/拖动滚动。点击播放一遍回 idle。点击角色 canvas → 播放 action（可打断重放）

## Web 抓取功能

首页顶部表单填入 GameKee URL 和角色名，点击下载按钮。域名访问时表单隐藏。

**流程**: 后端 `src/services/scraper-service.js` 调用 Puppeteer 抓取 Spine 文件 → SSE 实时推送进度 → 完成后自动生成预览 → 1s 后页面自动刷新。

**SSE 事件格式**: `data: {"step":"...","message":"..."}`

步骤: `browser` → `page` → `skins` → `download` → `preview` → `done`，错误时 `step: "error"`。

**并发控制**: 同一时间只允许一个抓取任务（全局 flag），第二个返回 409。

## 嵌入方式

只需两行代码，embed 脚本自动处理 CSS 注入、按钮创建、依赖加载、角色初始化和容器尺寸适配。

```html
<div id="live2d-widget" style="position:fixed;bottom:16px;right:16px"></div>
<script src="http://rpi:8090/embed/anis.js?controls=true&targetHeight=400&animation=idle&loop=true&touch=action"></script>
```

`#live2d-widget` 容器由父页面控制位置和初始大小，其余全部由脚本自动完成。

**透明背景**: 无 iframe 视口，角色透明背景直达父页面（canvas alpha + premultipliedAlpha）。

## Embed 脚本参数

`GET /embed/:character.js?controls=true&targetHeight=400&animation=idle&loop=true&touch=action`

| 参数 | 默认 | 说明 |
|------|------|------|
| controls | true | 显示关闭（×）和恢复（○）按钮 |
| targetHeight | 自动（桌面 400 / 移动 250） | 角色缩放目标高度（px） |
| animation | idle | 初始待机动画 |
| loop | true | 待机动画是否循环 |
| touch | action | 点击播放的动画 |

## player-core.js 配置

通过容器 `data-*` 属性传配置，不再用 EJS 编译 JS：

```html
<div id="container"
     data-skels="/assets/xxx/xxx.skel"
     data-atlas="/assets/xxx/xxx.atlas"
     data-animation="idle"
     data-loop="true"
     data-touch="action"
     data-viewport="padded"
     data-send-size="false">
</div>
```

| 属性 | 说明 |
|------|------|
| data-skels | .skel 文件 URL |
| data-atlas | .atlas 文件 URL |
| data-animation | 初始待机动画（默认 idle） |
| data-loop | 待机是否循环（默认 true） |
| data-touch | 点击播放的动画（默认 action） |
| data-viewport | padded（20% margin 居中）或 raw（精确包围盒） |
| data-send-size | 是否 postMessage 发送角色尺寸 |

默认皮肤选择名称含 "acc" 的（不区分大小写），找不到则选第一个。

## postMessage API

父页面通过 postMessage 控制角色（iframe 和直接嵌入均支持）：

- `{ action: 'play', animation: 'delight' }` — 播放一次性动画
- `{ action: 'setIdle', animation: 'delight' }` — 切换待机动画
- `{ action: 'getAnimations' }` — 查询可用动画
- `{ action: 'setSkin', index: 1 }` — 按索引切换皮肤
- `{ action: 'setSkin', name: 'acc' }` — 按名称切换皮肤
- `{ action: 'nextSkin' }` / `{ action: 'prevSkin' }` — 循环切换皮肤
- `{ action: 'getSkins' }` — 查询皮肤列表

角色发送给父页面的事件：

- `{ type: 'size', width, height }` — 角色原始包围盒尺寸（直接嵌入时用于动态调容器大小）
- `{ type: 'ready', animations, skins }` — 初始化完成
- `{ type: 'playing', animation }` — 开始播放一次性动画
- `{ type: 'ended', animation }` — 一次性动画播放完毕

## 添加新角色

1. **Web 抓取**: 首页表单填入 GameKee URL + 角色名，一键下载（仅本地/允许主机）
2. **手动**: 在 `assets/` 下新建文件夹，放入 .skel .atlas .png 文件，服务自动发现
