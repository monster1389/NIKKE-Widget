# Live2D Spine 角色展示服务

端口 8090，提供 Spine 角色动画展示页面。

## 路由

- `GET /` — 角色列表首页
- `GET /:character` — 角色展示页（透明背景）

## 角色页面参数

`GET /anis?animation=idle&loop=true&touch=touch`

| 参数 | 默认 | 说明 |
|------|------|------|
| animation | 模型首个动画 | 待机动画 |
| loop | true | 待机循环 |
| touch | touch | 点击播放的动画 |

## postMessage API

父页面可通过 iframe postMessage 控制角色：

- `{ action: 'play', animation: 'delight' }` — 播放一次性动画
- `{ action: 'setIdle', animation: 'delight' }` — 切换待机动画
- `{ action: 'getAnimations' }` — 查询可用动画

角色页面会发送 `ready`、`playing`、`ended` 事件给父页面。

## 启动

```bash
pm2 start ecosystem.config.cjs
pm2 startup
pm2 save
```
