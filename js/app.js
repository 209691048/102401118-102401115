// 本地演示身份：同一浏览器共用身份，不代表服务器登录认证。
function getCurrentPublisherId() {
    try {
        const key = "campusLostFoundPublisherId";
        let id = localStorage.getItem(key);
        if (!id) {
            if (window.crypto && typeof window.crypto.randomUUID === "function") {
                id = window.crypto.randomUUID();
            } else {
                id = "publisher-" + Date.now() + "-" + Math.random().toString(36).slice(2);
            }
            localStorage.setItem(key, id);
        }
        return id;
    } catch (error) {
        console.error("无法保存发布者身份：", error);
        return null;
    }
}

function isOwnItem(item) {
    const publisherId = getCurrentPublisherId();
    return Boolean(publisherId && item && item.publisherId === publisherId);
}

function requireOwnership(item) {
    if (!item) {
        alert("未找到这条信息。");
        return false;
    }
    if (!isOwnItem(item)) {
        alert("只能修改自己发布的信息；旧版无归属信息仅供浏览。");
        return false;
    }
    return true;
}

let editingItemId = null;
let mineFeedbackTimer = null;
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

const appModal = document.getElementById("appModal");
const appModalTitle = document.getElementById("appModalTitle");
const appModalMessage = document.getElementById("appModalMessage");
const appModalClose = document.getElementById("appModalClose");
const appModalCancel = document.getElementById("appModalCancel");
let modalReturnFocus = null;
let modalConfirmAction = null;

function openAppModal(message, title) {
    if (!appModal || !appModalMessage || !appModalTitle) return false;
    modalReturnFocus = document.activeElement;
    appModalTitle.textContent = title || "提示";
    appModalMessage.textContent = message;
    appModal.hidden = false;
    if (appModalClose && typeof appModalClose.focus === "function") appModalClose.focus();
    return true;
}

function showAppModal(message, title) {
    modalConfirmAction = null;
    if (appModalCancel) appModalCancel.hidden = true;
    if (appModalClose) appModalClose.textContent = "确定";
    openAppModal(message, title);
}

function showAppConfirm(message, title, onConfirm) {
    if (!appModal || !appModalCancel || !appModalClose) return;
    modalConfirmAction = onConfirm;
    appModalCancel.hidden = false;
    appModalClose.textContent = "删除";
    openAppModal(message, title || "请确认");
}

function closeAppModal(confirmed) {
    if (!appModal || appModal.hidden) return;
    appModal.hidden = true;
    const returnFocus = modalReturnFocus;
    modalReturnFocus = null;
    const action = modalConfirmAction;
    modalConfirmAction = null;
    if (confirmed && action) action();
    if (returnFocus && returnFocus.isConnected && appModal.hidden) returnFocus.focus();
}

if (appModalClose) appModalClose.addEventListener("click", function () {
    closeAppModal(true);
});
if (appModalCancel) appModalCancel.addEventListener("click", function () {
    closeAppModal(false);
});
if (appModal) {
    appModal.addEventListener("click", function (event) {
        if (event.target === appModal) closeAppModal(false);
    });
}
document.addEventListener("keydown", function (event) {
    if (!appModal || appModal.hidden) return;
    if (event.key === "Escape") {
        closeAppModal(false);
        return;
    }
    if (event.key === "Tab") {
        const buttons = [appModalClose];
        if (appModalCancel && !appModalCancel.hidden) buttons.unshift(appModalCancel);
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }
});

function getCompletedStatus(item) {
    return item.type === "招领" ? "已归还" : "已找到";
}

function getItemStatus(item) {
    // 兼容旧版本把招领信息保存为“已找到”的数据。
    if (item.status === "已找到" || item.status === "已归还") {
        return getCompletedStatus(item);
    }
    return item.status || "待处理";
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
                    ${getItemStatus(item) === getCompletedStatus(item) ? '<div class="item-status">' + escapeHTML(getItemStatus(item)) + '</div>' : ""}
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
                <span class="detail-status">${escapeHTML(getItemStatus(item))}</span>
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
    const items = readItems().filter(isOwnItem);
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
                            ${getItemStatus(item) === getCompletedStatus(item) ? escapeHTML(getItemStatus(item)) : "标记" + escapeHTML(getCompletedStatus(item))}
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
    const item = readItems().find(function (entry) { return Number(entry.id) === Number(id); });
    if (!requireOwnership(item)) return;
    editingItemId = Number(item.id);
    const fields = { Title: "title", Type: "type", Location: "location", Date: "date",
        Description: "description", ContactName: "contactName", Contact: "contact" };
    Object.entries(fields).forEach(function ([suffix, key]) {
        document.getElementById("edit" + suffix).value = item[key] || "";
    });
    document.getElementById("editFeedback").hidden = true;
    document.getElementById("mineFeedback").hidden = true;
    switchPage("edit", "编辑信息");
}

