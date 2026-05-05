/* ============================================================
   Mind Play Therapy — Client Progress Tracker
   app.js (Supabase edition)
   ============================================================ */

const SUPABASE_URL = 'https://vfpxovpwwabisfjjqkpm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-cIPFr0xt1CfC8fwh0e_ew_Q6LIbcX5';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const AVATARS = ["🐻","🦊","🐺","🐱","🐶","🐸","🦁","🐯","🐼","🦋","🌻","⭐","🍀","🎯","🏔"];
const COLORS  = ["#D3D1C7","#B5D4F4","#9FE1CB","#F4C0D1","#F5C4B3","#FAC775","#C0DD97","#CECBF6","#F7C1C1","#85B7EB"];

const BASE_IMG = 'https://vfpxovpwwabisfjjqkpm.supabase.co/storage/v1/object/public/assets/characters';
const CHARACTER_IMAGES = {
  scout:    `${BASE_IMG}/The%20Scout.png`,
  voyager:  `${BASE_IMG}/The%20Voyager.png`,
  warden:   `${BASE_IMG}/The%20Warden.png`,
  gardener: `${BASE_IMG}/The%20Gardener.png`,
  dreamer:  `${BASE_IMG}/The%20Dreamer.png`,
  weaver:   `${BASE_IMG}/The%20Weaver.png`,
  anchor:   `${BASE_IMG}/The%20Anchor.png`,
  sage:     `${BASE_IMG}/The%20Sage.png`,
};
const LEVEL_NAMES = ['Explorer','Adventurer','Trailblazer','Champion','Luminary','Sage'];

const CHARACTER_NAMES = {
  scout: 'The Scout', voyager: 'The Voyager', warden: 'The Warden',
  gardener: 'The Gardener', dreamer: 'The Dreamer', weaver: 'The Weaver',
  anchor: 'The Anchor', sage: 'The Sage',
};
const CHARACTER_COPY = {
  scout:    'They feel stuck or avoidant and are looking for a way in. They may be curious about their own patterns but unsure how to start exploring them. They respond well to incremental steps and can use The Scout as permission to move at their own pace while still moving forward.',
  voyager:  'They are ready to make change but need structure and momentum to get there. They may have worked through a difficult period and are looking for a character that reflects their determination. The Voyager validates how far they have come while keeping the focus on what is possible next.',
  warden:   'They have experienced situations where their limits were not respected, or they find it difficult to say no. They may feel unsafe in relationships or need support recognizing what is and is not okay. The Warden gives them a strong, protective identity to step into during play.',
  gardener: 'They are hard on themselves and struggle to recognize progress that feels slow or imperfect. They may carry shame or a harsh inner critic and need a character that models gentleness and patience. The Gardener can be a meaningful mirror for clients learning what it looks like to care for themselves over time.',
  dreamer:  'They are navigating hopelessness, low motivation, or difficulty imagining things getting better. They may be drawn to fantasy or storytelling as a way of coping. The Dreamer meets them there and gently opens the door to future-oriented thinking without dismissing how hard the present feels.',
  weaver:   'They struggle to put their feelings into words but communicate easily through creativity or metaphor. They may be carrying a lot emotionally and need a character that reflects the complexity of their inner world. The Weaver can help them feel seen without requiring direct disclosure.',
  anchor:   'They experience anxiety, emotional overwhelm, or difficulty staying present. They may feel like their feelings carry them away and are looking for something solid to hold onto. The Anchor gives them a grounded identity and a framework for using calming strategies during gameplay.',
  sage:     'They are naturally introspective and process deeply before they speak. They may be working toward accepting something difficult or learning to trust their own judgment. The Sage honors their inner world and gives language to the kind of quiet, internal strength they may not yet recognize in themselves.',
};

const ARCHETYPE_MODULE_SLOTS = {
  scout:    { id: 'scout',    name: 'The Scout',    connects: 'Curiosity & Mapping',      specialization: 'MAPPING'    },
  voyager:  { id: 'voyager',  name: 'The Voyager',  connects: 'Momentum & Resilience',    specialization: 'MOMENTUM'   },
  warden:   { id: 'warden',   name: 'The Warden',   connects: 'Structure & Grounding',    specialization: 'STRUCTURE'  },
  gardener: { id: 'gardener', name: 'The Gardener', connects: 'Self-Compassion & Growth', specialization: 'GROWTH'     },
  dreamer:  { id: 'dreamer',  name: 'The Dreamer',  connects: 'Future-Oriented Hope',     specialization: 'HOPE'       },
  weaver:   { id: 'weaver',   name: 'The Weaver',   connects: 'Creative Expression',      specialization: 'EXPRESSION' },
  anchor:   { id: 'anchor',   name: 'The Anchor',   connects: 'Emotional Regulation',     specialization: 'REGULATION' },
  sage:     { id: 'sage',     name: 'The Sage',     connects: 'Internal Clarity',         specialization: 'WISDOM'     },
};

const ACTIVITY_TYPES = [
  { id: 'quiz',      icon: '🧠', name: 'Coping Skills Quiz'  },
  { id: 'breathing', icon: '🌬️', name: 'Breathing Garden'    },
  { id: 'journal',   icon: '📓', name: 'Reflection Journal'  },
  { id: 'emotions',  icon: '🎭', name: 'Emotion Explorer'    },
  { id: 'custom',    icon: '✏️', name: 'Custom'              },
];

let currentUser          = null;
let selectedAvatar       = AVATARS[0];
let selectedActivityType = null;
let viewingClient        = null;   // full client row object
let scoringActivity      = null;   // activity uuid string
let _clients             = [];     // active clients cache
let _pastClients         = [];     // archived clients cache

/* ── Page navigation ── */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function closeOverlay(id) { document.getElementById(id).classList.remove('open'); }
function closeBg(e, id)   { if (e.target === document.getElementById(id)) closeOverlay(id); }

