const nav = document.getElementById('nav');
  if(nav) window.addEventListener('scroll', () => {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  });

  /* ---------- Mobile nav drawer ---------- */
  const mobileNav = document.getElementById('mobileNav');
  const mobileNavOverlay = document.getElementById('mobileNavOverlay');
  const burgerBtn = document.getElementById('burgerBtn');
  const mobileNavClose = document.getElementById('mobileNavClose');

  function openMobileNav(){
    mobileNav.classList.add('open');
    mobileNavOverlay.classList.add('open');
    document.body.classList.add('nav-open');
  }
  function closeMobileNav(){
    mobileNav.classList.remove('open');
    mobileNavOverlay.classList.remove('open');
    document.body.classList.remove('nav-open');
  }
  if(burgerBtn) burgerBtn.addEventListener('click', openMobileNav);
  if(mobileNavClose) mobileNavClose.addEventListener('click', closeMobileNav);
  if(mobileNavOverlay) mobileNavOverlay.addEventListener('click', closeMobileNav);
  if(mobileNav) mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileNav));
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeMobileNav(); });

/* ---------- Plans / pricing (placeholder catalog, no live payment gateway yet) ---------- */
// Membership plans are gated: Shop doesn't open until a member has an active,
// confirmed membership. Shop products (below) don't grant membership by
// themselves — they're just for sale to members who already have one.
const MEMBERSHIP_PLANS = [
  { category: "Gym Session Fee", items: [
    { plan: "Daily", price: 3500 },
    { plan: "Weekly", price: 9000 },
    { plan: "Weekend", price: 12000 },
    { plan: "Monthly", price: 20000 },
    { plan: "Quarterly", price: 56000 },
    { plan: "Annually", price: 200000 },
  ]},
  { category: "Fitness Subscription", items: [
    { plan: "Online Training Monthly", price: 30000 },
    { plan: "Personal Session Monthly", price: 30000 },
  ]},
  { category: "Private Session (Home Monthly)", items: [
    { plan: "Mainland", price: 150000 },
    { plan: "Island", price: 250000 },
  ]},
];
const SHOP_PRODUCTS = [
  { category: "Diet & Organic Supplement Drink", items: [
    { plan: "Weight Loss Diet Monthly", price: 15000 },
    { plan: "Weight Gain Diet Monthly", price: 20000 },
    { plan: "Organic Weight Gain / Body Builder Protein Powder", price: 20000 },
    { plan: "Weight Loss Drink (per 5ltrs)", price: 15000 },
    { plan: "Detox Drink", price: 2000 },
    { plan: "Belly Blast", price: 2500 },
    { plan: "Miracle Water (5 Litres)", price: 25000 },
  ]},
  { category: "Natural Drinks & Treats", items: [
    { plan: "Tiger Nut Drink", price: 2000, img: "assets/img/product-tigernut.jpg" },
    { plan: "Creamy Yoghurt", price: 2500, img: "assets/img/product-yoghurt.jpg" },
    { plan: "Creamy Parfait", price: 5000, img: "assets/img/product-parfait.jpg" },
    { plan: "Kunu", price: 2000, img: "assets/img/product-kunu.jpg" },
  ]},
];
const ALL_PLANS = [...MEMBERSHIP_PLANS, ...SHOP_PRODUCTS];
const MEMBERSHIP_CATEGORY_NAMES = MEMBERSHIP_PLANS.map(c => c.category);

function formatNaira(n){ return "₦" + Number(n).toLocaleString("en-NG"); }

function renderPlans(gridId, catalog){
  const grid = document.getElementById(gridId || "plansGrid");
  if(!grid) return;
  grid.innerHTML = (catalog || ALL_PLANS).map(cat => `
    <div class="plan-card">
      <h3>${cat.category}</h3>
      ${cat.items.map(it => `
        <div class="plan-item">
          ${it.img ? `<div class="plan-item-thumb"><img src="${it.img}" alt="${it.plan}"></div>` : ""}
          <div class="plan-item-info">
            <span class="plan-item-name">${it.plan}</span>
            <span class="plan-item-price">${formatNaira(it.price)}</span>
          </div>
          <button class="plan-add-btn" data-cat="${cat.category}" data-plan="${it.plan}" data-price="${it.price}">Add</button>
        </div>
      `).join("")}
    </div>
  `).join("");

  grid.querySelectorAll(".plan-add-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      addToCart(btn.dataset.cat, btn.dataset.plan, Number(btn.dataset.price));
      btn.textContent = "Added ✓";
      btn.classList.add("added");
      setTimeout(() => { btn.textContent = "Add"; btn.classList.remove("added"); }, 1200);
    });
  });
}
if(document.body.dataset.page === "shop") renderPlans("plansGrid", SHOP_PRODUCTS);
else if(document.body.dataset.page === "membership") renderPlans("plansGrid", MEMBERSHIP_PLANS);
else renderPlans("plansGrid", ALL_PLANS);

