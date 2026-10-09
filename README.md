# 102401118-102401115

校园寻物——校园失物招领 Web 系统。

## 功能

- 浏览、搜索和筛选寻物/招领信息
- 查看详情和发布者联系方式
- 发布寻物或招领信息
- 在“我的发布”中编辑、删除和更新本人信息
- 寻物标记“已找到”，招领标记“已归还”
- 使用站内独立编辑页面，不弹出浏览器输入框

## 目录说明

```text
index.html                 主页面和编辑页面
css/style.css              页面样式
js/data.js                 localStorage 数据读写
js/app.js                  页面交互和业务逻辑
tests/test.html            浏览器测试入口
tests/browser-test.js      浏览器测试代码
tests/ownership-test.cjs   Node 逻辑测试
.github/workflows/test.yml GitHub Actions 自动测试
```

## 运行方法

保持目录结构不变，使用 Google Chrome 打开根目录的 `index.html`，即可直接运行主网页，不需要安装前端框架。

发布信息后可在“我的发布”中进入独立编辑页。数据保存在当前浏览器的 `localStorage` 中，不会跨浏览器或跨设备同步。

## 浏览器测试方法

测试页通过 iframe 加载主网页。由于 Chrome 会限制直接使用 `file://` 打开的测试页访问 iframe，`tests/test.html` 不建议直接双击打开，应通过本地 HTTP 服务器运行。

在项目根目录打开 PowerShell，执行：

```powershell
python -m http.server 8000
```

然后在 Chrome 打开：

```text
http://localhost:8000/tests/test.html
```

点击“开始测试”即可运行 10 个浏览器测试。

## Node 测试

Node 逻辑测试可在项目根目录执行：

```bash
node tests/ownership-test.cjs
```

GitHub Actions 会检查 JavaScript 语法、运行 Node 逻辑测试，并使用 Chromium 自动运行浏览器界面测试。浏览器测试也可在本地按上面的方式手动运行。
