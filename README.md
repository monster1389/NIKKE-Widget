# Live2D Spine 角色展示服务

端口 8090，提供 Spine 角色动画展示页面。

## 路由

- `GET /` — 角色列表首页
- `GET /:character` — 角色展示页（透明背景，iframe 嵌入）
- `GET /embed/:character.js` — 生成自执行 JS 脚本，供父页面直接 DOM 嵌入

CORS 已启用（`Access-Control-Allow-Origin: *`）。

## 嵌入方式

### 直接嵌入（推荐，无白底）

```html
<div id="live2d-widget"></div>
<script src="http://rpi:8090/public/spine-player/spine-player.js"></script>
<script src="http://rpi:8090/embed/anis.js?animation=idle&loop=true&touch=action"></script>
```

embed 脚本自动在 `#live2d-widget` 内初始化角色，并发送 `size` 事件告知角色原始尺寸。

### iframe 嵌入

`<iframe src="http://rpi:8090/anis?animation=idle&loop=true&touch=action">`

注意：浏览器视口默认白色，iframe 内透明无法穿透，会显示白底。

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

角色发送的事件：

| type | 字段 | 说明 |
|------|------|------|
| size | width, height | 角色原始包围盒尺寸 |
| ready | animations | 初始化完成，可用动画列表 |
| playing | animation | 开始播放一次性动画 |
| ended | animation | 一次性动画播放完毕 |

## 启动

```bash
pm2 start ecosystem.config.cjs
pm2 startup
pm2 save
```