function showEditError(message) {
    const feedback = document.getElementById("editFeedback");
    feedback.textContent = message;
    feedback.hidden = false;
}

function showMineSuccess(message) {
    const feedback = document.getElementById("mineFeedback");
    if (!feedback) return;

    if (mineFeedbackTimer) clearTimeout(mineFeedbackTimer);
    feedback.textContent = message;
    feedback.hidden = false;
    mineFeedbackTimer = setTimeout(function () {
        feedback.hidden = true;
        mineFeedbackTimer = null;
    }, 2500);
}

function cancelEdit() {
    editingItemId = null;
    renderMine();
    switchPage("mine", "我的发布");
}

function saveEdit(event) {
    event.preventDefault();
    // 保存时重新读取并检查归属，防止编辑期间记录被删除或归属改变。
    const items = readItems();
    const item = items.find(function (entry) { return Number(entry.id) === editingItemId; });
    if (!item || !isOwnItem(item)) {
        showEditError("信息不存在或不属于当前用户，无法保存。");
        return;
    }
    const values = {};
    const fields = { Title: "title", Location: "location", Date: "date",
        Description: "description", ContactName: "contactName", Contact: "contact" };
    Object.entries(fields).forEach(function ([suffix, key]) {
        values[key] = document.getElementById("edit" + suffix).value.trim();
    });
    if (!values.title || !values.location || !values.date || !values.description || !values.contact) {
        showEditError("物品名称、地点、日期、描述和联系方式不能为空。");
        return;
    }
    if (values.title.length > 40 || values.location.length > 80 || values.description.length > 500 ||
        values.contactName.length > 30 || values.contact.length > 100) {
        showEditError("内容超过长度限制，请缩短后再保存。");
        return;
    }
    // 只修改可编辑字段，保留 ID、发布者、信息类型及完成状态。
    Object.assign(item, values);
    try {
        saveItems(items);
    } catch (error) {
        showEditError("保存失败，请检查浏览器存储设置后重试；填写内容已保留。");
        return;
    }
    renderItems();
    cancelEdit();
    showMineSuccess("信息修改成功。");
}

const editForm = document.getElementById("editForm");
if (editForm) editForm.addEventListener("submit", saveEdit);
const cancelEditBtn = document.getElementById("cancelEditBtn");
if (cancelEditBtn) cancelEditBtn.addEventListener("click", cancelEdit);

function markFound(id) {
    const items = readItems();
    const item = items.find(function (entry) {
        return Number(entry.id) === Number(id);
    });

    if (!requireOwnership(item)) return;

    if (getItemStatus(item) === getCompletedStatus(item)) {
        showAppModal("这条信息已经标记为" + getCompletedStatus(item) + "。", "状态提示");
        return;
    }

    item.status = getCompletedStatus(item);

    try {
        saveItems(items);
        renderMine();
        renderItems();
        showAppModal("已更新为" + getCompletedStatus(item) + "。", "状态更新成功");
    } catch (error) {
        console.error("更新状态失败：", error);
        alert("更新失败，请重试。");
    }
}

function deleteItem(id) {
    const items = readItems();
    const target = items.find(function (item) { return Number(item.id) === Number(id); });
    if (!requireOwnership(target)) return;

    showAppConfirm("确定要删除这条物品信息吗？删除后无法直接恢复。", "确认删除", function () {
        const remainingItems = items.filter(function (item) {
            return Number(item.id) !== Number(id);
        });

        try {
            saveItems(remainingItems);
            renderMine();
            renderItems();
            showAppModal("信息已删除。", "删除成功");
        } catch (error) {
            console.error("删除信息失败：", error);
            showAppModal("删除失败，请重试。", "删除失败");
        }
    });
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
        if (currentPage === "edit") cancelEdit();
        else goHome();
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

        if (!title || !location || !date || !description || !contact) {
            alert("请填写所有带 * 的必填项。");
            return;
        }

        const publisherId = getCurrentPublisherId();
        if (!publisherId) {
            alert("无法保存发布者身份，请允许浏览器本地存储后重试。");
            return;
        }
        const items = readItems();

        items.unshift({
            publisherId: publisherId,
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