/* ---------- Cart ---------- */
// Cart is scoped per logged-in member (lf_cart_<memberId>) so it doesn't leak
// across accounts on a shared device; signed-out visitors get a separate
// "guest" cart that's merged into their account cart the moment they log in.
function cartKey(){
  let m = null;
  try{ m = JSON.parse(localStorage.getItem("lf_member")); }catch{}
  return m ? `lf_cart_${m.id}` : "lf_cart_guest";
}
let cart = [];
try{ cart = JSON.parse(localStorage.getItem(cartKey())) || []; }catch{ cart = []; }

function saveCart(){ localStorage.setItem(cartKey(), JSON.stringify(cart)); updateCartBadge(); }

function updateCartBadge(){
  const count = cart.reduce((n, it) => n + it.qty, 0);
  document.querySelectorAll("#cartBadge, #cartBadgeMobile").forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "none";
  });
}
updateCartBadge();

// Folds anything added while browsing signed-out into the account's own cart,
// then clears the guest cart so it doesn't linger for the next visitor.
function mergeGuestCartInto(memberId){
  let guestCart = [];
  try{ guestCart = JSON.parse(localStorage.getItem("lf_cart_guest")) || []; }catch{ guestCart = []; }
  if(!guestCart.length) return;

  const memberKey = `lf_cart_${memberId}`;
  let memberCart = [];
  try{ memberCart = JSON.parse(localStorage.getItem(memberKey)) || []; }catch{ memberCart = []; }

  guestCart.forEach(gi => {
    const existing = memberCart.find(mi => mi.category === gi.category && mi.plan === gi.plan);
    if(existing) existing.qty += gi.qty;
    else memberCart.push(gi);
  });

  localStorage.setItem(memberKey, JSON.stringify(memberCart));
  localStorage.removeItem("lf_cart_guest");
}

function addToCart(category, plan, price){
  const existing = cart.find(it => it.category === category && it.plan === plan);
  if(existing) existing.qty += 1;
  else cart.push({ category, plan, price, qty: 1 });
  saveCart();
}
function changeQty(index, delta){
  const item = cart[index];
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0) cart.splice(index, 1);
  saveCart();
  renderCartModal();
}
function removeFromCart(index){
  cart.splice(index, 1);
  saveCart();
  renderCartModal();
}

function openCart(){
  const overlay = document.getElementById("cartOverlay");
  if(!overlay) return;
  overlay.classList.add("active");
  renderCartModal();
}
function closeCart(){ const overlay = document.getElementById("cartOverlay"); if(overlay) overlay.classList.remove("active"); }
const cartOverlayEl = document.getElementById("cartOverlay");
if(cartOverlayEl) cartOverlayEl.addEventListener("click", (e) => {
  if(e.target.id === "cartOverlay") closeCart();
});

function renderCartModal(){
  const box = document.getElementById("cartBox");
  const total = cart.reduce((sum, it) => sum + it.price * it.qty, 0);

  box.innerHTML = `
    <button class="modal-close" onclick="closeCart()">&times;</button>
    <div class="eyebrow modal-eyebrow">Your Cart</div>
    <h2>${cart.length ? "Review your plans" : "Your cart is empty"}</h2>
    ${cart.length ? "" : `<p class="modal-sub">Browse Plans &amp; Pricing and add whatever fits.</p>`}
    ${cart.map((it, i) => `
      <div class="cart-row">
        <div class="cart-row-info">
          <span class="cart-row-cat">${it.category}</span>
          <span class="cart-row-name">${it.plan}</span>
          <span class="cart-row-price">${formatNaira(it.price)} each</span>
        </div>
        <div class="cart-qty">
          <button onclick="changeQty(${i},-1)" aria-label="Decrease quantity">&minus;</button>
          <span>${it.qty}</span>
          <button onclick="changeQty(${i},1)" aria-label="Increase quantity">+</button>
        </div>
        <button class="cart-remove" onclick="removeFromCart(${i})" aria-label="Remove item">&times;</button>
      </div>
    `).join("")}
    ${cart.length ? `
      <div class="cart-total-row"><span>Total</span><b>${formatNaira(total)}</b></div>
      <div id="checkoutMsg"></div>
      <button class="btn btn-solid btn-block" onclick="handleCheckout()">Checkout</button>
      <p class="modal-sub" style="margin-top:14px;">Placeholder checkout — this records your order, a team member will reach out to confirm and collect payment. Online payment is coming soon.</p>
    ` : ""}
  `;
}

async function handleCheckout(){
  if(!currentMember){
    location.href = "login.html?next=" + encodeURIComponent(location.pathname);
    return;
  }
  const msg = document.getElementById("checkoutMsg");
  msg.innerHTML = `<p class="empty-note">Placing order…</p>`;
  try{
    const order = await apiCall("order-create", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ memberId: currentMember.id, items: cart })
    });
    cart = [];
    saveCart();
    document.getElementById("cartBox").innerHTML = `
      <button class="modal-close" onclick="closeCart()">&times;</button>
      <div class="eyebrow modal-eyebrow">${order.isMembershipOrder ? "Membership Requested" : "Order Placed"}</div>
      <h2>Thanks, ${currentMember.name.split(" ")[0]}!</h2>
      <p class="modal-sub">Your ${order.isMembershipOrder ? "membership request" : "order"} for <b style="color:var(--gold-light)">${formatNaira(order.total)}</b> is in as <b>pending</b>. A team member will reach out on WhatsApp to confirm and collect payment${order.isMembershipOrder ? " — your membership activates as soon as that's done" : ""}.</p>
      <button class="btn btn-outline btn-block" onclick="closeCart()">Done</button>
    `;
  }catch(err){
    msg.innerHTML = `<div class="form-error">${err.message}</div>`;
  }
}

