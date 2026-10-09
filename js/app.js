let currentType = "全部";
let currentKeyword = "";
let currentItemId = null;
let currentPage = "home";

const itemList = document.getElementById("itemList");
const resultCount = document.getElementById("resultCount");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const pageTitle = document.getElementById("pageTitle");
const backBtn = document.getElementById("backBtn");

const pages = {
    home: document.getElementById("homePage"),
    detail: document.getElementById("detailPage"),
    publish: document.getElementById("publishPage"),
    success: document.getElementById("successPage"),
    mine: document.getElementById("minePage")
};

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };
        return entities[char];
    });
}

function readItems() {
    try {
        const items = getItems();
        return Array.isArray(items) ? items : [];
    } catch (error) {
        console.error("读取物品信息失败：", error);
        return [];
    }
}

function switchPage(name, title) {
    if (!pages[name]) {
        console.error("页面不存在：", name);
        return;
    }

    currentPage = name;

    Object.entries(pages).forEach(function ([key, element]) {
        if (element) {
            element.hidden = key !== name;
        }
    });

    if (pageTitle) {
        pageTitle.textContent = title;
    }

    if (backBtn) {
        backBtn.hidden = name === "home";
    }

    document.querySelectorAll(".nav-btn").forEach(function (btn) {
        btn.classList.remove("active");
    });

    const navIds = {
        home: "homeNavBtn",
        publish: "publishNavBtn",
        mine: "mineNavBtn"
    };

    if (navIds[name]) {
        const navButton = document.getElementById(navIds[name]);
        if (navButton) {
            navButton.classList.add("active");
        }
    }

    window.scrollTo(0, 0);
}

