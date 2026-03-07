const CIPHER_KEY = "fswitch_k9mQzR3pLwBvNtCdHjGsUoEy";

function xorCipher(str, key) {
    let o = '';
    for (let i = 0; i < str.length; i++)
        o += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    return o;
}
function encodeVal(plain) { return btoa(xorCipher(plain, CIPHER_KEY)); }
function decodeVal(enc)   { return xorCipher(atob(enc), CIPHER_KEY); }

// ── Encrypted Firebase credentials (XOR + base64) ──
const _EC = {
    apiKey:            "JzoNCCcaKhEZChQdTTR4GHsvHQwNAycdOCsKGWUfKAk3C0ECIyol",
    authDomain:        "AB8eGQcUASsIUUBjGGNWSGIRKwQrFiIXLQs3A3sMKhQ=",
    projectId:         "AB8eGQcUASsIUUBjGGNWSA==",
    storageBucket:     "AB8eGQcUASsIUUBjGGNWSGIRKwQrFiIXLRkzHCcOIhxIEgcZ",
    messagingSenderId: "X0ZOXUdbX2pSDFpi",
    appId:             "V0lOXE1XW2dcDFRkTWEJBykVeEB8QHZRKlxzRGMKdk4DEEBZQ1IMZgg=",
    measurementId:     "IV4kLEU7MgcyalkB",
};
function getAdmin() { return [decodeVal("FBoBDAYFGjAGVQw/HhJUHS0eLlgtGy4="), decodeVal("CxATD0NVWB8MVAw4FnxQHyE=") ]; }

// ═══════════════════════════════════════════════════════
firebase.initializeApp({
    apiKey:            decodeVal(_EC.apiKey),
    authDomain:        decodeVal(_EC.authDomain),
    projectId:         decodeVal(_EC.projectId),
    storageBucket:     decodeVal(_EC.storageBucket),
    messagingSenderId: decodeVal(_EC.messagingSenderId),
    appId:             decodeVal(_EC.appId),
    measurementId:     decodeVal(_EC.measurementId),
});
const auth = firebase.auth();
const db   = firebase.firestore();

let currentUser = null, isAdmin = false, allPosts = [];

// ── Nav ──
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('section-' + id).classList.add('active');
    if (id !== 'news') closeNewsDetail(true);
    window.scrollTo(0, 0);
}

// ── FAQ ──
function toggleFaq(el) { el.classList.toggle('open'); }

// ── Auth modal ──
function openAuthModal() {
    document.getElementById('auth-modal').classList.add('open');
    const isAnon = !!(currentUser && currentUser.isAnonymous);
    if (currentUser && !isAnon) {
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById('form-loggedin').classList.add('active');
        document.getElementById('logged-in-name').textContent = currentUser.displayName || currentUser.email || 'Player';
        document.getElementById('modal-heading').textContent = 'Account';
        document.getElementById('modal-tabs').style.display = 'none';
    } else {
        document.getElementById('modal-heading').textContent = 'Player Login';
        document.getElementById('modal-tabs').style.display = '';
        switchAuthTab('login', document.querySelector('.modal-tab'));
    }
}
function closeAuthModal() { document.getElementById('auth-modal').classList.remove('open'); }
function switchAuthTab(tab, el) {
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('form-' + tab).classList.add('active');
    if (el) el.classList.add('active');
}