/* ---------- Backend API (Netlify Functions + Firebase) ---------- */
const API = "/.netlify/functions";
const SESSION_KEY = "lf_member";

async function apiCall(path, options){
  let res;
  try{
    res = await fetch(`${API}/${path}`, options);
  }catch{
    throw new Error("Can't reach the server. Check your connection and try again.");
  }
  let data = {};
  try{ data = await res.json(); }catch{}
  if(!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

const apiSignup = (name, email, phone, password) => apiCall("signup", {
  method: "POST", headers: {"Content-Type":"application/json"},
  body: JSON.stringify({ name, email, phone, password })
});
const apiAdminSignup = (name, email, phone, password, adminCode) => apiCall("admin-signup", {
  method: "POST", headers: {"Content-Type":"application/json"},
  body: JSON.stringify({ name, email, phone, password, adminCode })
});
const apiLogin = (email, password) => apiCall("login", {
  method: "POST", headers: {"Content-Type":"application/json"},
  body: JSON.stringify({ email, password })
});
const apiCheckin = (memberId) => apiCall("checkin", {
  method: "POST", headers: {"Content-Type":"application/json"},
  body: JSON.stringify({ memberId })
});
const apiAttendance = (memberId) => apiCall(`attendance?memberId=${encodeURIComponent(memberId)}`, { method: "GET" });
const apiMembers = () => apiCall("members", { method: "GET" });
const apiMemberStatus = (memberId) => apiCall(`member-status?memberId=${encodeURIComponent(memberId)}`, { method: "GET" });
const apiMyOrders = (memberId) => apiCall(`my-orders?memberId=${encodeURIComponent(memberId)}`, { method: "GET" });
const apiOrdersList = () => apiCall("orders-list", { method: "GET" });
const apiOrderUpdateStatus = (orderId, status) => apiCall("order-update-status", {
  method: "POST", headers: {"Content-Type":"application/json"},
  body: JSON.stringify({ orderId, status })
});
const apiMemberRevoke = (memberId) => apiCall("member-revoke", {
  method: "POST", headers: {"Content-Type":"application/json"},
  body: JSON.stringify({ memberId })
});
const apiNotificationsList = (scope) => apiCall(`notifications-list?scope=${encodeURIComponent(scope)}`, { method: "GET" });
const apiNotificationsMarkAll = (scope) => apiCall("notifications-mark-read", {
  method: "POST", headers: {"Content-Type":"application/json"},
  body: JSON.stringify({ scope, markAll: true })
});
const apiMessagesThreads = () => apiCall("messages-threads", { method: "GET" });
const apiMessagesList = (memberId, viewerRole) => apiCall(`messages-list?memberId=${encodeURIComponent(memberId)}&viewerRole=${viewerRole}`, { method: "GET" });
const apiMessagesSend = (memberId, from, text) => apiCall("messages-send", {
  method: "POST", headers: {"Content-Type":"application/json"},
  body: JSON.stringify({ memberId, from, text })
});
const apiAnnouncementCreate = (title, body) => apiCall("announcement-create", {
  method: "POST", headers: {"Content-Type":"application/json"},
  body: JSON.stringify({ title, body })
});
const apiAnnouncementsList = () => apiCall("announcements-list", { method: "GET" });
const apiNewsletterSubscribe = (email) => apiCall("newsletter-subscribe", {
  method: "POST", headers: {"Content-Type":"application/json"},
  body: JSON.stringify({ email })
});

function timeAgo(iso){
  if(!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if(diff < 60) return "just now";
  if(diff < 3600) return Math.floor(diff/60) + "m ago";
  if(diff < 86400) return Math.floor(diff/3600) + "h ago";
  return Math.floor(diff/86400) + "d ago";
}

function saveSession(member){ localStorage.setItem(SESSION_KEY, JSON.stringify(member)); }
function loadSession(){
  try{ return JSON.parse(localStorage.getItem(SESSION_KEY)); }catch{ return null; }
}
function clearSession(){ localStorage.removeItem(SESSION_KEY); }

function updateAuthButtons(){
  const label = currentMember ? `Hi, ${currentMember.name.split(" ")[0]}` : "Member Login";
  document.querySelectorAll(".login-trigger-btn").forEach(btn => btn.textContent = label);
}

function todayStr(){ return new Date().toISOString().slice(0,10); }
function computeStreak(dates){
  if(!dates.length) return 0;
  const set = new Set(dates);
  let streak = 0, d = new Date();
  while(true){
    const key = d.toISOString().slice(0,10);
    if(set.has(key)){ streak++; d.setDate(d.getDate()-1); } else break;
  }
  return streak;
}

let currentMember = loadSession();
let authMode = "login";
updateAuthButtons();

// Where a just-logged-in (or already-logged-in) account belongs: admins go
// to their dashboard, members without an active paid membership go pick one,
// active members go to their own dashboard.
function landingPageFor(member){
  if(member.role === "admin") return "admin.html";
  if(!member.membershipActive) return "membership.html";
  return "dashboard.html";
}

// Re-checks this member's record in case their membership got confirmed
// elsewhere (the emailed one-click link, or the admin dashboard) while this
// tab was already open — refreshes the saved session and moves on if so.
async function checkMembershipStatus(){
  const btn = document.getElementById("checkStatusBtn");
  if(btn){ btn.disabled = true; btn.textContent = "Checking…"; }
  try{
    const fresh = await apiMemberStatus(currentMember.id);
    currentMember = fresh;
    saveSession(fresh);
    updateAuthButtons();
    if(fresh.membershipActive){
      location.href = "dashboard.html";
      return;
    }
  }catch{}
  if(btn){ btn.disabled = false; btn.textContent = "I've Paid — Check My Status"; }
}

function openAuth(){
  const params = new URLSearchParams(location.search);
  const next = params.get("next");
  if(currentMember){
    const landing = landingPageFor(currentMember);
    location.href = (landing !== "membership.html" && next) ? next : landing;
    return;
  }
  location.href = "login.html" + (location.pathname.endsWith("login.html") ? "" : "?next=" + encodeURIComponent(location.pathname));
}

function openContact(){ const o = document.getElementById("contactOverlay"); if(o) o.classList.add("active"); }
function closeContact(){ const o = document.getElementById("contactOverlay"); if(o) o.classList.remove("active"); }
const contactOverlayEl = document.getElementById("contactOverlay");
if(contactOverlayEl) contactOverlayEl.addEventListener("click", (e) => {
  if(e.target.id === "contactOverlay") closeContact();
});

function toggleAdminCode(){
  const field = document.getElementById("adminCodeField");
  const isHidden = field.style.display === "none";
  field.style.display = isHidden ? "block" : "none";
  document.getElementById("adminCodeToggleBtn").textContent = isHidden ? "Not staff? Hide this" : "Staff? Enter your admin invite code";
}

function renderAuthForm(err){
  authMode = authMode || "login";
  const box = document.getElementById("authPageBox");
  if(!box) return;
  box.innerHTML = `
    <div class="eyebrow modal-eyebrow">Member Access</div>
    <h2>${authMode === "login" ? "Welcome back" : "Join the floor"}</h2>
    <p class="modal-sub">${authMode === "login" ? "Log in to check in, shop, and message the gym." : "Create your account to start checking in."}</p>
    <form id="authForm">
      ${authMode === "signup" ? `<div class="field-group"><label>Full Name</label><input type="text" id="f_name" required></div>` : ""}
      <div class="field-group"><label>Email</label><input type="email" id="f_email" required></div>
      ${authMode === "signup" ? `<div class="field-group"><label>Phone Number</label><input type="tel" id="f_phone" placeholder="e.g. 08012345678" required></div>` : ""}
      <div class="field-group"><label>Password</label><input type="password" id="f_pass" required></div>
      ${authMode === "signup" ? `
        <div class="admin-code-row"><button type="button" class="admin-code-link" onclick="toggleAdminCode()" id="adminCodeToggleBtn">Staff? Enter your admin invite code</button></div>
        <div class="field-group" id="adminCodeField" style="display:none;">
          <label>Admin Invite Code</label>
          <input type="text" id="f_admincode" autocomplete="off">
        </div>
      ` : ""}
      ${err ? `<div class="form-error">${err}</div>` : ""}
      <button type="submit" class="btn btn-solid btn-block">${authMode === "login" ? "Log In" : "Create Account"}</button>
    </form>
    <div class="auth-switch">
      ${authMode === "login" ? `New here? <button onclick="authMode='signup';renderAuthForm()">Create an account</button>`
                              : `Already have an account? <button onclick="authMode='login';renderAuthForm()">Log in</button>`}
    </div>
  `;
  document.getElementById("authForm").addEventListener("submit", handleAuthSubmit);
}

async function handleAuthSubmit(e){
  e.preventDefault();
  const email = document.getElementById("f_email").value.trim();
  const pass = document.getElementById("f_pass").value;
  const submitBtn = e.target.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  submitBtn.textContent = "Please wait…";

  try{
    let member;
    if(authMode === "signup"){
      const name = document.getElementById("f_name").value.trim();
      const phone = document.getElementById("f_phone").value.trim();
      const adminCodeField = document.getElementById("f_admincode");
      const adminCode = adminCodeField ? adminCodeField.value.trim() : "";
      member = adminCode ? await apiAdminSignup(name, email, phone, pass, adminCode) : await apiSignup(name, email, phone, pass);
    } else {
      member = await apiLogin(email, pass);
    }
    currentMember = member;
    saveSession(member);
    mergeGuestCartInto(member.id);
    updateAuthButtons();
    const params = new URLSearchParams(location.search);
    const next = params.get("next");
    const landing = landingPageFor(member);
    // Only honor "next" (e.g. bounced back from checkout) if they actually
    // land somewhere they're allowed into — a brand-new/inactive member gets
    // sent to pick a membership regardless, since Shop stays locked either way.
    location.href = (landing !== "membership.html" && next) ? next : landing;
  }catch(err){
    renderAuthForm(err.message);
  }
}

let memberTab = "checkin";

async function renderDashboard(){
  memberTab = "checkin";
  const box = document.getElementById("dashPageBox");
  box.className = "dash-shell";
  box.innerHTML = `
    <div class="dash-hi">Welcome back</div>
    <div class="dash-name dash-name-lg">${currentMember.name.split(" ")[0]}
      ${currentMember.role !== "admin" ? `<span class="status-pill ${currentMember.membershipActive ? "confirmed" : "cancelled"}" style="vertical-align:middle;margin-left:10px;">${currentMember.membershipActive ? `Member${currentMember.membershipExpiresAt ? ` until ${currentMember.membershipExpiresAt.slice(0,10)}` : ""}` : "Not a member"}</span>` : ""}
    </div>
    <div class="dash-tabs" id="memberTabs">
      <button class="dash-tab" data-tab="checkin">Check-In</button>
      <button class="dash-tab" data-tab="plans">Plans</button>
      <button class="dash-tab" data-tab="orders">My Orders</button>
      <button class="dash-tab" data-tab="notifications">Notifications<span class="tab-dot" id="notifDot" style="display:none;"></span></button>
      <button class="dash-tab" data-tab="messages">Messages<span class="tab-dot" id="msgDot" style="display:none;"></span></button>
    </div>
    <div id="memberTabBody"><p class="empty-note">Loading…</p></div>
  `;
  box.querySelectorAll(".dash-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      memberTab = btn.dataset.tab;
      updateMemberTabsUI();
      renderMemberTabBody();
    });
  });
  updateMemberTabsUI();
  renderMemberTabBody();
  refreshMemberBadges();
}