function renderItems() {
    if (!itemList || !resultCount) {
        console.error("找不到 itemList 或 resultCount，请检查 index.html。");
        return;
    }

    const items = readItems();

    const filteredItems = items.filter(function (item) {
        const typeMatch =
            currentType === "全部" || item.type === currentType;

        const keyword = currentKeyword.toLowerCase();

        const keywordMatch =
            !keyword ||
            String(item.title || "").toLowerCase().includes(keyword) ||
            String(item.description || "").toLowerCase().includes(keyword) ||
            String(item.location || "").toLowerCase().includes(keyword);

        return typeMatch && keywordMatch;
    });

    resultCount.textContent = "共 " + filteredItems.length + " 条";

    if (filteredItems.length === 0) {
        itemList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p>${items.length === 0 ? "暂时没有物品信息" : "没有找到相关信息"}</p>
            </div>
        `;
        return;
    }

    itemList.innerHTML = filteredItems.map(function (item) {
        return `
            <article class="item-card"
                data-id="${Number(item.id)}"
                tabindex="0"
                role="button">
                <div class="item-image">${escapeHTML(item.icon || "📦")}</div>
                <div class="item-info">
                    <div class="item-header">
                        <span class="item-title">${escapeHTML(item.title)}</span>
                        <span class="type-tag">${escapeHTML(item.type)}</span>
                    </div>
                    <div class="item-location">📍 ${escapeHTML(item.location)}</div>
                    <div class="item-date">🕒 ${escapeHTML(item.date)}</div>
                    <div class="item-description">${escapeHTML(item.description)}</div>
                    ${item.status === "已找到" ? '<div class="item-status">已找到</div>' : ""}
                </div>
            </article>
        `;
    }).join("");

    itemList.querySelectorAll(".item-card").forEach(function (card) {
        function open() {
            openDetail(Number(card.dataset.id));
        }

        card.addEventListener("click", open);

        card.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                open();
            }
        });
    });
}

function openDetail(id) {
    const items = readItems();
    const item = items.find(function (entry) {
        return Number(entry.id) === Number(id);
    });

    if (!item) {
        alert("未找到这条信息，请刷新页面后重试。");
        return;
    }

    currentItemId = Number(id);

    const detailContent = document.getElementById("detailContent");

    if (!detailContent) {
        alert("找不到详情页面，请检查 index.html。");
        return;
    }

    detailContent.innerHTML = `
        <article class="detail-card">
            <div class="detail-image">${escapeHTML(item.icon || "📦")}</div>

            <div class="detail-title-row">
                <h2 class="detail-title">${escapeHTML(item.title)}</h2>
                <span class="detail-status">${escapeHTML(item.status || "待处理")}</span>
            </div>

            <div class="detail-info-row">
                <span class="detail-info-label">信息类型</span>
                ${escapeHTML(item.type)}
            </div>

            <div class="detail-info-row">
                <span class="detail-info-label">地点</span>
                ${escapeHTML(item.location)}
            </div>

            <div class="detail-info-row">
                <span class="detail-info-label">日期</span>
                ${escapeHTML(item.date)}
            </div>

            <p class="detail-description">${escapeHTML(item.description)}</p>

            <div class="contact-card">
                <h3>发布者联系方式</h3>
                <p>联系人：${escapeHTML(item.contactName || "校园用户")}</p>
                <p>联系方式：${escapeHTML(item.contact || "暂未填写联系方式")}</p>
                <p>请联系时说明物品名称，并核实物品特征。</p>
            </div>

            <button class="primary-btn" id="contactBtn" type="button">
                联系发布者
            </button>

            <button class="secondary-btn" id="detailBackBtn" type="button">
                返回首页
            </button>
        </article>
    `;

    switchPage("detail", "信息详情");

    document.getElementById("contactBtn").addEventListener("click", function () {
        if (item.contact) {
            alert("请通过以下方式联系发布者：\n" + item.contact);
        } else {
            alert("发布者暂未填写联系方式。");
        }
    });

    document.getElementById("detailBackBtn").addEventListener("click", function () {
        goHome();
    });
}

function renderMine() {
    const items = readItems();
    const mineList = document.getElementById("mineList");
    const mineCount = document.getElementById("mineCount");

    if (!mineList || !mineCount) {
        console.error("找不到 mineList 或 mineCount，请检查 index.html。");
        return;
    }

    mineCount.textContent = items.length + " 条";

    if (items.length === 0) {
        mineList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>还没有发布信息</p>
                <button class="primary-btn" id="minePublishBtn" type="button">
                    去发布信息
                </button>
            </div>
        `;

        document.getElementById("minePublishBtn").addEventListener("click", function () {
            openPublishPage();
        });

        return;
    }

    mineList.innerHTML = items.map(function (item) {
        return `
            <article class="item-card">
                <div class="item-image">${escapeHTML(item.icon || "📦")}</div>

                <div class="item-info">
                    <div class="item-header">
                        <span class="item-title">${escapeHTML(item.title)}</span>
                        <span class="type-tag">${escapeHTML(item.type)}</span>
                    </div>

                    <div class="item-location">📍 ${escapeHTML(item.location)}</div>
                    <div class="item-date">🕒 ${escapeHTML(item.date)}</div>
                    <div class="item-description">${escapeHTML(item.description)}</div>

                    <div class="mine-item-actions">
                        <button type="button" data-action="detail" data-id="${Number(item.id)}">
                            查看详情
                        </button>
                        <button type="button" data-action="edit" data-id="${Number(item.id)}">
                            编辑
                        </button>
                        <button type="button" data-action="found" data-id="${Number(item.id)}">
                            ${item.status === "已找到" ? "已标记找到" : "标记已找到"}
                        </button>
                        <button type="button" data-action="delete" data-id="${Number(item.id)}">
                            删除
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");

    mineList.querySelectorAll("button[data-action]").forEach(function (button) {
        button.addEventListener("click", function () {
            const id = Number(button.dataset.id);
            const action = button.dataset.action;

            if (action === "detail") {
                openDetail(id);
            } else if (action === "edit") {
                editItem(id);
            } else if (action === "found") {
                markFound(id);
            } else if (action === "delete") {
                deleteItem(id);
            }
        });
    });
}

function editItem(id) {
    const items = readItems();
    const item = items.find(function (entry) {
        return Number(entry.id) === Number(id);
    });

    if (!item) {
        alert("未找到这条信息。");
        return;
    }

    const title = prompt("请输入物品名称：", item.title);
    if (title === null) return;

    const location = prompt("请输入地点：", item.location);
    if (location === null) return;

    const description = prompt("请输入详细描述：", item.description);
    if (description === null) return;

    if (!title.trim() || !location.trim() || !description.trim()) {
        alert("物品名称、地点和描述不能为空。");
        return;
    }

    item.title = title.trim();
    item.location = location.trim();
    item.description = description.trim();

    try {
        saveItems(items);
        renderMine();
        renderItems();
        alert("信息修改成功！");
    } catch (error) {
        console.error("保存修改失败：", error);
        alert("保存失败，请检查浏览器存储空间或设置。");
    }
}

function markFound(id) {
    const items = readItems();
    const item = items.find(function (entry) {
        return Number(entry.id) === Number(id);
    });

    if (!item) {
        alert("未找到这条信息。");
        return;
    }

    if (item.status === "已找到") {
        alert("这条信息已经标记为已找到。");
        return;
    }

    item.status = "已找到";

    try {
        saveItems(items);
        renderMine();
        renderItems();
        alert("已更新该信息的状态。");
    } catch (error) {
        console.error("更新状态失败：", error);
        alert("更新失败，请重试。");
    }
}

function deleteItem(id) {
    const confirmed = confirm("确定要删除这条物品信息吗？删除后无法直接恢复。");

    if (!confirmed) return;

    const items = readItems();
    const remainingItems = items.filter(function (item) {
        return Number(item.id) !== Number(id);
    });

    try {
        saveItems(remainingItems);
        renderMine();
        renderItems();
        alert("信息已删除。");
    } catch (error) {
        console.error("删除信息失败：", error);
        alert("删除失败，请重试。");
    }
}

function goHome() {
    switchPage("home", "校园寻物");
    renderItems();
}

function openPublishPage() {
    switchPage("publish", "发布信息");

    const itemDate = document.getElementById("itemDate");

    if (itemDate && !itemDate.value) {
        const now = new Date();

        const localDate = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0")
        ].join("-");

        itemDate.value = localDate;
    }
}

function doSearch() {
    if (!searchInput) return;

    currentKeyword = searchInput.value.trim();
    renderItems();
}

document.querySelectorAll(".category-btn").forEach(function (button) {
    button.addEventListener("click", function () {
        document.querySelectorAll(".category-btn").forEach(function (btn) {
            btn.classList.remove("active");
        });

        button.classList.add("active");
        currentType = button.dataset.type || "全部";

        renderItems();
    });
});

if (searchBtn) {
    searchBtn.addEventListener("click", doSearch);
}

if (searchInput) {
    searchInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            doSearch();
        }
    });
}

const homeNavBtn = document.getElementById("homeNavBtn");

if (homeNavBtn) {
    homeNavBtn.addEventListener("click", goHome);
}

const publishNavBtn = document.getElementById("publishNavBtn");

if (publishNavBtn) {
    publishNavBtn.addEventListener("click", openPublishPage);
}

const mineNavBtn = document.getElementById("mineNavBtn");

if (mineNavBtn) {
    mineNavBtn.addEventListener("click", function () {
        renderMine();
        switchPage("mine", "我的发布");
    });
}

if (backBtn) {
    backBtn.addEventListener("click", function () {
        if (currentPage === "mine") {
            renderMine();
            switchPage("mine", "我的发布");
        } else {
            goHome();
        }
    });
}

const cancelPublishBtn = document.getElementById("cancelPublishBtn");

if (cancelPublishBtn) {
    cancelPublishBtn.addEventListener("click", goHome);
}

const publishForm = document.getElementById("publishForm");

if (publishForm) {
    publishForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const title = document.getElementById("itemTitle").value.trim();
        const type = document.getElementById("itemType").value;
        const location = document.getElementById("itemLocation").value.trim();
        const date = document.getElementById("itemDate").value;
        const description = document.getElementById("itemDescription").value.trim();
        const contactName = document.getElementById("itemContactName").value.trim();
        const contact = document.getElementById("itemContact").value.trim();

        if (!title || !location || !date || !description) {
            alert("请填写所有带 * 的必填项。");
            return;
        }

        const items = readItems();

        items.unshift({
            id: Date.now(),
            title: title,
            type: type,
            location: location,
            date: date,
            description: description,
            contactName: contactName,
            contact: contact,
            icon: type === "寻物" ? "🔎" : "📦",
            status: "待处理"
        });

        try {
            saveItems(items);
            publishForm.reset();

            const itemDate = document.getElementById("itemDate");

            if (itemDate) {
                itemDate.value = "";
            }

            if (pages.success) {
                switchPage("success", "发布成功");
            } else {
                alert("发布成功！");
                goHome();
            }
        } catch (error) {
            console.error("发布信息失败：", error);
            alert("发布失败，请检查浏览器存储设置后重试。");
        }
    });
}

const successHomeBtn = document.getElementById("successHomeBtn");

if (successHomeBtn) {
    successHomeBtn.addEventListener("click", function () {
        currentType = "全部";
        currentKeyword = "";

        if (searchInput) {
            searchInput.value = "";
        }

        document.querySelectorAll(".category-btn").forEach(function (button) {
            button.classList.toggle("active", button.dataset.type === "全部");
        });

        goHome();
    });
}

const successMineBtn = document.getElementById("successMineBtn");

if (successMineBtn) {
    successMineBtn.addEventListener("click", function () {
        renderMine();
        switchPage("mine", "我的发布");
    });
}

function initApp() {
    switchPage("home", "校园寻物");
    renderItems();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}