# NIKKE 看板娘

Live2D Spine 角色展示服务，默认端口 8090（可在 `config.js` 修改）。

## 主要功能

- Spine 角色动画展示页面，透明背景
- 角色间导航（箭头 + 拖动）、皮肤切换（顶部胶囊条）、动画栏（底部胶囊条）
- postMessage API 供父页面控制角色动画和皮肤
- 域名访问只读，本地/内网可管理角色
- 自动生成角色预览图
- GameKee 角色资源抓取

## 快速开始

### 启动

端口等配置在 `config.js` 中修改，也支持环境变量 `PORT`、`ASSETS_DIR`、`CHROMIUM_PATH`、`ALLOW_HOSTS`。

```bash
node src/server.js                          # 直接启动
pm2 start ecosystem.config.cjs              # PM2 守护
```

### 嵌入方式

**直接嵌入（推荐，无白底）：**

```html
<div id="live2d-widget" style="position:fixed;bottom:16px;right:16px;width:240px;height:350px"></div>
<script src="http://rpi:8090/embed/anis.js?animation=idle&loop=true&touch=action"></script>
```

embed 脚本自动加载依赖、初始化角色、注入关闭/恢复按钮，并发送 `size` 事件告知角色原始尺寸。

**iframe 嵌入：**

`<iframe src="http://rpi:8090/anis?animation=idle&loop=true&touch=action">`

注意：浏览器视口默认白色，iframe 内透明无法穿透，会显示白底。

### 角色管理

首页每张卡片右下角有重命名（✏）和删除（🗑）按钮，顶部有抓取表单。域名访问时这些控件隐藏。

### 角色展示页

- 左右边缘箭头切换角色（首尾循环）
- 鼠标按住页面左右拖动切换角色
- 顶部皮肤栏切换皮肤（如武器显隐），默认选含 "acc" 的皮肤
- 底部动画栏点击播放动画，点击角色 canvas 触发 action
- 右下角显示当前位置（如"角色 3/13 · 皮肤 1/2"）

### 抓取角色

**Web 方式（推荐）：** 在首页顶部表单填入 GameKee URL 和角色名，点击下载即可。实时显示下载进度，完成后自动生成预览图并刷新页面。

**CLI 方式：**

```bash
node scripts/scrape-spine.js <gamekee-url> <character-name>
# 例: node scripts/scrape-spine.js https://www.gamekee.com/nikke/tj/703135.html anis
```

抓取后放入 `assets/`，服务自动发现。

## 路由

| 路由 | 说明 |
|------|------|
| `GET /` | 角色列表首页 |
| `GET /:character` | 角色展示页（透明背景） |
| `GET /embed/:character.js` | 自执行 JS 脚本，供父页面直接 DOM 嵌入 |
| `POST /api/scrape` | SSE 端点，抓取 GameKee 角色 |
| `DELETE /api/characters/:name` | 删除角色 |
| `PUT /api/characters/:name` | 重命名角色 |

CORS 已启用。POST/DELETE/PUT 在域名访问时返回 403。

## 域名访问只读

通过 `config.js` 中 `allowHosts` 控制（支持通配符 `*`），无点号主机名（如 `rpi`）始终允许写操作。环境变量 `ALLOW_HOSTS` 可逗号分隔覆盖。

## 角色页面参数

`GET /:character?animation=idle&loop=true&touch=action`

| 参数 | 默认 | 说明 |
|------|------|------|
| animation | idle | 待机动画 |
| loop | true | 待机循环 |
| touch | action | 点击播放的动画 |

## Embed 脚本参数

`GET /embed/:character.js?controls=true&targetHeight=400&animation=idle&loop=true&touch=action`

| 参数 | 默认 | 说明 |
|------|------|------|
| controls | true | 显示关闭（×）和恢复（○）按钮 |
| targetHeight | 自动（桌面 400 / 移动 250） | 角色缩放目标高度（px） |
| animation | idle | 初始待机动画 |
| loop | true | 待机动画是否循环 |
| touch | action | 点击播放的动画 |

## postMessage API

父页面发送：

- `{ action: 'play', animation: 'delight' }` — 播放一次性动画
- `{ action: 'setIdle', animation: 'delight' }` — 切换待机动画
- `{ action: 'getAnimations' }` — 查询可用动画
- `{ action: 'setSkin', index: 1 }` 或 `{ action: 'setSkin', name: 'acc' }` — 切换皮肤
- `{ action: 'nextSkin' }` / `{ action: 'prevSkin' }` — 循环切换皮肤
- `{ action: 'getSkins' }` — 查询皮肤列表

角色发送的事件：

| type | 字段 | 说明 |
|------|------|------|
| size | width, height | 角色原始包围盒尺寸 |
| ready | animations, skins | 初始化完成 |
| playing | animation | 开始播放一次性动画 |
| ended | animation | 一次性动画播放完毕 |

## 配置

`config.js`：

| 配置 | 环境变量 | 默认 | 说明 |
|------|------|------|------|
| port | PORT | 8090 | 监听端口 |
| assetsDir | ASSETS_DIR | assets/ | 角色资源目录 |
| chromiumFallback | CHROMIUM_PATH | null | Chromium 路径 |
| allowHosts | ALLOW_HOSTS | localhost, 内网 IP 段 | 允许写操作的主机模式 |

## 贡献

欢迎提交 Issue 和 Pull Request。