// ── Auth actions ──
async function doLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-pass').value;
    const msg   = document.getElementById('login-msg');
    setMsg(msg,'','');
    if (!email||!pass) { setMsg(msg,'Fill in all fields.','error'); return; }
    try { await auth.signInWithEmailAndPassword(email,pass); closeAuthModal(); showToast('Signed in.'); }
    catch(e) { setMsg(msg,fmtErr(e.code),'error'); }
}
async function doRegister() {
    const name  = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass  = document.getElementById('reg-pass').value;
    const msg   = document.getElementById('reg-msg');
    setMsg(msg,'','');
    if (!name||!email||!pass) { setMsg(msg,'Fill in all fields.','error'); return; }
    if (pass.length<6) { setMsg(msg,'Password must be 6+ characters.','error'); return; }
    try {
        const c = await auth.createUserWithEmailAndPassword(email,pass);
        await c.user.updateProfile({ displayName: name });
        closeAuthModal(); showToast('Account created.');
    } catch(e) { setMsg(msg,fmtErr(e.code),'error'); }
}
async function doLogout() { await auth.signOut(); closeAuthModal(); showToast('Signed out.'); }
function setMsg(el,txt,cls) { el.textContent=txt; el.className='auth-msg '+cls; }
function fmtErr(code) {
    return ({'auth/user-not-found':'No account with that email.','auth/wrong-password':'Wrong password.',
        'auth/invalid-email':'Invalid email.','auth/email-already-in-use':'Email already in use.',
        'auth/weak-password':'Password too weak.','auth/too-many-requests':'Too many attempts.',
        'auth/invalid-credential':'Invalid email or password.'})[code]||code;
}

// ── Auth state ──
auth.onAuthStateChanged(user => {
    currentUser = user;
    const isAnon = !!(user && user.isAnonymous);
    const isAdmin = !!(user && !isAnon && getAdmin().includes(user.email));
    const btn = document.getElementById('auth-btn');
    if (user && !isAnon) {
        const label = user.displayName || user.email || 'Player';
        btn.textContent = label.split(/[@\s]/)[0];
        btn.style.cssText = 'background:#1e331e;color:var(--mc-green);text-shadow:1px 1px 0 var(--mc-green-s);border-color:#448844 #0a1a0a #0a1a0a #448844;';
    } else {
        btn.textContent = 'Log In';
        btn.style.cssText = 'background:#1e2233;color:var(--mc-aqua);text-shadow:2px 2px 0 var(--mc-aqua-s);border-color:#4466aa #0a1122 #0a1122 #4466aa;';
    }
    document.getElementById('admin-editor').style.display = isAdmin ? 'block' : 'none';
    const bar = document.getElementById('user-status-bar');
    if (user && !isAnon) {
        const label = user.displayName || user.email || 'Player';
        bar.style.display = 'block';
        bar.innerHTML = `<div class="user-bar">Signed in as <span class="uname">${label}</span>${isAdmin?'<span class="rank">[ADMIN]</span>':''}</div>`;
    } else { bar.style.display = 'none'; }
    renderNewsList();
});

// ── Editor ──
function execCmd(cmd,val) { document.getElementById('editor-area').focus(); document.execCommand(cmd,false,val||null); }
function execHeading(tag) { document.getElementById('editor-area').focus(); document.execCommand('formatBlock',false,tag); }
function transformEmoji(url) {
    if (!url) return null;
    if (url.startsWith(':emoji {') && url.endsWith(' }:')) {
        return "src/emojis/" + url.slice(8, -3)
    } else {
        return url;
    }
}
function insertImageUrl() {
    const url = transformEmoji(document.getElementById('img-url-inp').value.trim());
    if (!url) return;
    document.getElementById('editor-area').focus();
    document.execCommand('insertHTML',false,`<img src="${url}" style="max-width:100%;image-rendering:crisp-edges;" alt=""/>`);
    document.getElementById('img-url-inp').value='';
}
function insertUploadedImage(input) {
    if (!input.files||!input.files[0]) return;
    const r = new FileReader();
    r.onload = e => { document.getElementById('editor-area').focus(); document.execCommand('insertHTML',false,`<img src="${e.target.result}" style="max-width:100%;image-rendering:pixelated;" alt=""/>`); };
    r.readAsDataURL(input.files[0]); input.value='';
}