function updateMemberTabsUI(){
  document.querySelectorAll("#memberTabs .dash-tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === memberTab);
  });
}

async function refreshMemberBadges(){
  try{
    const { notifications } = await apiNotificationsList(currentMember.id);
    const notifDot = document.getElementById("notifDot");
    if(notifDot) notifDot.style.display = notifications.some(n => !n.read) ? "inline-block" : "none";
  }catch{}
  try{
    const { messages } = await apiMessagesList(currentMember.id, "");
    const msgDot = document.getElementById("msgDot");
    if(msgDot) msgDot.style.display = messages.some(m => m.from === "admin" && !m.read) ? "inline-block" : "none";
  }catch{}
}

async function renderMemberTabBody(){
  const el = document.getElementById("memberTabBody");
  el.innerHTML = `<p class="empty-note">Loading…</p>`;
  try{
    if(memberTab === "checkin") return await renderMemberCheckin(el);
    if(memberTab === "plans") return await renderMemberPlans(el);
    if(memberTab === "orders") return await renderMemberOrders(el);
    if(memberTab === "notifications") return await renderMemberNotifications(el);
    if(memberTab === "messages") return await renderMemberMessages(el);
  }catch(err){
    el.innerHTML = `<p class="empty-note">${err.message}</p>`;
  }
}

