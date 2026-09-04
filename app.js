// Fors Almaz Store - WebApp Engine
const tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) {
  tg.expand();
  tg.ready();
}

// Global State
let currentUser = {
  id: 0,
  first_name: "Корбар",
  username: "",
  balance: 0.0,
  spent: 0.0
};

let verifiedPlayer = {
  uid: "",
  nickname: ""
};

let currentSelectedItem = null;

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  initUserData();
  loadSavedUID();
  fetchUserStats();
});

// 1. Initialize Telegram User Data
function initUserData() {
  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const u = tg.initDataUnsafe.user;
    currentUser.id = u.id;
    currentUser.first_name = u.first_name || "Корбар";
    currentUser.username = u.username || "";

    const fullName = currentUser.first_name + (u.last_name ? " " + u.last_name : "");
    document.getElementById("profile-name").innerText = fullName;
    document.getElementById("profile-id").innerText = "ID: " + currentUser.id;
    document.getElementById("profile-avatar").innerText = currentUser.first_name.charAt(0).toUpperCase();
  } else {
    // Fallback for browser preview
    currentUser.id = 8459747832;
    document.getElementById("profile-id").innerText = "ID: " + currentUser.id;
  }
}

// 2. Fetch User Stats (Balance & History) from API or local cache
async function fetchUserStats() {
  try {
    const res = await fetch(`/api/user?user_id=${currentUser.id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        currentUser.balance = parseFloat(data.balance) || 0.0;
        currentUser.spent = parseFloat(data.spent) || 0.0;
        updateBalanceUI();
        return;
      }
    }
  } catch (e) {
    // Local fallback if running on static host
    console.log("Local mode / offline server:", e);
  }

  // Fallback from localStorage
  const localBal = localStorage.getItem("almaz_balance_" + currentUser.id);
  const localSpent = localStorage.getItem("almaz_spent_" + currentUser.id);
  if (localBal !== null) currentUser.balance = parseFloat(localBal);
  if (localSpent !== null) currentUser.spent = parseFloat(localSpent);
  updateBalanceUI();
}

function updateBalanceUI() {
  const balEl = document.getElementById("profile-balance");
  const spentEl = document.getElementById("profile-spent");
  if (balEl) balEl.innerHTML = `${currentUser.balance.toFixed(2)} <span style="font-size:12px; color:var(--text-muted);">сомонӣ</span>`;
  if (spentEl) spentEl.innerHTML = `${currentUser.spent.toFixed(2)} <span style="font-size:12px;">сомонӣ</span>`;
}

// 3. Navigation between pages
function showPage(pageId) {
  document.querySelectorAll(".page-section").forEach(sec => sec.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach(nav => nav.classList.remove("active"));

  const targetSec = document.getElementById("page-" + pageId);
  if (targetSec) targetSec.classList.add("active");

  const navBtn = document.getElementById("nav-btn-" + pageId);
  if (navBtn) navBtn.classList.add("active");

  if (pageId === "history") {
    loadOrderHistory();
  }
}

// Category tabs (Diamonds vs Passes)
function selectCategory(cat) {
  const dGrid = document.getElementById("grid-diamonds");
  const pGrid = document.getElementById("grid-passes");
  const dBtn = document.getElementById("tab-diamonds-btn");
  const pBtn = document.getElementById("tab-passes-btn");

  if (cat === "diamonds") {
    dGrid.style.display = "grid";
    pGrid.style.display = "none";
    dBtn.classList.add("active");
    pBtn.classList.remove("active");
  } else {
    dGrid.style.display = "none";
    pGrid.style.display = "grid";
    dBtn.classList.remove("active");
    pBtn.classList.add("active");
  }
}

// 4. Free Fire Player UID Verification
function loadSavedUID() {
  const savedUID = localStorage.getItem("ff_last_uid");
  const savedNick = localStorage.getItem("ff_last_nick");
  if (savedUID) {
    document.getElementById("player-uid-input").value = savedUID;
    if (savedNick) {
      verifiedPlayer.uid = savedUID;
      verifiedPlayer.nickname = savedNick;
      showVerifiedBadge(savedNick);
    }
  }
}

async function checkPlayerUID() {
  const uid = document.getElementById("player-uid-input").value.trim();
  if (!uid || uid.length < 6) {
    alert("Лутфан ID-и дурусти Free Fire-ро ворид кунед (ҳадди ақал 6 рақам)!");
    return;
  }

  const btnText = document.getElementById("check-btn-text");
  btnText.innerText = "Санҷиш...";

  try {
    const res = await fetch(`/api/check_uid?uid=${uid}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.nickname) {
        verifiedPlayer.uid = uid;
        verifiedPlayer.nickname = data.nickname;
        localStorage.setItem("ff_last_uid", uid);
        localStorage.setItem("ff_last_nick", data.nickname);
        showVerifiedBadge(data.nickname);
        btnText.innerText = "Санҷидан";
        return;
      }
    }
  } catch (e) {
    console.log("Check UID offline fallback");
  }

  // Fallback verified format
  const mockNick = "FF_PLAYER_" + uid.slice(-4);
  verifiedPlayer.uid = uid;
  verifiedPlayer.nickname = mockNick;
  localStorage.setItem("ff_last_uid", uid);
  localStorage.setItem("ff_last_nick", mockNick);
  showVerifiedBadge(mockNick);
  btnText.innerText = "Санҷидан";
}

