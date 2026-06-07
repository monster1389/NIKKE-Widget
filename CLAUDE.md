# Live2D Spine 角色展示服务

Express 服务，运行在 8090 端口，提供 Spine 角色动画展示页面供 iframe 嵌入。

## 目录结构

- `src/index.js` — Express 入口
- `views/` — EJS 模板
- `assets/` — 角色模型（每个角色一个文件夹，含 .skel .atlas .png）
- `public/spine-player/` — symlink → node_modules/@esotericsoftware/spine-player/dist/iife（已 gitignore）

## 命令

- 启动: `node src/index.js`
- PM2 启动: `pm2 start ecosystem.config.cjs`
- 端口: 8090

## 路由

- `GET /` — 角色列表首页
- `GET /:character` — 角色展示页（透明背景，iframe 嵌入）

## 角色页面参数

`GET /anis?animation=idle&loop=true&touch=action`

| 参数 | 默认 | 说明 |
|------|------|------|
| animation | idle | 待机动画 |
| loop | true | 待机循环 |
| touch | action | 点击播放的动画 |

## postMessage API

父页面通过 iframe postMessage 控制角色：

- `{ action: 'play', animation: 'delight' }` — 播放一次性动画
- `{ action: 'setIdle', animation: 'delight' }` — 切换待机动画
- `{ action: 'getAnimations' }` — 查询可用动画

角色页面发送 `ready`、`playing`、`ended` 事件给父页面。

## 添加新角色

在 `assets/` 下新建文件夹，放入 .skel .atlas .png 文件即可，服务会自动发现。