async function renderMemberCheckin(el){
  const { dates } = await apiAttendance(currentMember.id);
  const checkedToday = dates.includes(todayStr());
  const last7 = Array.from({length:7}).map((_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-(6-i));
    const key = d.toISOString().slice(0,10);
    return { key, label: d.toLocaleDateString(undefined,{weekday:"narrow"}), on: dates.includes(key) };
  });
  el.innerHTML = `
    <div class="checkin-ring ${checkedToday ? "done" : ""}" id="ringBtn">
      <div class="big-ico">${checkedToday ? "&#10003;" : "&#128170;"}</div>
      <div class="lbl">${checkedToday ? "CHECKED IN" : "TICK IN"}</div>
      ${checkedToday ? "" : `<div class="sub">tap when you arrive</div>`}
    </div>
    <div class="day-track">
      ${last7.map(d => `<div class="day-cell"><span class="d">${d.label}</span><div class="box ${d.on ? "on" : ""}">${d.on ? "&#10003;" : ""}</div></div>`).join("")}
    </div>
    <div class="dash-note">Total check-ins: <b style="color:var(--cream)">${dates.length}</b>.</div>
  `;
  document.getElementById("ringBtn").addEventListener("click", () => handleCheckin(dates, checkedToday));
}

async function handleCheckin(dates, checkedToday){
  if(checkedToday) return;
  const ring = document.getElementById("ringBtn");
  ring.style.pointerEvents = "none";
  try{
    await apiCheckin(currentMember.id);
    renderMemberCheckin(document.getElementById("memberTabBody"));
  }catch(err){
    ring.style.pointerEvents = "";
    alert(err.message);
  }
}

async function renderMemberPlans(el){
  el.innerHTML = `<p class="modal-sub">Add a plan, then check out from your cart.</p><div class="plan-grid" id="dashPlansGrid"></div>`;
  renderPlans("dashPlansGrid");
}