/* ── Sign-in dropdown ── */
function toggleSignIn() {
  const panel = document.getElementById('signin-panel');
  if (panel.classList.contains('open')) {
    closeSignIn();
  } else {
    panel.classList.add('open');
    document.getElementById('signin-nav-btn').classList.add('open');
    setTimeout(() => document.addEventListener('mousedown', _outsideSignIn), 10);
    setTimeout(() => document.getElementById('si-email').focus(), 60);
  }
}
function closeSignIn() {
  document.getElementById('signin-panel').classList.remove('open');
  document.getElementById('signin-nav-btn').classList.remove('open');
  document.removeEventListener('mousedown', _outsideSignIn);
}
function _outsideSignIn(e) {
  if (!document.getElementById('signin-wrap').contains(e.target)) closeSignIn();
}
function goToSignIn() {
  showPage('pg-landing');
  setTimeout(toggleSignIn, 80);
}

/* ── Clinical Marketing ── */
function requestDemo() {
  // Logic for the clinical demo request
  alert("Demo Request: Our clinical partnership team will contact you at your registered email to schedule a walkthrough.");
}

/* ── Auth ── */
async function doSignIn() {
  const email = document.getElementById('si-email').value.trim().toLowerCase();
  const pass  = document.getElementById('si-pass').value;
  const err   = document.getElementById('si-err');
  err.textContent = '';
  if (!email || !pass) { err.textContent = 'Please enter your email and password.'; return; }

  const { data, error } = await db.auth.signInWithPassword({ email, password: pass });
  if (error) { err.textContent = 'Incorrect email or password.'; return; }

  currentUser = data.user;
  closeSignIn();
  loadApp();
}

async function doSignUp() {
  const name  = document.getElementById('su-name').value.trim();
  const email = document.getElementById('su-email').value.trim().toLowerCase();
  const pass  = document.getElementById('su-pass').value;
  const pass2 = document.getElementById('su-pass2').value;
  const err   = document.getElementById('su-err');
  err.textContent = '';

  if (!name)           { err.textContent = 'Please enter your name.'; return; }
  if (!email)          { err.textContent = 'Please enter your email.'; return; }
  if (pass.length < 6) { err.textContent = 'Password must be at least 6 characters.'; return; }
  if (pass !== pass2)  { err.textContent = 'Passwords do not match.'; return; }

  const { data, error } = await db.auth.signUp({
    email,
    password: pass,
    options: { data: { full_name: name } }
  });

  if (error) { err.textContent = error.message; return; }

  if (data?.session) {
    // Session returned immediately — log them straight in
    currentUser = data.user;
    loadApp();
  } else if (data?.user) {
    // User created but no session yet — sign them in manually
    const { data: signInData, error: signInError } = await db.auth.signInWithPassword({
      email,
      password: pass
    });
    if (signInError) { err.textContent = 'Account created! Please sign in.'; return; }
    currentUser = signInData.user;
    loadApp();
  } else {
    err.textContent = 'Something went wrong. Please try signing in.';
  }
}

async function doSignOut() {
  await db.auth.signOut();
  currentUser = null;
  showPage('pg-landing');
}

async function doSignInWithGoogle() {
  const err = document.getElementById('si-err');
  if (err) err.textContent = '';
  const { error } = await db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname }
  });
  if (error && err) { err.textContent = 'Google sign-in failed. Please try again.'; }
}

function loadApp() {
  const name = currentUser?.user_metadata?.full_name || currentUser?.email || '';
  document.getElementById('tb-name').textContent = name;
  renderClients();
  showPage('pg-app');
}

function showApp() {
  renderClients();
  showPage('pg-app');
}

/* ── Client roster ── */
async function renderClients() {
  const grid = document.getElementById('client-grid');
  grid.innerHTML = '<div class="empty" style="grid-column:1/-1">Loading...</div>';

  const { data: clients, error } = await db
    .from('clients')
    .select('*, activities(id, done)')
    .eq('user_id', currentUser.id)
    .neq('archived', true)
    .order('created_at', { ascending: true });

  if (error) {
    grid.innerHTML = '<div class="empty" style="grid-column:1/-1">Error loading clients.</div>';
    return;
  }

  _clients = clients;
  document.getElementById('roster-label').textContent =
    clients.length ? `Clients (${clients.length})` : 'Clients';

  if (!clients.length) {
    grid.innerHTML = '<div class="empty">No clients yet — add one to get started.</div>';
  } else {
    grid.innerHTML = clients.map(c => {
      const acts  = c.activities || [];
      const done  = acts.filter(a => a.done).length;
      const pct   = acts.length ? Math.round(done / acts.length * 100) : 0;
      const color = COLORS[c.color_index % COLORS.length];
      return `
        <div class="client-card" onclick="openClientById('${c.id}')">
          <button class="del-client-btn" onclick="event.stopPropagation(); archiveClient('${c.id}')" title="Remove client">✕</button>
          <div class="av" style="background:${color}">${c.avatar}</div>
          <div class="cn">${c.name}</div>
          <div class="cs">Since ${new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
          <div class="prog-bar-wrap"><div class="prog-bar" style="width:${pct}%"></div></div>
          <div style="font-size:10px;color:var(--color-text-tertiary);margin-top:4px;">${pct}% complete</div>
        </div>`;
    }).join('');
  }

  renderPastClients();
}

