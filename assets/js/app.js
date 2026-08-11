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

/* ---------- Storage helpers (shared app "database") ---------- */
const MEMBERS_KEY = "members";
const attKey = (id) => `attendance:${id}`;

async function getMembers(){
  try{ const r = await window.storage.get(MEMBERS_KEY, true); return r ? JSON.parse(r.value) : []; }
  catch{ return []; }
}
async function saveMembers(list){ await window.storage.set(MEMBERS_KEY, JSON.stringify(list), true); }
async function getAttendance(id){
  try{ const r = await window.storage.get(attKey(id), true); return r ? JSON.parse(r.value) : []; }
  catch{ return []; }
}
async function saveAttendance(id, dates){ await window.storage.set(attKey(id), JSON.stringify(dates), true); }

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

let currentMember = null;
let authMode = "login";

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
  const members = await getMembers();
  const existing = members.find(m => m.email.toLowerCase() === email.toLowerCase());

  if(authMode === "signup"){
    const name = document.getElementById("f_name").value.trim();
    if(existing) return renderAuthForm("An account with that email already exists.");
    if(!name || !email || pass.length < 4) return renderAuthForm("Fill in your name, email, and a password (4+ characters).");
    const member = { id: "m_"+Date.now()+"_"+Math.random().toString(36).slice(2,7), name, email, password: pass, joined: todayStr(), role: "member" };
    await saveMembers([...members, member]);
    currentMember = member;
    renderDashboard();
  } else {
    if(!existing || existing.password !== pass) return renderAuthForm("No match found. Check your details, or sign up.");
    currentMember = existing;
    renderDashboard();
  }
}

async function renderDashboard(){
  const box = document.getElementById("authBox");
  box.className = "modal-box";
  box.innerHTML = `<p class="empty-note">Loading…</p>`;
  const dates = await getAttendance(currentMember.id);
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
  const next = [...dates, todayStr()];
  await saveAttendance(currentMember.id, next);
  renderDashboard();
}

function doLogout(){ currentMember = null; authMode = "login"; renderAuthForm(); }

async function renderAdmin(){
  const box = document.getElementById("authBox");
  box.className = "modal-box wide";
  box.innerHTML = `<p class="empty-note">Loading members…</p>`;
  const members = await getMembers();
  let rows = "";
  for(const m of members){
    const dates = await getAttendance(m.id);
    const streak = computeStreak(dates);
    rows += `
      <div class="admin-row">
        <div><div class="m-name">${m.name}</div><div class="m-email">${m.email} · joined ${m.joined}</div></div>
        <div class="admin-stats">
          <div><span class="n">${dates.length}</span><span class="l">visits</span></div>
          <div><span class="n">${streak}</span><span class="l">streak</span></div>
        </div>
      </div>`;
  }
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