async function renderMemberOrders(el){
  const { orders } = await apiMyOrders(currentMember.id);
  if(!orders.length){ el.innerHTML = `<p class="empty-note">No orders yet — check out the Plans tab.</p>`; return; }
  el.innerHTML = orders.map(o => `
    <div class="order-card">
      <div class="order-top">
        <div class="notif-time">${timeAgo(o.createdAt)}</div>
        <span class="status-pill ${o.status}">${o.status}</span>
      </div>
      <div class="order-items">${o.items.map(it => `${it.qty}× ${it.plan} (${it.category}) — ${formatNaira(it.price * it.qty)}`).join("<br>")}</div>
      <div class="order-items"><b style="color:var(--cream)">Total: ${formatNaira(o.total)}</b></div>
    </div>
  `).join("");
}

async function renderMemberNotifications(el){
  const { notifications } = await apiNotificationsList(currentMember.id);
  const unread = notifications.filter(n => !n.read).length;
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <h3 style="color:var(--cream);font-size:15px;">Notifications</h3>
      ${unread ? `<button class="btn btn-outline" style="padding:8px 14px;font-size:11px;" onclick="handleMarkAllNotifs('${currentMember.id}')">Mark all read</button>` : ""}
    </div>
    ${notifications.length ? notifications.map(n => `
      <div class="notif-row ${n.read ? "" : "unread"}">
        <span class="notif-dot ${n.read ? "read" : ""}"></span>
        <div>
          <div class="notif-title">${n.title}</div>
          <div class="notif-body">${n.body || ""}</div>
          <div class="notif-time">${timeAgo(n.createdAt)}</div>
        </div>
      </div>
    `).join("") : `<p class="empty-note">Nothing yet.</p>`}
  `;
  const dot = document.getElementById("notifDot");
  if(dot) dot.style.display = "none";
}

async function renderMemberMessages(el){
  await renderThreadView(el, currentMember.id, "member");
  const dot = document.getElementById("msgDot");
  if(dot) dot.style.display = "none";
}

function doLogout(){ currentMember = null; clearSession(); updateAuthButtons(); authMode = "login"; location.href = "index.html"; }

let adminTab = "members";
let adminActiveThread = null;

async function renderAdmin(){
  adminTab = "members";
  adminActiveThread = null;
  const box = document.getElementById("dashPageBox");
  box.className = "dash-shell";
  box.innerHTML = `
    <div class="dash-hi">Admin Dashboard</div>
    <div class="dash-name dash-name-lg">${currentMember.name.split(" ")[0]}</div>
    <div class="dash-tabs" id="adminTabs">
      <button class="dash-tab" data-tab="members">Members</button>
      <button class="dash-tab" data-tab="orders">Orders</button>
      <button class="dash-tab" data-tab="messages">Messages</button>
      <button class="dash-tab" data-tab="notifications">Notifications</button>
      <button class="dash-tab" data-tab="announcements">Announce</button>
    </div>
    <div id="adminTabBody"><p class="empty-note">Loading…</p></div>
  `;
  box.querySelectorAll(".dash-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      adminTab = btn.dataset.tab;
      adminActiveThread = null;
      updateAdminTabsUI();
      renderAdminTabBody();
    });
  });
  updateAdminTabsUI();
  renderAdminTabBody();
}

function updateAdminTabsUI(){
  document.querySelectorAll("#adminTabs .dash-tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === adminTab);
  });
}

async function renderAdminTabBody(){
  const el = document.getElementById("adminTabBody");
  el.innerHTML = `<p class="empty-note">Loading…</p>`;
  try{
    if(adminTab === "members") return await renderAdminMembers(el);
    if(adminTab === "orders") return await renderAdminOrders(el);
    if(adminTab === "messages") return await renderAdminMessages(el);
    if(adminTab === "notifications") return await renderAdminNotifications(el);
    if(adminTab === "announcements") return await renderAdminAnnouncements(el);
  }catch(err){
    el.innerHTML = `<p class="empty-note">${err.message}</p>`;
  }
}

async function renderAdminMembers(el){
  const { members } = await apiMembers();
  const rows = members.map(m => `
      <div class="admin-row">
        <div>
          <div class="m-name">${m.name} <span class="role-pill ${m.role === "admin" ? "admin" : ""}">${m.role === "admin" ? "Admin" : "Member"}</span></div>
          <div class="m-email">${m.email}${m.phone ? " · " + m.phone : ""} · joined ${m.joined}</div>
          ${m.role === "admin" ? "" : `<div class="m-email">${m.membershipActive
            ? `<span class="status-pill confirmed">Member${m.membershipExpiresAt ? ` until ${m.membershipExpiresAt.slice(0,10)}` : ""}</span>`
            : `<span class="status-pill cancelled">Not a member</span>`}</div>`}
        </div>
        <div class="admin-stats">
          <div><span class="n">${m.visits}</span><span class="l">visits</span></div>
          <div><span class="n">${computeStreak(m.dates)}</span><span class="l">streak</span></div>
          ${m.role !== "admin" && m.membershipActive ? `<button class="admin-revoke-btn" onclick="handleRevokeMembership('${m.id}','${m.name.replace(/'/g, "\\'")}')">Revoke</button>` : ""}
        </div>
      </div>`).join("");
  el.innerHTML = `<h3 style="color:var(--cream);font-size:15px;margin-bottom:14px;">Members (${members.length})</h3>${members.length ? rows : `<p class="empty-note">No members have signed up yet.</p>`}`;
}

async function handleRevokeMembership(memberId, name){
  if(!confirm(`Remove ${name}'s active membership? They'll lose Shop access until they pay again.`)) return;
  try{ await apiMemberRevoke(memberId); renderAdminTabBody(); }
  catch(err){ alert(err.message); }
}

async function renderAdminOrders(el){
  const { orders } = await apiOrdersList();
  if(!orders.length){ el.innerHTML = `<p class="empty-note">No orders yet.</p>`; return; }
  el.innerHTML = orders.map(o => `
    <div class="order-card">
      <div class="order-top">
        <div>
          <div class="m-name">${o.memberName}</div>
          <div class="m-email">${o.memberEmail}${o.memberPhone ? " · " + o.memberPhone : ""} · ${timeAgo(o.createdAt)}</div>
        </div>
        <span class="status-pill ${o.status}">${o.status}</span>
      </div>
      <div class="order-items">${o.items.map(it => `${it.qty}× ${it.plan} (${it.category}) — ${formatNaira(it.price * it.qty)}`).join("<br>")}</div>
      <div class="order-items"><b style="color:var(--cream)">Total: ${formatNaira(o.total)}</b></div>
      <div class="order-actions">
        <button onclick="handleOrderStatus('${o.id}','confirmed')" ${o.status==="confirmed"?"disabled":""}>Mark Confirmed</button>
        <button onclick="handleOrderStatus('${o.id}','pending')" ${o.status==="pending"?"disabled":""}>Mark Pending</button>
        <button onclick="handleOrderStatus('${o.id}','cancelled')" ${o.status==="cancelled"?"disabled":""}>Cancel</button>
      </div>
    </div>
  `).join("");
}

async function handleOrderStatus(orderId, status){
  try{ await apiOrderUpdateStatus(orderId, status); renderAdminTabBody(); }
  catch(err){ alert(err.message); }
}

async function renderAdminNotifications(el){
  const { notifications } = await apiNotificationsList("admin");
  const unread = notifications.filter(n => !n.read).length;
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <h3 style="color:var(--cream);font-size:15px;">Notifications ${unread ? `(${unread} unread)` : ""}</h3>
      ${unread ? `<button class="btn btn-outline" style="padding:8px 14px;font-size:11px;" onclick="handleMarkAllNotifs('admin')">Mark all read</button>` : ""}
    </div>
    ${notifications.length ? notifications.map(n => `
      <div class="notif-row ${n.read ? "" : "unread"}">
        <span class="notif-dot ${n.read ? "read" : ""}"></span>
        <div>
          <div class="notif-title">${n.title}</div>
          <div class="notif-body">${n.body || ""}</div>
          <div class="notif-time">${timeAgo(n.createdAt)}</div>
        </div>
      </div>
    `).join("") : `<p class="empty-note">No notifications yet.</p>`}
  `;
}

