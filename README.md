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

保持目录结构不变，使用 Google Chrome 打开根目录的 index.html，不需要安装前端框架。发布信息后可在“我的发布”中进入独立编辑页。数据保存在当前浏览器的 localStorage 中，不跨设备同步。

## 测试方法

使用 Chrome 打开 tests/test.html，点击“开始测试”。页面测试覆盖搜索、筛选、发布、空联系方式、独立编辑、取消编辑以及两种完成状态。Node 逻辑测试可在项目根目录执行：

```bash
node tests/ownership-test.cjs
```

GitHub Actions 会检查 JavaScript 语法并运行 Node 逻辑测试；浏览器页面测试需要在 Chrome 中手动运行。