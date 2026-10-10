const defaultItems = [
    {
        id: 1,
        title: "黑色校园卡",
        type: "寻物",
        location: "第一教学楼",
        date: "2026-10-06",
        description: "在第一教学楼附近遗失黑色校园卡，希望有同学捡到后联系。",
        icon: "💳",
        contactName: "校园用户",
        contact: "student01@example.com"
    },
    {
        id: 2,
        title: "蓝色水杯",
        type: "招领",
        location: "图书馆",
        date: "2026-10-05",
        description: "在图书馆自习区发现一个蓝色水杯，请失主联系。",
        icon: "🥤",
        contactName: "校园用户",
        contact: "student02@example.com"
    },
    {
        id: 3,
        title: "黑色钥匙",
        type: "寻物",
        location: "学生宿舍区",
        date: "2026-10-04",
        description: "一串黑色钥匙可能遗失在宿舍区附近。",
        icon: "🔑",
        contactName: "校园用户",
        contact: "student03@example.com"
    },
    {
        id: 4,
        title: "白色耳机",
        type: "招领",
        location: "食堂",
        date: "2026-10-03",
        description: "在食堂座位附近发现白色无线耳机。",
        icon: "🎧",
        contactName: "校园用户",
        contact: "student04@example.com"
    }
];

function fillMissingDemoContacts(items) {
    if (!Array.isArray(items)) return items;

    let changed = false;
    items.forEach(function (item) {
        if (!item) return;
        const sample = defaultItems.find(function (entry) {
            return Number(item.id) === entry.id &&
                item.title === entry.title &&
                item.type === entry.type &&
                item.location === entry.location &&
                item.date === entry.date &&
                item.description === entry.description;
        });
        if (!sample) return;

        if (!String(item.contact || "").trim()) {
            item.contact = sample.contact;
            changed = true;
        }
        if (!String(item.contactName || "").trim()) {
            item.contactName = sample.contactName;
            changed = true;
        }
    });

    if (changed) {
        localStorage.setItem("campusLostFoundItems", JSON.stringify(items));
    }
    return items;
}

function getItems() {
    const savedItems = localStorage.getItem("campusLostFoundItems");

    if (savedItems) {
        return fillMissingDemoContacts(JSON.parse(savedItems));
    }

    localStorage.setItem(
        "campusLostFoundItems",
        JSON.stringify(defaultItems)
    );

    return defaultItems;
}

function saveItems(items) {
    localStorage.setItem(
        "campusLostFoundItems",
        JSON.stringify(items)
    );
}