async function handleMarkAllNotifs(scope){
  try{ await apiNotificationsMarkAll(scope); renderAdminTabBody(); }
  catch(err){ alert(err.message); }
}

function backFromAdminThread(){ adminActiveThread = null; renderAdminTabBody(); }

async function renderAdminMessages(el){
  if(adminActiveThread){
    return renderThreadView(el, adminActiveThread, "admin", "backFromAdminThread");
  }
  const { threads } = await apiMessagesThreads();
  if(!threads.length){ el.innerHTML = `<p class="empty-note">No messages yet.</p>`; return; }
  el.innerHTML = threads.map(t => `
    <div class="thread-row" onclick="openAdminThread('${t.memberId}')">
      <div>
        <div class="m-name">${t.memberName} ${t.unread ? `<span class="tab-dot"></span>` : ""}</div>
        <div class="thread-preview">${t.lastFrom === "admin" ? "You: " : ""}${t.lastText}</div>
      </div>
      <div class="notif-time">${timeAgo(t.lastAt)}</div>
    </div>
  `).join("");
}
function openAdminThread(memberId){ adminActiveThread = memberId; renderAdminTabBody(); }

async function renderThreadView(el, memberId, viewerRole, onBackFnName){
  el.innerHTML = `<p class="empty-note">Loading…</p>`;
  const { messages } = await apiMessagesList(memberId, viewerRole);
  el.innerHTML = `
    ${onBackFnName ? `<button onclick="${onBackFnName}()" style="background:none;border:none;color:var(--gold-light);cursor:pointer;text-decoration:underline;font-size:12.5px;margin-bottom:14px;">&larr; Back</button>` : ""}
    <div class="msg-list" id="msgList">
      ${messages.length ? messages.map(m => `
        <div class="msg-bubble ${m.from === viewerRole ? "mine" : "theirs"}">
          ${m.text}
          <span class="msg-time">${timeAgo(m.createdAt)}</span>
        </div>
      `).join("") : `<p class="empty-note">No messages yet — say hello.</p>`}
    </div>
    <div class="msg-input-row">
      <input type="text" id="msgInput" placeholder="Type a message…" maxlength="2000">
      <button class="btn btn-solid" style="border:none;cursor:pointer;" onclick="handleSendMessage('${memberId}','${viewerRole}')">Send</button>
    </div>
  `;
  const list = document.getElementById("msgList");
  list.scrollTop = list.scrollHeight;
  document.getElementById("msgInput").addEventListener("keydown", (e) => {
    if(e.key === "Enter") handleSendMessage(memberId, viewerRole);
  });
}

