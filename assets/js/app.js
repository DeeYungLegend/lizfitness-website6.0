const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
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
  burgerBtn.addEventListener('click', openMobileNav);
  mobileNavClose.addEventListener('click', closeMobileNav);
  mobileNavOverlay.addEventListener('click', closeMobileNav);
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileNav));
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeMobileNav(); });

/* ---------- Plans / pricing (placeholder catalog, no live payment gateway yet) ---------- */
const PLANS = [
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
  { category: "Diet & Organic Supplement Drink", items: [
    { plan: "Weight Loss Diet Monthly", price: 15000 },
    { plan: "Weight Gain Diet Monthly", price: 20000 },
    { plan: "Organic Weight Gain / Body Builder Protein Powder", price: 20000 },
    { plan: "Weight Loss Drink (per 5ltrs)", price: 15000 },
    { plan: "Detox Drink", price: 2000 },
  ]},
];

function formatNaira(n){ return "₦" + Number(n).toLocaleString("en-NG"); }

function renderPlans(){
  const grid = document.getElementById("plansGrid");
  grid.innerHTML = PLANS.map(cat => `
    <div class="plan-card">
      <h3>${cat.category}</h3>
      ${cat.items.map(it => `
        <div class="plan-item">
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
renderPlans();

/* ---------- Cart ---------- */
const CART_KEY = "lf_cart";
let cart = [];
try{ cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; }catch{ cart = []; }

function saveCart(){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartBadge(); }

function updateCartBadge(){
  const count = cart.reduce((n, it) => n + it.qty, 0);
  document.querySelectorAll("#cartBadge, #cartBadgeMobile").forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "none";
  });
}
updateCartBadge();

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
  document.getElementById("cartOverlay").classList.add("active");
  renderCartModal();
}
function closeCart(){ document.getElementById("cartOverlay").classList.remove("active"); }
document.getElementById("cartOverlay").addEventListener("click", (e) => {
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
    closeCart();
    authMode = "login";
    openAuth();
    renderAuthForm("Please log in or create an account first, then check out again.");
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
      <div class="eyebrow modal-eyebrow">Order Placed</div>
      <h2>Thanks, ${currentMember.name.split(" ")[0]}!</h2>
      <p class="modal-sub">Your order for <b style="color:var(--gold-light)">${formatNaira(order.total)}</b> is in as <b>pending</b>. A team member will reach out on WhatsApp to confirm and collect payment.</p>
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

const apiSignup = (name, email, password) => apiCall("signup", {
  method: "POST", headers: {"Content-Type":"application/json"},
  body: JSON.stringify({ name, email, password })
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

function openAuth(){
  document.getElementById("authOverlay").classList.add("active");
  currentMember ? renderDashboard() : renderAuthForm();
}
function closeAuth(){ document.getElementById("authOverlay").classList.remove("active"); }

function openContact(){ document.getElementById("contactOverlay").classList.add("active"); }
function closeContact(){ document.getElementById("contactOverlay").classList.remove("active"); }
document.getElementById("contactOverlay").addEventListener("click", (e) => {
  if(e.target.id === "contactOverlay") closeContact();
});

function renderAuthForm(err){
  authMode = authMode || "login";
  const box = document.getElementById("authBox");
  box.className = "modal-box";
  box.innerHTML = `
    <button class="modal-close" onclick="closeAuth()">&times;</button>
    <div class="eyebrow modal-eyebrow">Member Access</div>
    <h2>${authMode === "login" ? "Welcome back" : "Join the floor"}</h2>
    <p class="modal-sub">${authMode === "login" ? "Log in to check in for today." : "Create your member account to start checking in."}</p>
    <form id="authForm">
      ${authMode === "signup" ? `<div class="field-group"><label>Full Name</label><input type="text" id="f_name" required></div>` : ""}
      <div class="field-group"><label>Email</label><input type="email" id="f_email" required></div>
      <div class="field-group"><label>Password</label><input type="password" id="f_pass" required></div>
      ${err ? `<div class="form-error">${err}</div>` : ""}
      <button type="submit" class="btn btn-solid btn-block">${authMode === "login" ? "Log In" : "Create Account"}</button>
    </form>
    <div class="auth-switch">
      ${authMode === "login" ? `New here? <button onclick="authMode='signup';renderAuthForm()">Create an account</button>`
                              : `Already a member? <button onclick="authMode='login';renderAuthForm()">Log in</button>`}
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
    const member = authMode === "signup"
      ? await apiSignup(document.getElementById("f_name").value.trim(), email, pass)
      : await apiLogin(email, pass);
    currentMember = member;
    saveSession(member);
    updateAuthButtons();
    renderDashboard();
  }catch(err){
    renderAuthForm(err.message);
  }
}

async function renderDashboard(){
  const box = document.getElementById("authBox");
  box.className = "modal-box";
  box.innerHTML = `<p class="empty-note">Loading…</p>`;
  let dates;
  try{
    ({ dates } = await apiAttendance(currentMember.id));
  }catch(err){
    box.innerHTML = `<button class="modal-close" onclick="closeAuth()">&times;</button><p class="empty-note">${err.message}</p>`;
    return;
  }
  const checkedToday = dates.includes(todayStr());
  const streak = computeStreak(dates);
  const last7 = Array.from({length:7}).map((_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-(6-i));
    const key = d.toISOString().slice(0,10);
    return { key, label: d.toLocaleDateString(undefined,{weekday:"narrow"}), on: dates.includes(key) };
  });

  box.innerHTML = `
    <button class="modal-close" onclick="closeAuth()">&times;</button>
    <div class="dash-top">
      <div><div class="dash-hi">Welcome back</div><div class="dash-name">${currentMember.name.split(" ")[0]}</div></div>
      <div style="display:flex;gap:8px;">
        ${currentMember.role === "admin" ? `<button class="icon-btn" title="Admin" onclick="renderAdmin()">&#9776;</button>` : ""}
        <button class="icon-btn" title="Log out" onclick="doLogout()">&#8594;</button>
      </div>
    </div>
    <div class="checkin-ring ${checkedToday ? "done" : ""}" id="ringBtn">
      <div class="big-ico">${checkedToday ? "&#10003;" : "&#128170;"}</div>
      <div class="lbl">${checkedToday ? "CHECKED IN" : "TICK IN"}</div>
      ${checkedToday ? "" : `<div class="sub">tap when you arrive</div>`}
    </div>
    <div class="streak-line">&#128293; <span class="n">${streak}</span> day streak</div>
    <div class="day-track">
      ${last7.map(d => `<div class="day-cell"><span class="d">${d.label}</span><div class="box ${d.on ? "on" : ""}">${d.on ? "&#10003;" : ""}</div></div>`).join("")}
    </div>
    <div class="dash-note">Total check-ins: <b style="color:var(--cream)">${dates.length}</b>. Payment plans and nutrition tracking are coming soon.</div>
  `;
  document.getElementById("ringBtn").addEventListener("click", () => handleCheckin(dates, checkedToday));
}

async function handleCheckin(dates, checkedToday){
  if(checkedToday) return;
  const ring = document.getElementById("ringBtn");
  ring.style.pointerEvents = "none";
  try{
    await apiCheckin(currentMember.id);
    renderDashboard();
  }catch(err){
    ring.style.pointerEvents = "";
    alert(err.message);
  }
}

function doLogout(){ currentMember = null; clearSession(); updateAuthButtons(); authMode = "login"; renderAuthForm(); }

async function renderAdmin(){
  const box = document.getElementById("authBox");
  box.className = "modal-box wide";
  box.innerHTML = `<p class="empty-note">Loading members…</p>`;
  let members;
  try{
    ({ members } = await apiMembers());
  }catch(err){
    box.innerHTML = `<button class="modal-close" onclick="closeAuth()">&times;</button><p class="empty-note">${err.message}</p>`;
    return;
  }
  const rows = members.map(m => `
      <div class="admin-row">
        <div><div class="m-name">${m.name}</div><div class="m-email">${m.email} · joined ${m.joined}</div></div>
        <div class="admin-stats">
          <div><span class="n">${m.visits}</span><span class="l">visits</span></div>
          <div><span class="n">${computeStreak(m.dates)}</span><span class="l">streak</span></div>
        </div>
      </div>`).join("");
  box.innerHTML = `
    <button class="modal-close" onclick="closeAuth()">&times;</button>
    <div class="eyebrow modal-eyebrow">Admin</div>
    <h2>Members (${members.length})</h2>
    <p class="modal-sub"><button onclick="renderDashboard()" style="background:none;border:none;color:var(--gold-light);cursor:pointer;text-decoration:underline;font-size:12.5px;">&larr; Back to dashboard</button></p>
    ${members.length ? rows : `<p class="empty-note">No members have signed up yet.</p>`}
  `;
}

document.getElementById("authOverlay").addEventListener("click", (e) => {
  if(e.target.id === "authOverlay") closeAuth();
});
