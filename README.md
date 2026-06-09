# NIKKE 看板娘

Live2D Spine 角色展示服务。默认端口 8090，配置在 `config.js`。

## 快速开始

```bash
node src/server.js                    # 直接启动
# 或
pm2 start ecosystem.config.cjs        # PM2 守护
```

环境变量: `PORT`、`ASSETS_DIR`、`CHROMIUM_PATH`、`ALLOW_HOSTS`。

## 嵌入方式

**直接嵌入（推荐，透明背景）：**

```html
<div id="live2d-widget" style="position:fixed;bottom:16px;right:16px;width:240px;height:350px"></div>
<script src="http://localhost:8090/embed/anis.js?animation=idle&loop=true&touch=action"></script>
```

脚本自动加载依赖、注入关闭/恢复/切换按钮、适配容器尺寸。

**iframe 嵌入：** `<iframe src="http://localhost:8090/anis">`（会有白底，直接嵌入无此问题）

### Embed 参数

| 参数 | 默认 | 说明 |
|------|------|------|
| animation | idle | 初始待机动画 |
| loop | true | 待机循环 |
| touch | action | 点击播放动画 |
| controls | true | 显示控制按钮 |
| targetHeight | 自动(桌面400/移动250) | 角色高度(px) |

## postMessage API

父页面通过 postMessage 控制角色：

- `{ action: 'play', animation: 'delight' }` — 播放一次
- `{ action: 'setIdle', animation: 'delight' }` — 切换待机
- `{ action: 'setSkin', index: 1 }` / `{ action: 'setSkin', name: 'acc' }` — 切换皮肤
- `{ action: 'nextSkin' }` / `{ action: 'prevSkin' }` — 循环皮肤
- `{ action: 'getAnimations' }` / `{ action: 'getSkins' }` — 查询

角色发送的事件：`size`（尺寸）、`ready`（就绪）、`playing`（播放中）、`ended`（播放完）。

## 角色管理

- `GET /` — 首页，可视化管理角色（本地访问时）
- `POST /api/scrape` — 输入 GameKee URL 抓取角色
- `DELETE /api/characters/:name` — 删除
- `PUT /api/characters/:name` — 重命名

域名访问时写操作返回 403。`config.allowHosts` 控制白名单，支持通配符。

## 配置

`config.js`：

| 配置 | 环境变量 | 默认 |
|------|------|------|
| port | PORT | 8090 |
| assetsDir | ASSETS_DIR | assets/ |
| chromiumFallback | CHROMIUM_PATH | null |
| allowHosts | ALLOW_HOSTS | localhost, 内网 IP 段 |
