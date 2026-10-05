// Sadbot's Journey To Bliss — optional player accounts (email magic link) and cloud-saved progress.
// Uses Supabase Auth with the PKCE flow. The publishable key below is meant to be public: every
// table is protected by row-level security, so a player can only ever read or change their own row.
(() => {
  'use strict';
  const SB = window.SB;
  const CONFIG = {
    url: 'https://tbijvhubsshelptazrtp.supabase.co',
    key: 'sb_publishable_vx0BPQKxQ3STkRpRRlTu5Q_X3mJTU6F',
  };
  const $ = (id) => document.getElementById(id);
  const bar = $('account'), statusEl = $('acct-status'), btn = $('acct-btn');
  const dlg = $('signin'), form = $('signin-form'), emailEl = $('signin-email'), sendBtn = $('signin-send'), msg = $('signin-msg');
  if (!bar || !window.supabase || !window.supabase.createClient) return; // play as a guest

  const client = window.supabase.createClient(CONFIG.url, CONFIG.key, {
    auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
  });
  let user = null;
  bar.hidden = false;

  // ---------------------------------------------------------------- progress sync
  const ids = () => SB.STAGES.map((s) => s.id);
  const store = SB.store; // original, unwrapped
  const toInt = (v, lo, hi) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo; };
  function readLocal() {
    const best = {};
    for (const id of ids()) { const v = toInt(store(`sadbot.best.${id}`), 0, 1e7); if (v > 0) best[id] = v; }
    return { unlocked: toInt(store('sadbot.unlocked') || 1, 1, ids().length), best, finished: store('sadbot.finished') === '1' };
  }
  function sanitize(p) {
    const best = {};
    const src = p && typeof p.best === 'object' && p.best ? p.best : {};
    for (const id of ids()) { const v = toInt(src[id], 0, 1e7); if (v > 0) best[id] = v; }
    return { unlocked: toInt(p && p.unlocked, 1, ids().length), best, finished: !!(p && p.finished) };
  }
  function merge(a, b) {
    const best = { ...a.best };
    for (const [id, v] of Object.entries(b.best)) if (!best[id] || v < best[id]) best[id] = v;
    return { unlocked: Math.max(a.unlocked, b.unlocked), best, finished: a.finished || b.finished };
  }
  function writeLocal(p) {
    store('sadbot.unlocked', String(p.unlocked));
    for (const [id, v] of Object.entries(p.best)) store(`sadbot.best.${id}`, String(v));
    if (p.finished) store('sadbot.finished', '1');
  }
  async function push() {
    if (!user) return;
    const p = readLocal();
    const { error } = await client.from('progress').upsert({ user_id: user.id, unlocked: p.unlocked, best: p.best, finished: p.finished });
    if (error) console.warn('Could not save progress.', error.message);
  }
  async function pull() {
    if (!user) return;
    const { data, error } = await client.from('progress').select('unlocked, best, finished').eq('user_id', user.id).maybeSingle();
    if (error) { console.warn('Could not load progress.', error.message); return; }
    writeLocal(merge(readLocal(), sanitize(data || {})));
    await push();
  }
  let timer = 0;
  SB.store = (key, val) => { // save to the cloud whenever the game records progress
    const r = store(key, val);
    if (val !== undefined && user && /^sadbot\.(unlocked|finished|best\.)/.test(key)) { clearTimeout(timer); timer = setTimeout(push, 800); }
    return r;
  };

  // ---------------------------------------------------------------- UI
  function render() {
    if (user) {
      statusEl.textContent = `Saving progress for ${user.email}`;
      btn.textContent = 'Sign out';
    } else {
      statusEl.textContent = 'Playing as a guest';
      btn.textContent = 'Sign in to save progress';
    }
  }
  btn.addEventListener('click', async () => {
    if (user) { await client.auth.signOut(); return; }
    msg.textContent = ''; emailEl.value = '';
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    emailEl.focus();
  });
  $('signin-cancel').addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', () => SB.canvas.focus()); // hand the keyboard back to the game
  btn.addEventListener('keydown', (e) => { if (e.code === 'Space') e.stopPropagation(); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailEl.value.trim();
    if (!emailEl.checkValidity() || email.length > 254) { msg.textContent = 'Enter a valid email address.'; return; }
    sendBtn.disabled = true; msg.textContent = 'Sending…';
    const redirect = `${location.origin}${location.pathname}`;
    const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect, shouldCreateUser: true } });
    if (error) {
      msg.textContent = /rate|too many|seconds/i.test(error.message) ? 'Too many requests. Wait a minute and try again.' : 'Couldn\'t send the link. Check the address and try again.';
      sendBtn.disabled = false;
      return;
    }
    msg.textContent = 'Check your inbox for a sign-in link. Open it on this device and browser.';
    setTimeout(() => { sendBtn.disabled = false; }, 60000); // one link per minute from this page
  });

  client.auth.onAuthStateChange((event, session) => {
    user = session ? session.user : null;
    render();
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      if (user) setTimeout(pull, 0);
      // strip the one-time ?code= from the address bar after the sign-in completes
      if (/[?&]code=/.test(location.search)) history.replaceState(null, '', location.pathname + location.hash);
    }
  });
  render();
})();
