# Live2D Spine 角色展示服务

Express 服务，运行在 8090 端口，提供 Spine 角色动画展示页面供 iframe 嵌入。

## 目录结构

- `src/index.js` — Express 入口
- `views/` — EJS 模板
- `assets/` — 角色模型（每个角色一个文件夹，含 .skel .atlas .png）
- `public/spine-player/` — symlink → node_modules/spine-web-player/dist/

## 命令

- 启动: `node src/index.js`
- PM2 启动: `pm2 start ecosystem.config.cjs`
- 端口: 8090

## 添加新角色

在 `assets/` 下新建文件夹，放入 .skel .atlas .png 文件即可，服务会自动发现。