// ── Posts ──
async function publishPost() {
    if (!(currentUser && !(currentUser && currentUser.isAnonymous) && getAdmin().includes(currentUser.email))) return;
    const title = document.getElementById('post-title').value.trim();
    const body  = document.getElementById('editor-area').innerHTML.trim();
    if (!title||!body||body==='<br>') { showToast('Title and body required.',true); return; }
    const btn = document.getElementById('pub-btn');
    btn.disabled=true; btn.textContent='Publishing...';
    try {
        await db.collection('posts').add({ title, body, author:currentUser.email, authorName:currentUser.displayName||'Admin', createdAt:firebase.firestore.FieldValue.serverTimestamp() });
        document.getElementById('post-title').value='';
        document.getElementById('editor-area').innerHTML='';
        showToast('Published.'); loadPosts();
    } catch(e) { showToast(e.message,true); }
    btn.disabled=false; btn.textContent='Publish';
}
async function loadPosts() {
    try {
        const snap = await db.collection('posts').orderBy('createdAt','desc').get();
        allPosts = snap.docs.map(d=>({id:d.id,...d.data()}));
    } catch(e) { console.warn('Firestore:',e.message); allPosts=[]; }
    renderNewsList(); renderHomeNews();
}
function renderNewsList() {
    const el = document.getElementById('news-list');
    if (!allPosts.length) { el.innerHTML='<div class="no-posts">No posts yet.</div>'; return; }
    el.innerHTML = allPosts.map(p=>`
    <div class="mc-card" onclick="openPost('${p.id}')">
      <div class="mc-card-title">${esc(p.title)}</div>
      <div class="mc-card-meta">${fmtDate(p.createdAt)}  -  ${p.authorName||'Admin'}</div>
      <div class="mc-card-preview">${strip(p.body).slice(0,100)}${p.body.length>100?'...':''}</div>
      ${isAdmin?`<button class="delete-btn" onclick="delPost(event,'${p.id}')">Delete</button>`:''}
    </div>`).join('');
}
function renderHomeNews() {
    const el = document.getElementById('home-news-list');
    const r = allPosts.slice(0,3);
    if (!r.length) { el.innerHTML='<div class="no-posts">No posts yet.</div>'; return; }
    el.innerHTML = r.map(p=>`
    <div class="mc-card" onclick="showSection('news');setTimeout(()=>openPost('${p.id}'),50)">
      <div class="mc-card-title">${esc(p.title)}</div>
      <div class="mc-card-meta">${fmtDate(p.createdAt)}</div>
      <div class="mc-card-preview">${strip(p.body).slice(0,80)}...</div>
    </div>`).join('');
}
function openPost(id) {
    const p = allPosts.find(x=>x.id===id); if (!p) return;
    document.getElementById('detail-title').textContent = p.title;
    document.getElementById('detail-meta').textContent  = fmtDate(p.createdAt)+'  -  '+(p.authorName||'Admin');
    document.getElementById('detail-body').innerHTML    = p.body;
    document.getElementById('news-list').style.display  = 'none';
    document.getElementById('admin-editor').style.display = 'none';
    document.getElementById('news-detail').style.display  = 'block';
    window.scrollTo(0,0);
}
function closeNewsDetail(silent) {
    document.getElementById('news-detail').style.display = 'none';
    document.getElementById('news-list').style.display   = '';
    if (isAdmin) document.getElementById('admin-editor').style.display = 'block';
}
async function delPost(e,id) {
    e.stopPropagation();
    if (!confirm('Delete this post?')) return;
    try { await db.collection('posts').doc(id).delete(); showToast('Deleted.'); await loadPosts(); }
    catch(err) { showToast(err.message,true); }
}

// ── Util ──
function esc(s)  { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function strip(s){ return s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); }
function fmtDate(ts) {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'});
}
function showToast(msg,err)  {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className='show'+(err?' err':'');
    clearTimeout(window._tt);
    window._tt = setTimeout(()=>{ t.className=''; },3000);
}

// Sign in anonymously so Firestore reads work for all visitors
auth.signInAnonymously().catch(() => {});

loadPosts();