async function handleSendMessage(memberId, viewerRole){
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if(!text) return;
  input.disabled = true;
  try{
    await apiMessagesSend(memberId, viewerRole, text);
    if(viewerRole === "admin") renderThreadView(document.getElementById("adminTabBody"), memberId, "admin", "backFromAdminThread");
    else renderMemberMessages(document.getElementById("memberTabBody"));
  }catch(err){
    alert(err.message);
    input.disabled = false;
  }
}

async function renderAdminAnnouncements(el){
  const { announcements } = await apiAnnouncementsList();
  el.innerHTML = `
    <form id="annForm" style="margin-bottom:24px;">
      <div class="field-group"><label>Title</label><input type="text" id="ann_title" required placeholder="e.g. New HIIT class this Saturday"></div>
      <div class="field-group"><label>Details</label><input type="text" id="ann_body" required placeholder="Short description members will see"></div>
      <div id="annMsg"></div>
      <button type="submit" class="btn btn-solid btn-block">Publish &amp; Notify Members</button>
    </form>
    <h3 style="color:var(--cream);font-size:15px;margin-bottom:8px;">Past announcements</h3>
    ${announcements.length ? announcements.map(a => `
      <div class="announcement-card">
        <div class="announcement-title">${a.title}</div>
        <div class="announcement-body">${a.body}</div>
        <div class="announcement-time">${timeAgo(a.createdAt)}</div>
      </div>
    `).join("") : `<p class="empty-note">Nothing published yet.</p>`}
  `;
  document.getElementById("annForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("ann_title").value.trim();
    const body = document.getElementById("ann_body").value.trim();
    const msg = document.getElementById("annMsg");
    msg.innerHTML = `<p class="empty-note">Publishing…</p>`;
    try{
      const res = await apiAnnouncementCreate(title, body);
      msg.innerHTML = `<p class="empty-note">Published — ${res.notified} member(s) notified${res.emailed ? `, ${res.emailed} emailed` : ""}.</p>`;
      renderAdminAnnouncements(el);
    }catch(err){
      msg.innerHTML = `<div class="form-error">${err.message}</div>`;
    }
  });
}

/* ---------- Newsletter signup (not every page has this form) ---------- */
const newsletterForm = document.getElementById("newsletterForm");
if(newsletterForm) newsletterForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const emailInput = document.getElementById("newsletterEmail");
  const msg = document.getElementById("newsletterMsg");
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  msg.textContent = "";
  try{
    await apiNewsletterSubscribe(emailInput.value.trim());
    msg.textContent = "You're subscribed — thanks for joining!";
    emailInput.value = "";
  }catch(err){
    msg.textContent = err.message;
  }finally{
    btn.disabled = false;
  }
});

/* ---------- Dedicated dashboard/admin/login pages ---------- */
const pageType = document.body.dataset.page;

const navUserNameEl = document.getElementById("navUserName");
if(navUserNameEl && currentMember) navUserNameEl.textContent = currentMember.name.split(" ")[0];
if(currentMember && currentMember.role === "admin"){
  document.querySelectorAll(".admin-only-link").forEach(el => { el.style.display = "flex"; });
}

if(pageType === "dashboard"){
  if(!currentMember) location.href = "index.html";
  else if(currentMember.role !== "admin" && !currentMember.membershipActive) location.href = "membership.html";
  else renderDashboard();
}
if(pageType === "admin"){
  if(!currentMember) location.href = "index.html";
  else if(currentMember.role !== "admin") location.href = "dashboard.html";
  else renderAdmin();
}
if(pageType === "shop"){
  if(!currentMember) location.href = "login.html?next=" + encodeURIComponent(location.pathname);
  else if(currentMember.role !== "admin" && !currentMember.membershipActive) location.href = "membership.html";
}
if(pageType === "membership"){
  if(!currentMember) location.href = "login.html?next=membership.html";
  else if(currentMember.role === "admin" || currentMember.membershipActive) location.href = landingPageFor(currentMember);
  else{
    // The plan grid was already rendered above. Membership might get
    // confirmed from the emailed link while this tab is still open — that
    // updates the database but not this already-loaded session, so check
    // for it periodically (and let the "I've paid" button check right away).
    checkMembershipStatus();
    setInterval(checkMembershipStatus, 15000);
  }
}
if(pageType === "login"){
  if(currentMember){
    const params = new URLSearchParams(location.search);
    const next = params.get("next");
    const landing = landingPageFor(currentMember);
    location.href = (landing !== "membership.html" && next) ? next : landing;
  } else {
    renderAuthForm();
  }
}