async function renderPastClients() {
  const label = document.getElementById('past-clients-label');
  const grid  = document.getElementById('past-client-grid');

  const { data: clients } = await db
    .from('clients')
    .select('*, activities(id, done)')
    .eq('user_id', currentUser.id)
    .eq('archived', true)
    .order('archived_at', { ascending: false });

  _pastClients = clients || [];

  if (!_pastClients.length) {
    label.style.display = 'none';
    grid.style.display  = 'none';
    return;
  }

  label.style.display = '';
  grid.style.display  = '';

  grid.innerHTML = _pastClients.map(c => {
    const acts  = c.activities || [];
    const done  = acts.filter(a => a.done).length;
    const pct   = acts.length ? Math.round(done / acts.length * 100) : 0;
    const color = COLORS[c.color_index % COLORS.length];
    const archivedStr = c.archived_at
      ? new Date(c.archived_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : '';
    return `
      <div class="past-client-card" onclick="openClientById('${c.id}')">
        <button class="delete-perm-btn" onclick="event.stopPropagation(); deleteClient('${c.id}')" title="Permanently delete client">Delete</button>
        <button class="restore-btn" onclick="event.stopPropagation(); restoreClient('${c.id}')" title="Restore client">Restore</button>
        <div class="av" style="background:${color};filter:grayscale(0.5);">${c.avatar}</div>
        <div class="cn">${c.name}</div>
        <div class="cs">Since ${new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
        ${archivedStr ? `<div class="archived-badge">Archived ${archivedStr}</div>` : ''}
        <div class="prog-bar-wrap"><div class="prog-bar" style="width:${pct}%;background:var(--color-text-tertiary);"></div></div>
        <div style="font-size:10px;color:var(--color-text-tertiary);margin-top:4px;">${pct}% complete</div>
      </div>`;
  }).join('');
}

function openClientById(id) {
  const client = _clients.find(c => c.id === id) || _pastClients.find(c => c.id === id);
  if (client) openClient(client);
}

async function archiveClient(id) {
  const client = _clients.find(c => c.id === id);
  const name   = client?.name || 'this client';
  if (!confirm(`Remove ${name} from active clients? Their session records will be preserved in Past Clients.`)) return;
  await db.from('clients').update({ archived: true, archived_at: new Date().toISOString() }).eq('id', id);
  renderClients();
}

async function restoreClient(id) {
  await db.from('clients').update({ archived: false, archived_at: null }).eq('id', id);
  renderClients();
}

async function deleteClient(id) {
  const client = _pastClients.find(c => c.id === id);
  const name   = client?.name || 'this client';
  const confirmed = confirm(
    `Permanently delete ${name}?\n\n` +
    `This will erase all of their session history, activities, scores, and responses. ` +
    `This data cannot be recovered.\n\n` +
    `Do you want to continue?`
  );
  if (!confirmed) return;

  await db.from('session_summaries').delete().eq('client_id', id);
  await db.from('session_responses').delete().eq('client_id', id);
  await db.from('sessions').delete().eq('client_id', id);

  const { data: acts } = await db.from('activities').select('id').eq('client_id', id);
  if (acts?.length) {
    await db.from('scores').delete().in('activity_id', acts.map(a => a.id));
  }

  await db.from('activities').delete().eq('client_id', id);
  await db.from('clients').delete().eq('id', id);

  renderClients();
}

function openAddClient() {
  selectedAvatar = AVATARS[0];
  document.getElementById('cl-name').value = '';
  const picker = document.getElementById('av-picker');
  picker.innerHTML = '';
  AVATARS.forEach((av, i) => {
    const d = document.createElement('div');
    d.className = 'av-opt' + (av === selectedAvatar ? ' sel' : '');
    d.style.background = COLORS[i % COLORS.length];
    d.textContent = av;
    d.onclick = () => {
      selectedAvatar = av;
      document.querySelectorAll('.av-opt').forEach(x => x.classList.remove('sel'));
      d.classList.add('sel');
    };
    picker.appendChild(d);
  });
  document.getElementById('add-client-overlay').classList.add('open');
  setTimeout(() => document.getElementById('cl-name').focus(), 50);
}

async function saveClient() {
  const name = document.getElementById('cl-name').value.trim();
  if (!name) { document.getElementById('cl-name').focus(); return; }

  const colorIndex = AVATARS.indexOf(selectedAvatar);
  const { error } = await db.from('clients').insert({
    user_id:     currentUser.id,
    name,
    avatar:      selectedAvatar,
    color_index: colorIndex >= 0 ? colorIndex : 0,
  });

  if (!error) {
    closeOverlay('add-client-overlay');
    renderClients();
  }
}

/* ── Client profile ── */
async function openClient(client) {
  viewingClient = client;
  const color = COLORS[client.color_index % COLORS.length];
  document.getElementById('cp-av').textContent        = client.avatar;
  document.getElementById('cp-av').style.background   = color;
  document.getElementById('cp-name').textContent      = client.name;
  document.getElementById('cp-since').textContent     = 'Since ' + new Date(client.created_at)
    .toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  // Fetch character and XP in parallel
  const [{ data: charRow }, { data: xpRow }] = await Promise.all([
    db.from('session_responses').select('response_data')
      .eq('client_id', client.id).eq('step_index', -1)
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    db.from('session_responses').select('response_data')
      .eq('client_id', client.id).eq('step_index', -2)
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  // XP / level stat box
  const xpData = xpRow?.response_data;
  let parsedXp = typeof xpData === 'string' ? JSON.parse(xpData) : xpData;
  if (parsedXp?.xp !== undefined) {
    const lvl = Math.max(1, Math.min(parsedXp.level ?? 1, LEVEL_NAMES.length));
    document.getElementById('st-xp').textContent    = parsedXp.xp + ' XP';
    document.getElementById('st-level').textContent = `Lv.${lvl} · ${LEVEL_NAMES[lvl - 1]}`;
  } else {
    document.getElementById('st-xp').textContent    = '—';
    document.getElementById('st-level').textContent = 'No sessions yet';
  }

  let charEl = document.getElementById('cp-character');
  if (!charEl) {
    charEl = document.createElement('div');
    charEl.id = 'cp-character';
    charEl.style.cssText = 'margin-bottom:24px;padding-bottom:24px;border-bottom:0.5px solid var(--border);display:flex;align-items:center;gap:16px;';
    document.getElementById('cp-name').closest('.profile-head').insertAdjacentElement('afterend', charEl);
  }

  let charData = charRow?.response_data;
  if (typeof charData === 'string') { try { charData = JSON.parse(charData); } catch(e) {} }
  const char = charData?.character;

  const _archIcons = { protector:'🛡️', explorer:'🧭', healer:'💚', sage:'📖', spark:'⚡', builder:'🔨' };

  if (char === 'custom' && charData?.name) {
    const archIcon  = _archIcons[charData.heroType] || '✦';
    const archLabel = charData.heroType ? charData.heroType.charAt(0).toUpperCase() + charData.heroType.slice(1) : '';
    const traitStr  = (charData.traits || []).join(', ');
    charEl.innerHTML = `
      <div style="width:72px;height:96px;background:var(--green-light,#F0F5F0);border:0.5px solid var(--border);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:36px;flex-shrink:0;">${archIcon}</div>
      <div>
        <div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--color-text-tertiary);font-weight:500;margin-bottom:4px;">Custom Hero</div>
        <div style="font-family:var(--serif,Georgia,serif);font-size:17px;font-weight:500;color:var(--color-text-primary,#1A2E1A);">${charData.name}</div>
        ${archLabel || traitStr ? `<div style="font-size:11px;color:var(--color-text-tertiary);margin-top:3px;">${archLabel}${traitStr ? ' · ' + traitStr : ''}</div>` : ''}
      </div>`;
    charEl.style.display = 'flex';
  } else if (char && CHARACTER_IMAGES[char]) {
    charEl.innerHTML = `
      <img src="${CHARACTER_IMAGES[char]}" alt="${CHARACTER_NAMES[char]}"
           style="width:72px;height:96px;object-fit:cover;object-position:top center;border-radius:10px;border:0.5px solid var(--border);">
      <div>
        <div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--color-text-tertiary);font-weight:500;margin-bottom:4px;">Client's Character</div>
        <div style="font-family:var(--serif,Georgia,serif);font-size:17px;font-weight:500;color:var(--color-text-primary,#1A2E1A);">${CHARACTER_NAMES[char]}</div>
        ${ARCHETYPE_MODULE_SLOTS[char]?.connects ? `<div style="font-size:11px;color:var(--color-text-tertiary);margin-top:3px;letter-spacing:0.04em;">${ARCHETYPE_MODULE_SLOTS[char].connects}</div>` : ''}
      </div>`;
    charEl.style.display = 'flex';
  } else {
    charEl.style.display = 'none';
  }

  renderActivities();
  renderSessionHistory();
  showPage('pg-client');
}

async function renderSessionHistory() {
  // Create the section if it doesn't exist
  let section = document.getElementById('session-history-section');
  if (!section) {
    section = document.createElement('div');
    section.id = 'session-history-section';
    document.getElementById('pg-client').appendChild(section);
  }

  section.innerHTML = '<p class="section-label" style="margin-top:2rem;">Session History</p><div class="empty">Loading...</div>';

  const { data: summaries, error } = await db
    .from('session_summaries')
    .select('*')
    .eq('client_id', viewingClient.id)
    .order('created_at', { ascending: false });

  if (error || !summaries?.length) {
    section.innerHTML = `
      <p class="section-label" style="margin-top:2rem;">Session History</p>
      <div class="empty">No sessions recorded yet.</div>`;
    return;
  }

  const activityIcons = {
    quiz:      '🧠',
    breathing: '🌬️',
    journal:   '📓',
    emotions:  '🎭',
  };

  section.innerHTML = `
    <p class="section-label" style="margin-top:2rem;">Session History</p>
    ${summaries.map(s => {
      const icon     = activityIcons[s.activity_type] || '🎯';
      const date     = new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const mins     = Math.floor(s.duration_seconds / 60);
      const secs     = s.duration_seconds % 60;
      const duration = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

      return `
        <div class="session-history-card">
          <div class="session-history-top">
            <div class="session-history-title">
              <span>${icon}</span>
              <span>${s.activity_type.charAt(0).toUpperCase() + s.activity_type.slice(1)}</span>
            </div>
            <div class="session-history-date">${date} · ${duration}</div>
          </div>
          <div class="session-history-narrative">${s.generated_summary}</div>
          ${s.therapist_notes ? `
            <div class="session-history-notes">
              <span class="session-notes-label">📝 Notes</span>
              <span>${s.therapist_notes}</span>
            </div>` : ''}
          <div class="session-history-stats">
            <span>Steps: ${s.total_steps}</span>
            ${s.correct_answers > 0 ? `<span>Correct: ${s.correct_answers}</span>` : ''}
            ${s.emotions_explored?.length > 0 ? `<span>Emotions: ${s.emotions_explored.join(', ')}</span>` : ''}
            ${s.breathing_completed ? `<span>✅ Breathing complete</span>` : ''}
          </div>
        </div>`;
    }).join('')}
  `;
}

/* ── Activities ── */
async function renderActivities() {
  if (!viewingClient) return;

  const { data: activities, error } = await db
    .from('activities')
    .select('*, scores(score, logged_at)')
    .eq('client_id', viewingClient.id)
    .order('created_at', { ascending: true });

  if (error) return;

  const done      = activities.filter(a => a.done).length;
  const allScores = activities.flatMap(a => (a.scores || []).map(s => s.score));
  const avg       = allScores.length
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : null;

  document.getElementById('st-total').textContent = activities.length;
  document.getElementById('st-done').textContent  = done;

  const list = document.getElementById('lesson-list');
  if (!activities.length) {
    list.innerHTML = '<div class="empty" style="grid-column:unset">No activities yet — assign one above.</div>';
    return;
  }

  list.innerHTML = activities.map(a => {
    const sortedScores = (a.scores || []).sort((x, y) => new Date(y.logged_at) - new Date(x.logged_at));
    const lastScore    = sortedScores.length ? sortedScores[0].score : null;
    const lastDate     = sortedScores.length
      ? new Date(sortedScores[0].logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : a.completed_at
        ? new Date(a.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : null;
    const safeName = a.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `
      <div class="lesson-row${a.done ? ' done' : ''}">
        <div class="check${a.done ? ' done' : ''}" onclick="toggleActivity('${a.id}', ${a.done})">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <polyline points="2,6 4.5,8.5 9,3" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="lesson-info">
          <div class="lesson-name">${a.activity_icon ? `<span class="lesson-act-icon">${a.activity_icon}</span>` : ''}${a.name}</div>
          <div class="lesson-meta">
            ${lastDate ? 'Last: ' + lastDate : 'Not started'}
            ${lastScore !== null ? ' · Score: ' + lastScore + '%' : ''}
          </div>
        </div>
        <div class="lesson-actions">
          <button class="start-session-btn" onclick="startLiveSession('${viewingClient.id}', '${viewingClient.name.replace(/'/g,"\\'")}', '${a.activity_type}', '${a.activity_icon || '🎯'}')">▶ Start</button>
          <span class="lesson-score" onclick="openScore('${a.id}', '${safeName}')">Score</span>
          <button class="del-lesson" onclick="deleteActivity('${a.id}')" title="Remove activity">✕</button>
        </div>
      </div>`;
  }).join('');
}

async function toggleActivity(id, currentDone) {
  const update = { done: !currentDone };
  if (!currentDone) update.completed_at = new Date().toISOString();
  await db.from('activities').update(update).eq('id', id);
  renderActivities();
}

async function deleteActivity(id) {
  if (!confirm('Remove this activity?')) return;
  await db.from('activities').delete().eq('id', id);
  renderActivities();
}

function openAddLesson() {
  selectedActivityType = null;
  document.getElementById('ls-name').value = '';
  document.getElementById('custom-name-field').style.display = 'none';

  const picker = document.getElementById('activity-picker');
  picker.innerHTML = '';
  ACTIVITY_TYPES.forEach(at => {
    const d = document.createElement('div');
    d.className = 'act-type-opt';
    d.innerHTML = `<span class="act-type-icon">${at.icon}</span><span class="act-type-name">${at.name}</span>`;
    d.onclick = () => {
      document.querySelectorAll('.act-type-opt').forEach(x => x.classList.remove('sel'));
      d.classList.add('sel');
      selectedActivityType = at;
      const customField = document.getElementById('custom-name-field');
      if (at.id === 'custom') {
        customField.style.display = 'block';
        setTimeout(() => document.getElementById('ls-name').focus(), 50);
      } else {
        customField.style.display = 'none';
      }
    };
    picker.appendChild(d);
  });

  document.getElementById('add-lesson-overlay').classList.add('open');
}

async function saveLesson() {
  if (!selectedActivityType) return;
  const name = selectedActivityType.id === 'custom'
    ? document.getElementById('ls-name').value.trim()
    : selectedActivityType.name;
  if (!name) { document.getElementById('ls-name').focus(); return; }

  const { error } = await db.from('activities').insert({
    client_id:     viewingClient.id,
    user_id:       currentUser.id,
    name,
    activity_type: selectedActivityType.id,
    activity_icon: selectedActivityType.id !== 'custom' ? selectedActivityType.icon : null,
    done:          false,
  });

  if (!error) {
    closeOverlay('add-lesson-overlay');
    renderActivities();
  }
}

/* ── Score logging ── */
async function openScore(activityId, activityName) {
  scoringActivity = activityId;
  document.getElementById('score-modal-title').textContent = 'Score — ' + activityName.substring(0, 30);
  document.getElementById('score-input').value = '';

  const { data: scores } = await db
    .from('scores')
    .select('score, logged_at')
    .eq('activity_id', activityId)
    .order('logged_at', { ascending: true });

  const hist = document.getElementById('score-history');
  if (scores?.length) {
    hist.innerHTML = `
      <p class="history-heading">History</p>
      <div class="history-list">
        ${scores.map(s => `
          <div class="history-row">
            <span style="color:var(--color-text-secondary)">${new Date(s.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span style="font-weight:500">${s.score}% <span class="tag-done">done</span></span>
          </div>`).join('')}
      </div>`;
  } else {
    hist.innerHTML = '<p style="font-size:12px;color:var(--color-text-tertiary);margin-top:.75rem;">No sessions logged yet.</p>';
  }

  document.getElementById('score-overlay').classList.add('open');
  setTimeout(() => document.getElementById('score-input').focus(), 50);
}

async function saveScore() {
  const val = parseInt(document.getElementById('score-input').value, 10);
  if (isNaN(val) || val < 0 || val > 100) { document.getElementById('score-input').focus(); return; }

  await db.from('scores').insert({ activity_id: scoringActivity, score: val });
  await db.from('activities').update({ done: true, completed_at: new Date().toISOString() }).eq('id', scoringActivity);

  closeOverlay('score-overlay');
  renderActivities();
}

/* ── Keyboard shortcuts ── */
document.getElementById('si-pass').addEventListener('keydown',  e => { if (e.key === 'Enter') doSignIn(); });
document.getElementById('su-pass2').addEventListener('keydown', e => { if (e.key === 'Enter') doSignUp(); });
document.getElementById('cl-name').addEventListener('keydown',  e => { if (e.key === 'Enter') saveClient(); });
document.getElementById('ls-name').addEventListener('keydown',  e => { if (e.key === 'Enter') saveLesson(); });
document.getElementById('score-input').addEventListener('keydown', e => { if (e.key === 'Enter') saveScore(); });

/* ── Session restore ── */
db.auth.getSession().then(({ data: { session } }) => {
  if (session?.user) {
    currentUser = session.user;
    loadApp();
  }
});

db.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.user && !currentUser) {
    currentUser = session.user;
    loadApp();
  }
  if (event === 'SIGNED_OUT') {
    currentUser = null;
    showPage('pg-landing');
  }
});
/* ============================================================
   SESSION SYSTEM
   ============================================================ */

let activeSession = null;
let sessionListener = null;

/* Generate a random 6-character code */
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/* Therapist starts a live session with a client */
async function startLiveSession(clientId, clientName, activityType, activityIcon) {
  const code = generateCode();

  const { data: session, error } = await db.from('sessions').insert({
    code,
    therapist_id: currentUser.id,
    client_id: clientId,
    activity_type: activityType,
    status: 'waiting'
  }).select().single();

  if (error) { alert('Could not create session. Please try again.'); return; }

  activeSession = session;
  showSessionPanel(code, clientName, activityType, activityIcon, session.id);
}

/* Show the therapist's session panel */
function showSessionPanel(code, clientName, activityType, activityIcon, sessionId) {
  // Remove existing panel if any
  const existing = document.getElementById('session-panel');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.id = 'session-panel';
  panel.innerHTML = `
    <div class="session-panel-inner">
      <div class="session-panel-header">
        <div class="session-panel-title">
          <span>${activityIcon}</span>
          <span>Live Session — ${clientName}</span>
        </div>
        <button class="session-close-btn" onclick="endSession()">End Session</button>
      </div>

      <div class="session-code-block" id="session-code-block">
        <p class="session-code-label">Share this code with your client</p>
        <div class="session-code">${code}</div>
        <p class="session-code-sub">Have your client visit the link below and enter this code</p>
        <a class="session-client-url" href="${window.location.origin}/adventure" target="_blank">${window.location.origin}/adventure</a>
        <div class="session-status waiting" id="session-status">
          ⏳ Waiting for client to join...
        </div>
      </div>

      <div class="session-live" id="session-live" style="display:none">
        <div class="session-status connected" id="session-status-live">
          ✅ Client connected — session in progress
        </div>
        <div class="session-timer" id="session-timer">0:00</div>

        <div class="prompt-panel" id="prompt-panel">
          <p class="prompt-panel-label">💬 Therapist Prompts</p>
          <div class="current-prompt" id="current-prompt">
            Waiting for client to begin activity...
          </div>
          <div class="prompt-queue" id="prompt-queue"></div>
        </div>

        <div class="session-responses" id="session-responses">
          <p class="responses-label">📋 Client Responses</p>
          <div id="responses-list"></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(panel);
  requestAnimationFrame(() => panel.classList.add('open'));

  // Start listening for client joining
  listenForSession(sessionId);
  startSessionTimer();
}

/* Real-time listener — watches for client joining and responses */
function listenForSession(sessionId) {
  if (sessionListener) sessionListener.unsubscribe();

  sessionListener = db
    .channel('session-' + sessionId)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'sessions',
      filter: `id=eq.${sessionId}`
    }, payload => {
      const session = payload.new;
      if (session.status === 'active') {
        showClientConnected();
        updatePrompts(session.activity_type, session.client_step);
      }
      if (session.status === 'client_disconnected') {
        const statusEl = document.getElementById('session-status-live');
        if (statusEl) {
          statusEl.textContent = '⚠️ Client closed their window — ending session…';
          statusEl.className = 'session-status waiting';
        }
        setTimeout(() => endSession(true), 1500);
      }
      if (session.client_step !== undefined) {
        updatePrompts(session.activity_type, session.client_step);
      }
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'session_responses',
      filter: `session_id=eq.${sessionId}`
    }, payload => {
      addResponseToPanel(payload.new);
    })
    .subscribe();
}

function showClientConnected() {
  document.getElementById('session-code-block').style.display = 'none';
  document.getElementById('session-live').style.display = 'block';
}

/* Session timer */
let sessionTimerInterval = null;
let sessionSeconds = 0;

function startSessionTimer() {
  sessionSeconds = 0;
  if (sessionTimerInterval) clearInterval(sessionTimerInterval);
  sessionTimerInterval = setInterval(() => {
    sessionSeconds++;
    const m = Math.floor(sessionSeconds / 60);
    const s = sessionSeconds % 60;
    const el = document.getElementById('session-timer');
    if (el) el.textContent = m + ':' + String(s).padStart(2, '0');
  }, 1000);
}

/* Therapist prompts — contextual per activity and step */
const THERAPIST_PROMPTS = {
  quiz: [
    "Before we start — ask: \"How are you feeling about testing your knowledge today?\"",
    "They just answered a question. Ask: \"What made you choose that answer?\"",
    "Check in: \"Is any of this bringing up things you've experienced yourself?\"",
    "Encourage: \"You're doing great. What's feeling most familiar to you so far?\"",
    "Reflect: \"Which question felt hardest? Why do you think that is?\"",
    "Wrap up: \"What's one thing from this quiz you want to remember this week?\""
  ],
  breathing: [
    "Before starting: \"Where do you feel stress most in your body right now?\"",
    "They're beginning to breathe. Gently say: \"Just follow the circle — no pressure.\"",
    "Mid-exercise: \"Notice anything shifting? Even a tiny bit of calm counts.\"",
    "Check in: \"Is this pace comfortable, or would you like to try a different technique?\"",
    "Finishing up: \"What did you notice in your body during that exercise?\"",
    "Close: \"When could you use this technique on your own this week?\""
  ],
  journal: [
    "Before writing: \"There are no wrong answers here — just honest ones.\"",
    "They're writing. Give them space. When ready: \"Want to share anything you wrote?\"",
    "Follow up: \"What felt surprising or hard to write?\"",
    "Go deeper: \"If you could say one more thing about that, what would it be?\"",
    "Connect: \"How does what you wrote connect to something in your life right now?\"",
    "Close: \"What do you want to carry with you from what you wrote today?\""
  ],
  emotions: [
    "Before selecting: \"Don't overthink it — just go with your gut feeling right now.\"",
    "They picked an emotion. Ask: \"When did you first notice feeling this way today?\"",
    "Go deeper: \"Where do you feel that emotion in your body?\"",
    "Explore: \"Has this feeling been visiting you often lately?\"",
    "Coping: \"Of the strategies shown, which one feels most doable for you?\"",
    "Close: \"What would it feel like to give yourself permission to feel this without judgment?\""
  ]
};

function updatePrompts(activityType, step) {
  const prompts = THERAPIST_PROMPTS[activityType] || THERAPIST_PROMPTS.quiz;
  const currentEl = document.getElementById('current-prompt');
  const queueEl = document.getElementById('prompt-queue');
  if (!currentEl || !queueEl) return;

  const currentIdx = Math.min(step, prompts.length - 1);
  currentEl.textContent = prompts[currentIdx];

  // Show next 2 upcoming prompts
  const upcoming = prompts.slice(currentIdx + 1, currentIdx + 3);
  queueEl.innerHTML = upcoming.length
    ? '<p class="upcoming-label">Coming up:</p>' +
      upcoming.map(p => `<div class="upcoming-prompt">${p}</div>`).join('')
    : '';
}

/* Add a client response to the therapist panel */
function addResponseToPanel(response) {
  const list = document.getElementById('responses-list');
  if (!list) return;

  let data = response.response_data;
  if (typeof data === 'string') { try { data = JSON.parse(data); } catch(e) {} }

  // ── Character selection ──
  if (data?.type === 'character_selected') {
    const existing = document.getElementById('session-char-display');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.id = 'session-char-display';
    div.style.cssText = 'background:#f8faf9;border:0.5px solid #E2E8E2;border-radius:10px;overflow:hidden;margin-bottom:14px;';

    const _archIcons = { protector:'🛡️', explorer:'🧭', healer:'💚', sage:'📖', spark:'⚡', builder:'🔨' };

    if (data.character === 'custom' && data.name) {
      const archIcon  = _archIcons[data.heroType] || '✦';
      const archLabel = data.heroType ? data.heroType.charAt(0).toUpperCase() + data.heroType.slice(1) : 'Custom';
      const powerLabel = data.power
        ? data.power.replace(/_/g,' ').replace(/\b\w/g, c=>c.toUpperCase())
        : '';
      div.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:0.5px solid #E2E8E2;">
          <div style="width:48px;height:64px;background:#F0F5F0;border:0.5px solid #E2E8E2;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;">${archIcon}</div>
          <div>
            <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#7B7899;font-weight:600;margin-bottom:4px;">Custom Hero</div>
            <div style="font-size:16px;font-weight:600;color:#1A2E1A;">${data.name}</div>
            <div style="font-size:11px;color:#7B7899;margin-top:2px;">${archLabel}</div>
          </div>
        </div>
        ${data.traits?.length ? `
          <div style="padding:10px 14px;display:flex;gap:6px;flex-wrap:wrap;border-bottom:0.5px solid #E2E8E2;">
            <span style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;color:#7B7899;width:100%;margin-bottom:4px;">Traits</span>
            ${data.traits.map(t=>`<span style="background:#F0F5F0;border:0.5px solid #E2E8E2;border-radius:3px;padding:3px 10px;font-size:11px;font-weight:600;color:#355E3B;">${t}</span>`).join('')}
          </div>` : ''}
        ${powerLabel ? `
          <div style="padding:10px 14px;font-size:13px;color:#4B5563;">
            <span style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;color:#7B7899;display:block;margin-bottom:4px;">Special Power</span>
            ${powerLabel}
          </div>` : ''}`;
    } else if (CHARACTER_NAMES[data.character]) {
      div.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:0.5px solid #E2E8E2;">
          <img src="${CHARACTER_IMAGES[data.character]}" alt="${CHARACTER_NAMES[data.character]}"
               style="width:48px;height:64px;object-fit:cover;object-position:top center;border-radius:6px;flex-shrink:0;">
          <div>
            <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#7B7899;font-weight:600;margin-bottom:4px;">Character Chosen</div>
            <div style="font-size:16px;font-weight:600;color:#1A2E1A;">${CHARACTER_NAMES[data.character]}</div>
          </div>
        </div>
        <div style="padding:12px 14px;font-size:13px;color:#4B5563;line-height:1.65;">
          <span style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;color:#7B7899;display:block;margin-bottom:6px;">A client might choose this character because...</span>
          ${CHARACTER_COPY[data.character]}
        </div>`;
    } else {
      return;
    }
    list.prepend(div);
    return;
  }

  // ── XP updates — skip, not useful for therapist ──
  if (data?.type === 'xp_update') return;

  // ── Format each activity response type ──
  let label = '', content = '';

  if (data?.emotion) {
    // Emotion Explorer
    label = 'Emotion Check-in';
    content = `<span style="font-size:22px;line-height:1;">${data.icon || ''}</span> <strong>${data.emotion}</strong>`;
  } else if (data?.correct !== undefined) {
    // Quiz
    const icon = data.correct ? '✓' : '✗';
    const color = data.correct ? '#1E6B2E' : '#9E3A1E';
    const bg    = data.correct ? '#edfbf0' : '#fff0eb';
    label = data.correct ? 'Quiz — Correct' : 'Quiz — Incorrect';
    content = `
      <div style="margin-bottom:5px;font-size:12px;color:#7B7899;">${data.question || ''}</div>
      <span style="display:inline-block;background:${bg};color:${color};padding:3px 10px;border-radius:4px;font-weight:600;font-size:13px;">${icon} ${data.answer || ''}</span>`;
  } else if (data?.completed === true && data?.cycles !== undefined) {
    // Breathing
    label = 'Breathing Exercise';
    content = `✅ Completed ${data.cycles} cycles`;
  } else if (data?.response !== undefined) {
    // Journal
    const excerpt = data.response.length > 120 ? data.response.slice(0, 120) + '…' : data.response;
    label = 'Journal Response';
    content = `<div style="font-size:11px;color:#7B7899;margin-bottom:4px;font-style:italic;">${(data.prompt || '').slice(0, 80)}${data.prompt?.length > 80 ? '…' : ''}</div>${excerpt}`;
  } else {
    // Fallback — skip unrecognised internal responses
    return;
  }

  const div = document.createElement('div');
  div.className = 'response-item';
  div.innerHTML = `
    <div class="response-step">${label}</div>
    <div class="response-content" style="display:flex;align-items:center;gap:8px;">${content}</div>`;
  list.appendChild(div);
}

/* End the session */
async function endSession(skipConfirm = false) {
  if (!activeSession) return;
  if (!skipConfirm && !confirm('End this session? A summary will be saved.')) return;

  // Mark session completed
  await db.from('sessions').update({ status: 'completed' }).eq('id', activeSession.id);

  // Fetch all responses for this session
  const { data: responses } = await db
    .from('session_responses')
    .select('*')
    .eq('session_id', activeSession.id)
    .order('created_at', { ascending: true });

  // Calculate score from responses
  const total    = (responses || []).length;
  const correct  = (responses || []).filter(r => r.response_data?.correct === true).length;
  const score    = total > 0 ? Math.round((correct / total) * 100) : null;

  // Find the matching activity and update it with score + completion
  const { data: activities } = await db
    .from('activities')
    .select('id')
    .eq('client_id', activeSession.client_id)
    .eq('activity_type', activeSession.activity_type)
    .eq('done', false)
    .order('created_at', { ascending: false })
    .limit(1);

  if (activities?.length) {
    const activityId = activities[0].id;
    await db.from('activities')
      .update({
        done:         true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', activityId);

    if (score !== null) {
      await db.from('scores').insert({
        activity_id: activityId,
        score,
      });
    }
  }

  // Build summary data
  const summary = buildSessionSummary(responses || []);

  // Generate narrative summary
  const narrative = generateNarrative(summary, activeSession.activity_type);

  // Save to session_summaries
  const { data: savedSummary } = await db.from('session_summaries').insert({
    session_id:                 activeSession.id,
    client_id:                  activeSession.client_id,
    therapist_id:               currentUser.id,
    activity_type:              activeSession.activity_type,
    duration_seconds:           sessionSeconds,
    total_steps:                summary.totalSteps,
    correct_answers:            summary.correctAnswers,
    emotions_explored:          summary.emotionsExplored,
    journal_prompts_completed:  summary.journalPrompts,
    breathing_completed:        summary.breathingCompleted,
    responses:                  responses || [],
    generated_summary:          narrative,
  }).select().single();

  if (sessionListener) sessionListener.unsubscribe();
  if (sessionTimerInterval) clearInterval(sessionTimerInterval);

  // Show summary panel instead of just closing
  showSessionSummary(savedSummary, narrative);

  activeSession = null;
  renderActivities();
}

function buildSessionSummary(responses) {
  const summary = {
    totalSteps:        responses.length,
    correctAnswers:    0,
    emotionsExplored:  [],
    journalPrompts:    0,
    breathingCompleted: false,
  };

  responses.forEach(r => {
    const d = r.response_data;
    if (d.correct === true)  summary.correctAnswers++;
    if (d.emotion)           summary.emotionsExplored.push(d.emotion);
    if (d.response)          summary.journalPrompts++;
    if (d.completed === true) summary.breathingCompleted = true;
  });

  return summary;
}

function generateNarrative(summary, activityType) {
  const mins = Math.floor(sessionSeconds / 60);
  const secs = sessionSeconds % 60;
  const duration = mins > 0 ? `${mins} minute${mins > 1 ? 's' : ''}` : `${secs} seconds`;

  let narrative = `Session lasted ${duration}. `;

  if (activityType === 'quiz') {
    const total = summary.totalSteps;
    const correct = summary.correctAnswers;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    narrative += `Client completed ${total} quiz question${total !== 1 ? 's' : ''}, `;
    narrative += `answering ${correct} correctly (${pct}%). `;
    if (pct >= 80) narrative += `Strong performance — client demonstrated solid coping knowledge.`;
    else if (pct >= 50) narrative += `Good effort — some concepts may benefit from further exploration.`;
    else narrative += `Several concepts to revisit — consider reviewing coping strategies together.`;
  }

  else if (activityType === 'breathing') {
    if (summary.breathingCompleted) {
      narrative += `Client completed the full breathing exercise. `;
      narrative += `This suggests good ability to follow guided regulation techniques.`;
    } else {
      narrative += `Client engaged with the breathing exercise. `;
      narrative += `Consider checking in about comfort level with the technique.`;
    }
  }

  else if (activityType === 'journal') {
    const prompts = summary.journalPrompts;
    narrative += `Client responded to ${prompts} journal prompt${prompts !== 1 ? 's' : ''}. `;
    narrative += `Written reflections have been saved for review.`;
  }

  else if (activityType === 'emotions') {
    const emotions = summary.emotionsExplored;
    if (emotions.length > 0) {
      narrative += `Client explored the following emotion${emotions.length > 1 ? 's' : ''}: ${emotions.join(', ')}. `;
      if (emotions.includes('Angry') || emotions.includes('Anxious')) {
        narrative += `Consider exploring triggers and coping strategies in follow-up.`;
      } else if (emotions.includes('Happy') || emotions.includes('Calm')) {
        narrative += `Client identified positive emotional states — good opportunity to anchor what contributed to this.`;
      } else {
        narrative += `Explore what these emotions mean for the client in their current context.`;
      }
    }
  }

  return narrative;
}

function showSessionSummary(savedSummary, narrative) {
  const panel = document.getElementById('session-panel');
  if (!panel) return;

  const mins = Math.floor(sessionSeconds / 60);
  const secs = sessionSeconds % 60;
  const duration = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  panel.querySelector('.session-panel-inner').innerHTML = `
    <div class="session-panel-header">
      <div class="session-panel-title">
        <span>📋</span>
        <span>Session Summary</span>
      </div>
      <button class="session-close-btn" onclick="closeSessionPanel()">Close</button>
    </div>

    <div class="summary-duration">
      <span class="summary-duration-icon">⏱️</span>
      <span>${duration}</span>
    </div>

    <div class="summary-narrative">
      <p class="summary-narrative-label">Session Overview</p>
      <p class="summary-narrative-text">${narrative}</p>
    </div>

    <div class="summary-stats">
      <div class="summary-stat">
        <div class="summary-stat-val">${savedSummary?.total_steps || 0}</div>
        <div class="summary-stat-lbl">Steps</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat-val">${savedSummary?.correct_answers || 0}</div>
        <div class="summary-stat-lbl">Correct</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat-val">${(savedSummary?.emotions_explored || []).length}</div>
        <div class="summary-stat-lbl">Emotions</div>
      </div>
    </div>

    <div class="summary-notes-section">
      <p class="summary-narrative-label">Therapist Notes</p>
      <textarea
        id="therapist-notes-input"
        class="summary-notes-input"
        placeholder="Add your observations from this session..."
        rows="4"
      ></textarea>
      <button class="primary-save-btn" onclick="saveTherapistNotes('${savedSummary?.id}')">
        Save Notes
      </button>
    </div>
  `;
}

async function saveTherapistNotes(summaryId) {
  const notes = document.getElementById('therapist-notes-input').value.trim();
  if (!summaryId) return;

  await db.from('session_summaries')
    .update({ therapist_notes: notes })
    .eq('id', summaryId);

  // Visual confirmation
  const btn = document.querySelector('.primary-save-btn');
  btn.textContent = '✓ Saved';
  btn.style.background = '#5DCB6E';
  setTimeout(() => {
    closeSessionPanel();
  }, 1200);
}

function closeSessionPanel() {
  const panel = document.getElementById('session-panel');
  if (panel) {
    panel.classList.remove('open');
    setTimeout(() => panel.remove(), 300);
  }
}