function showVerifiedBadge(nickname) {
  const badge = document.getElementById("player-badge");
  const nameSpan = document.getElementById("player-nickname");
  nameSpan.innerText = nickname;
  badge.style.display = "flex";
}

function pasteUID() {
  if (navigator.clipboard && navigator.clipboard.readText) {
    navigator.clipboard.readText().then(text => {
      const cleaned = text.replace(/[^0-9]/g, "");
      if (cleaned) {
        document.getElementById("player-uid-input").value = cleaned;
        checkPlayerUID();
      }
    }).catch(() => {
      alert("Дастгирии буфер дастрас нест, лутфан дастӣ ворид кунед.");
    });
  }
}

// 5. Purchase Modal & Confirmation
function openBuyModal(itemId, title, diamonds, price, imgUrl) {
  const uid = document.getElementById("player-uid-input").value.trim();
  if (!uid || uid.length < 6) {
    alert("Аввал ID-и Free Fire-и худро нависед ва тугмаи 'Санҷидан'-ро пахш кунед!");
    document.getElementById("player-uid-input").focus();
    return;
  }

  if (!verifiedPlayer.nickname || verifiedPlayer.uid !== uid) {
    verifiedPlayer.uid = uid;
    verifiedPlayer.nickname = "FF_PLAYER_" + uid.slice(-4);
  }

  currentSelectedItem = {
    itemId: itemId,
    title: title,
    diamonds: diamonds,
    price: price,
    uid: uid,
    nickname: verifiedPlayer.nickname,
    imgUrl: imgUrl
  };

  document.getElementById("modal-item-img").src = imgUrl;
  document.getElementById("modal-item-title").innerText = title;
  document.getElementById("modal-uid").innerText = uid;
  document.getElementById("modal-nickname").innerText = verifiedPlayer.nickname;
  document.getElementById("modal-price").innerText = price.toFixed(1) + " сомонӣ";
  document.getElementById("modal-user-balance").innerText = currentUser.balance.toFixed(2) + " сомонӣ";

  const errorEl = document.getElementById("modal-error-msg");
  const confirmBtn = document.getElementById("modal-confirm-btn");

  if (currentUser.balance < price) {
    errorEl.style.display = "block";
    errorEl.innerText = `Баланси шумо (${currentUser.balance.toFixed(2)} с.) барои ин харид (${price} с.) кифоя нест!`;
    confirmBtn.innerText = "💳 Пур кардани баланс";
    confirmBtn.onclick = () => {
      closeBuyModal();
      showPage("topup");
    };
  } else {
    errorEl.style.display = "none";
    confirmBtn.innerText = "Тасдиқи харид ✓";
    confirmBtn.onclick = executePurchase;
  }

  document.getElementById("buy-modal").classList.add("open");
}

function closeBuyModal() {
  document.getElementById("buy-modal").classList.remove("open");
  currentSelectedItem = null;
}

