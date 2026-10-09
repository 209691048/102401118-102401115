"use strict";

(function () {
    const STORAGE_KEY = "campusLostFoundItems";
    const frame = document.getElementById("appFrame");
    const runButton = document.getElementById("runTests");
    const summary = document.getElementById("summary");
    const results = document.getElementById("results");
    const details = document.getElementById("details");

    // 保存测试前的数据，测试结束后恢复。
    const originalStorage = localStorage.getItem(STORAGE_KEY);

    const sampleItems = [
        {
            id: 1,
            title: "黑色校园卡",
            type: "寻物",
            location: "第一教学楼",
            date: "2026-10-06",
            description: "遗失黑色校园卡",
            icon: "💳",
            status: "待处理"
        },
        {
            id: 2,
            title: "蓝色水杯",
            type: "招领",
            location: "图书馆",
            date: "2026-10-05",
            description: "捡到蓝色水杯",
            icon: "🥤",
            status: "待处理"
        },
        {
            id: 3,
            title: "黑色钥匙",
            type: "寻物",
            location: "学生宿舍区",
            date: "2026-10-04",
            description: "遗失一串钥匙",
            icon: "🔑",
            status: "待处理"
        },
        {
            id: 4,
            title: "白色耳机",
            type: "招领",
            location: "食堂",
            date: "2026-10-03",
            description: "捡到白色耳机",
            icon: "🎧",
            status: "待处理"
        }
    ];

    let passed = 0;
    let failed = 0;
    let running = false;

    function assert(condition, message) {
        if (!condition) {
            throw new Error(message || "断言失败");
        }
    }

    function cloneItems(items) {
        return JSON.parse(JSON.stringify(items));
    }

    function readSavedItems() {
        const value = localStorage.getItem(STORAGE_KEY);
        return value ? JSON.parse(value) : [];
    }

    function findSavedItem(id) {
        return readSavedItems().find(function (item) {
            return Number(item.id) === Number(id);
        });
    }

    function getAppDocument(win) {
        return win.document;
    }

    function loadApp(items) {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(cloneItems(items))
        );

        return new Promise(function (resolve, reject) {
            const timeout = setTimeout(function () {
                reject(new Error("加载校园寻物页面超时"));
            }, 10000);

            frame.onload = function () {
                clearTimeout(timeout);

                try {
                    const win = frame.contentWindow;

                    // 替换弹窗接口，避免自动化测试被弹窗打断。
                    win.alert = function () {};
                    win.confirm = function () {
                        return true;
                    };
                    win.prompt = function () {
                        return null;
                    };

                    resolve(win);
                } catch (error) {
                    reject(error);
                }
            };

            frame.src = "../index.html?test=" + Date.now();
        });
    }

    function clickCategory(doc, type) {
        const button = doc.querySelector(
            '.category-btn[data-type="' + type + '"]'
        );

        assert(button, "找不到分类按钮：" + type);
        button.click();
    }

    function fillRequiredFields(doc, title) {
        doc.getElementById("itemTitle").value = title;
        doc.getElementById("itemType").value = "寻物";
        doc.getElementById("itemLocation").value = "图书馆";
        doc.getElementById("itemDate").value = "2026-10-09";
        doc.getElementById("itemDescription").value =
            "这是自动化测试创建的物品信息";
        doc.getElementById("itemContactName").value = "测试用户";
        doc.getElementById("itemContact").value = "test@example.com";
    }

    function showResult(name, error) {
        const li = document.createElement("li");

        if (error) {
            failed += 1;
            li.className = "fail";
            li.textContent = "❌ " + name + "： " + error.message;
            details.textContent +=
                name + "\n" + (error.stack || error.message) + "\n\n";
        } else {
            passed += 1;
            li.className = "pass";
            li.textContent = "✅ " + name + "：通过";
        }

        results.appendChild(li);
        summary.textContent =
            "已完成 " + (passed + failed) + " 项，" +
            "通过 " + passed + " 项，失败 " + failed + " 项。";
    }

    async function runCase(name, callback) {
        try {
            await callback();
            showResult(name, null);
        } catch (error) {
            showResult(name, error);
        }
    }

    async function runAllTests() {
        if (running) return;

        running = true;
        runButton.disabled = true;
        results.innerHTML = "";
        details.textContent = "";
        passed = 0;
        failed = 0;
        summary.textContent = "正在运行测试……";

        try {
            // 测试1：初始化并显示物品。
            await runCase("测试1：首页初始数据", async function () {
                const win = await loadApp(sampleItems);
                const doc = getAppDocument(win);
                const cards = doc.querySelectorAll("#itemList .item-card");

                assert(cards.length === 4, "首页应显示4条物品信息");
                assert(
                    doc.getElementById("resultCount").textContent.includes("4"),
                    "物品数量显示不正确"
                );
            });

            // 测试2：关键词搜索。
            await runCase("测试2：搜索关键词", async function () {
                const win = await loadApp(sampleItems);
                const doc = getAppDocument(win);

                doc.getElementById("searchInput").value = "图书馆";
                doc.getElementById("searchBtn").click();

                const cards = doc.querySelectorAll("#itemList .item-card");

                assert(cards.length === 1, "搜索图书馆应返回1条结果");
                assert(
                    cards[0].textContent.includes("蓝色水杯"),
                    "搜索结果不是蓝色水杯"
                );
            });

            // 测试3：分类筛选。
            await runCase("测试3：寻物分类筛选", async function () {
                const win = await loadApp(sampleItems);
                const doc = getAppDocument(win);

                clickCategory(doc, "寻物");

                const cards = doc.querySelectorAll("#itemList .item-card");

                assert(cards.length === 2, "寻物分类应显示2条信息");

                cards.forEach(function (card) {
                    assert(
                        card.textContent.includes("寻物"),
                        "分类中出现了非寻物信息"
                    );
                });
            });

            // 测试4：发布合法信息。
            await runCase("测试4：发布有效信息", async function () {
                const win = await loadApp(sampleItems);
                const doc = getAppDocument(win);

                doc.getElementById("publishNavBtn").click();
                fillRequiredFields(doc, "自动化测试物品");

                doc.getElementById("publishForm").requestSubmit();

                assert(
                    !doc.getElementById("successPage").hidden,
                    "发布成功页面没有显示"
                );

                const item = readSavedItems().find(function (entry) {
                    return entry.title === "自动化测试物品";
                });

                assert(item, "发布的信息没有保存到 localStorage");
                assert(item.status === "待处理", "新物品初始状态不正确");
            });

            // 测试5：必填字段验证。
            await runCase("测试5：缺少名称时阻止发布", async function () {
                const win = await loadApp(sampleItems);
                const doc = getAppDocument(win);

                doc.getElementById("publishNavBtn").click();
                fillRequiredFields(doc, "");
                doc.getElementById("publishForm").requestSubmit();

                assert(
                    doc.getElementById("successPage").hidden,
                    "缺少名称时不应该进入发布成功页面"
                );

                assert(
                    readSavedItems().length === sampleItems.length,
                    "无效信息不应该被保存"
                );
            });

            // 测试6：编辑并保存。
            await runCase("测试6：编辑物品信息", async function () {
                const win = await loadApp(sampleItems);
                const doc = getAppDocument(win);
                const promptValues = [
                    "修改后的校园卡",
                    "修改后的教学楼",
                    "修改后的描述"
                ];

                win.prompt = function () {
                    return promptValues.shift();
                };

                doc.getElementById("mineNavBtn").click();

                const editButton = doc.querySelector(
                    '#mineList button[data-action="edit"][data-id="1"]'
                );

                assert(editButton, "找不到第一条物品的编辑按钮");
                editButton.click();

                const item = findSavedItem(1);

                assert(item, "编辑后的物品不存在");
                assert(item.title === "修改后的校园卡", "名称修改失败");
                assert(item.location === "修改后的教学楼", "地点修改失败");
                assert(item.description === "修改后的描述", "描述修改失败");
            });

            // 测试7：标记为已找到。
            await runCase("测试7：标记已找到", async function () {
                const win = await loadApp(sampleItems);
                const doc = getAppDocument(win);

                doc.getElementById("mineNavBtn").click();

                const foundButton = doc.querySelector(
                    '#mineList button[data-action="found"][data-id="1"]'
                );

                assert(foundButton, "找不到标记已找到按钮");
                foundButton.click();

                const item = findSavedItem(1);

                assert(item, "物品数据不存在");
                assert(item.status === "已找到", "物品状态没有更新");
            });

            // 测试8：编辑后重新加载页面，检查持久化。
            await runCase("测试8：修改后刷新仍然保留", async function () {
                const win = await loadApp(sampleItems);
                const doc = getAppDocument(win);

                win.prompt = (function () {
                    const values = [
                        "持久化测试校园卡",
                        "持久化测试地点",
                        "持久化测试描述"
                    ];

                    return function () {
                        return values.shift();
                    };
                })();

                doc.getElementById("mineNavBtn").click();

                const editButton = doc.querySelector(
                    '#mineList button[data-action="edit"][data-id="1"]'
                );

                assert(editButton, "找不到编辑按钮");
                editButton.click();

                const refreshedWin = await loadApp(readSavedItems());
                const refreshedDoc = getAppDocument(refreshedWin);
                const cards = refreshedDoc.querySelectorAll(
                    "#itemList .item-card"
                );

                assert(cards.length === 4, "刷新后首页物品数量不正确");
                assert(
                    cards[0].textContent.includes("持久化测试校园卡"),
                    "刷新后没有显示修改后的名称"
                );

                const item = findSavedItem(1);

                assert(
                    item.location === "持久化测试地点",
                    "刷新后地点没有保留"
                );
                assert(
                    item.description === "持久化测试描述",
                    "刷新后描述没有保留"
                );
            });
        } finally {
            // 恢复运行测试之前的存储，避免测试数据污染日常使用。
            if (originalStorage === null) {
                localStorage.removeItem(STORAGE_KEY);
            } else {
                localStorage.setItem(STORAGE_KEY, originalStorage);
            }

            summary.textContent =
                "测试结束：通过 " + passed + " 项，失败 " + failed + " 项。";

            runButton.disabled = false;
            running = false;
        }
    }

    runButton.addEventListener("click", runAllTests);
})();
