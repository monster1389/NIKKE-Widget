# NIKKE 看板娘

Live2D Spine 角色展示服务，默认端口 8090（可在 `config.js` 修改）。

## 主要功能

- Spine 角色动画展示页面
- postMessage API 供父页面控制角色动画
- 自动生成角色预览图
- GameKee 角色资源抓取

## 快速开始

### 启动

端口等配置在 `config.js` 中修改，也支持环境变量 `PORT`。

```bash
node src/index.js                          # 直接启动
pm2 start ecosystem.config.cjs             # PM2 守护
```

### 嵌入方式

**直接嵌入（推荐，无白底）：**

```html
<div id="live2d-widget" style="width:240px;height:350px"></div>
<script src="http://rpi:8090/public/spine-player/spine-player.js"></script>
<script src="http://rpi:8090/embed/anis.js?animation=idle&loop=true&touch=action"></script>
```

embed 脚本自动在 `#live2d-widget` 内初始化角色，并发送 `size` 事件告知角色原始尺寸。

**iframe 嵌入：**

`<iframe src="http://rpi:8090/anis?animation=idle&loop=true&touch=action">`

注意：浏览器视口默认白色，iframe 内透明无法穿透，会显示白底。

### 抓取角色

```bash
node scripts/scrape-spine.js <gamekee-url> <character-name>
# 例: node scripts/scrape-spine.js https://www.gamekee.com/nikke/tj/703135.html anis
```

抓取后自动按皮肤分文件夹放入 `assets/`，服务自动发现。

## 路由

| 路由 | 说明 |
|------|------|
| `GET /` | 角色列表首页 |
| `GET /:character` | 角色展示页（透明背景，iframe 嵌入） |
| `GET /embed/:character.js` | 自执行 JS 脚本，供父页面直接 DOM 嵌入 |

CORS 已启用。

### 角色页面参数

`GET /:character?animation=idle&loop=true&touch=action`

| 参数 | 默认 | 说明 |
|------|------|------|
| animation | idle | 待机动画 |
| loop | true | 待机循环 |
| touch | action | 点击播放的动画 |

### postMessage API

父页面发送：

- `{ action: 'play', animation: 'delight' }` — 播放一次性动画
- `{ action: 'setIdle', animation: 'delight' }` — 切换待机动画
- `{ action: 'getAnimations' }` — 查询可用动画

角色发送的事件：

| type | 字段 | 说明 |
|------|------|------|
| size | width, height | 角色原始包围盒尺寸 |
| ready | animations | 初始化完成 |
| playing | animation | 开始播放一次性动画 |
| ended | animation | 一次性动画播放完毕 |

## 贡献

欢迎提交 Issue 和 Pull Request。