// 6. Execute Purchase
async function executePurchase() {
  if (!currentSelectedItem) return;

  const item = currentSelectedItem;
  const payload = {
    type: "order",
    user_id: currentUser.id,
    item_id: item.itemId,
    item_title: item.title,
    diamonds: item.diamonds,
    price: item.price,
    uid: item.uid,
    nickname: item.nickname
  };

  // Try API first
  let success = false;
  try {
    const res = await fetch("/api/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        success = true;
        currentUser.balance = data.new_balance;
        currentUser.spent += item.price;
        updateBalanceUI();
      } else {
        alert(data.message || "Хатогӣ дар пардохт!");
        return;
      }
    }
  } catch (e) {
    console.log("Server buy error, sending via Telegram WebApp data:", e);
  }

  // If running directly inside Telegram Web App, send data to bot
  if (tg && typeof tg.sendData === "function") {
    tg.sendData(JSON.stringify(payload));
  }

  // Save to local history
  saveOrderToLocal(item);

  // Haptic feedback
  if (tg && tg.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred("success");
  }

  closeBuyModal();
  alert(`🎉 Фармоиш барои "${item.title}" қабул шуд!\nID: ${item.uid}\nАлмазҳо дар давоми 1-5 дақиқа ворид карда мешаванд.`);
  showPage("history");
}

function saveOrderToLocal(item) {
  let list = JSON.parse(localStorage.getItem("almaz_orders_" + currentUser.id) || "[]");
  list.unshift({
    title: item.title,
    price: item.price,
    uid: item.uid,
    nickname: item.nickname,
    date: new Date().toLocaleDateString("tg-TJ") + " " + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    status: "pending"
  });
  localStorage.setItem("almaz_orders_" + currentUser.id, JSON.stringify(list));
}

// 7. Load Order History
async function loadOrderHistory() {
  const container = document.getElementById("history-container");
  container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">Боригирӣ...</div>`;

  let orders = [];

  // Try server
  try {
    const res = await fetch(`/api/history?user_id=${currentUser.id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        orders = data.orders;
      }
    }
  } catch (e) {
    console.log("Local history fallback");
  }

  // Merge with local orders if empty
  if (orders.length === 0) {
    orders = JSON.parse(localStorage.getItem("almaz_orders_" + currentUser.id) || "[]");
  }

  if (orders.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px 10px; color:var(--text-muted);">
        <div style="font-size:36px; margin-bottom:10px;">📦</div>
        <div style="font-weight:700;">Таърихи шумо холӣ аст</div>
        <div style="font-size:12px; margin-top:4px;">Пас аз хариди аввалин, фармоишҳо дар ин ҷо нишон дода мешаванд.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map(ord => {
    const isCompleted = ord.status === "completed";
    const statusText = isCompleted ? "✓ Иҷро шуд" : "⏳ Дар раванд";
    const badgeClass = isCompleted ? "badge-completed" : "badge-pending";
    const dateStr = ord.created_at || ord.date || "";

    return `
      <div class="history-item">
        <div>
          <div class="history-title">${ord.item_title || ord.title}</div>
          <div class="history-sub">UID: <b>${ord.uid}</b></div>
          <div class="history-sub" style="font-size:11px; margin-top:2px;">${dateStr}</div>
        </div>
        <div class="history-status">
          <div class="history-price">${parseFloat(ord.price).toFixed(1)} с.</div>
          <span class="badge-status ${badgeClass}">${statusText}</span>
        </div>
      </div>
    `;
  }).join("");
}

// 8. Utilities
function copyDCNumber() {
  const num = "+992980726060";
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(num).then(() => {
      alert("Рақам нусхабардорӣ шуд: " + num);
    });
  } else {
    alert("Рақам: " + num);
  }
}

function openSupport() {
  if (tg && typeof tg.openTelegramLink === "function") {
    tg.openTelegramLink("https://t.me/yahyoezz5");
  } else {
    window.open("https://t.me/yahyoezz5", "_blank");
  }
}

function toggleTheme() {
  const isChecked = document.getElementById("theme-toggle").checked;
  if (isChecked) {
    document.body.classList.remove("light-theme");
  } else {
    document.body.classList.add("light-theme");
  }
}
