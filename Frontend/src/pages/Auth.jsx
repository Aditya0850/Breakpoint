import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

const MARKUP = `<!-- ── LEFT PANEL ── -->
<div class="left-panel">
  <div class="left-glow"></div>
  <div class="left-glow-2"></div>

  <div class="left-nav">
    <a href="#" class="logo" data-route="/">
      <span class="logo-dot"></span>
      Sentinel
    </a>
    <div class="mode-chip">
      <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor"><circle cx="3" cy="3" r="3"/></svg>
      Candidate Mode
    </div>
  </div>

  <div class="left-content">
    <h2 class="left-headline">Face the interview<br/>that <em>fights back.</em></h2>
    <p class="left-sub">An AI interviewer with real emotional state. It reacts to every answer you give. Sign in to start your first session.</p>

    <!-- LIVE PREVIEW CARD -->
    <div class="preview-card">
      <div class="preview-titlebar">
        <div class="preview-dots">
          <div class="preview-dot pd-r"></div>
          <div class="preview-dot pd-y"></div>
          <div class="preview-dot pd-g"></div>
        </div>
        <div class="preview-label">behavioral · senior · live</div>
        <div class="preview-mood mood-neutral" id="previewMood">Neutral</div>
      </div>

      <div class="preview-messages" id="previewMsgs"></div>

      <div class="preview-typing" id="previewTyping">
        <div class="pmsg-avatar av-ai">AI</div>
        <div class="typing-wrap">
          <div class="t-dot"></div>
          <div class="t-dot"></div>
          <div class="t-dot"></div>
        </div>
      </div>

      <div class="stats-strip">
        <div class="stat-item">
          <div class="stat-value">10</div>
          <div class="stat-label">Scenarios</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color:var(--mood-red)">5</div>
          <div class="stat-label">Mood States</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color:var(--mood-green)">∞</div>
          <div class="stat-label">Sessions</div>
        </div>
      </div>
    </div>
  </div>

  <div class="left-footer">
    <div class="trust-row">
      <div class="trust-item"><span class="trust-icon">🔒</span> End-to-end encrypted</div>
      <div class="trust-item"><span class="trust-icon">⚡</span> Sessions auto-saved</div>
      <div class="trust-item"><span class="trust-icon">🎯</span> Free to use</div>
    </div>
  </div>
</div>

<!-- ── RIGHT PANEL ── -->
<div class="right-panel">
  <div class="right-inner">

    <!-- TABS -->
    <div class="auth-tabs">
      <button class="auth-tab active" onclick="switchTab('login')" id="tab-login">Sign in</button>
      <button class="auth-tab" onclick="switchTab('signup')" id="tab-signup">Create account</button>
    </div>

    <!-- SUCCESS STATE -->
    <div class="success-state" id="successState">
      <div class="success-icon">✓</div>
      <div class="success-title">You're in.</div>
      <div class="success-sub">Setting up your candidate dashboard.<br/>Redirecting now...</div>
    </div>

    <!-- LOGIN FORM -->
    <div class="form-panel active" id="panel-login">
      <div class="form-header">
        <div class="form-title">Welcome back.</div>
        <div class="form-sub">Sign in to continue your practice sessions.</div>
      </div>

      <form class="auth-form" onsubmit="handleLogin(event)">
        <div class="field-group">
          <label class="field-label" for="login-email">Email address</label>
          <input class="field-input" type="email" id="login-email" placeholder="you@email.com" autocomplete="email" required />
          <span class="field-error" id="login-email-err">Enter a valid email address.</span>
        </div>

        <div class="field-group">
          <label class="field-label" for="login-password">Password</label>
          <div class="field-password-wrap">
            <input class="field-input" type="password" id="login-password" placeholder="Your password" autocomplete="current-password" required />
            <button type="button" class="password-toggle" onclick="togglePass('login-password', this)" aria-label="Toggle password">
              <svg id="eye-login" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.3"/></svg>
            </button>
          </div>
          <span class="field-error" id="login-pass-err">Incorrect password.</span>
        </div>

        <div class="forgot-row">
          <a href="#" class="forgot-link">Forgot password?</a>
        </div>

        <button type="submit" class="btn-submit" id="loginBtn">
          <span class="btn-text">Sign in to Sentinel</span>
          <div class="btn-spinner"></div>
        </button>

        <div class="or-divider">
          <div class="or-line"></div>
          <span class="or-text">or continue with</span>
          <div class="or-line"></div>
        </div>

        <button type="button" class="btn-google" onclick="handleGoogle()">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M15.68 8.18c0-.57-.05-1.12-.14-1.64H8v3.1h4.3a3.67 3.67 0 01-1.6 2.41v2h2.58c1.51-1.39 2.38-3.44 2.38-5.87z" fill="#4285F4"/>
            <path d="M8 16c2.16 0 3.97-.72 5.29-1.94l-2.58-2a4.8 4.8 0 01-7.14-2.52H.96v2.06A8 8 0 008 16z" fill="#34A853"/>
            <path d="M3.57 9.54A4.8 4.8 0 013.32 8c0-.54.09-1.05.25-1.54V4.4H.96A8 8 0 000 8c0 1.29.31 2.51.96 3.6l2.61-2.06z" fill="#FBBC05"/>
            <path d="M8 3.18c1.22 0 2.3.42 3.16 1.24l2.37-2.37A8 8 0 00.96 4.4L3.57 6.46A4.8 4.8 0 018 3.18z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </form>

      <div class="switch-note">
        No account yet? <a href="#" class="switch-link" onclick="switchTab('signup');return false;">Create one free</a>
      </div>
    </div>

    <!-- SIGNUP FORM -->
    <div class="form-panel" id="panel-signup">
      <div class="form-header">
        <div class="form-title">Create your account.</div>
        <div class="form-sub">Free forever. No card required.</div>
      </div>

      <form class="auth-form" onsubmit="handleSignup(event)">
        <div class="name-row">
          <div class="field-group">
            <label class="field-label" for="signup-first">First name</label>
            <input class="field-input" type="text" id="signup-first" placeholder="Aditya" required autocomplete="given-name" />
          </div>
          <div class="field-group">
            <label class="field-label" for="signup-last">Last name</label>
            <input class="field-input" type="text" id="signup-last" placeholder="Singh" required autocomplete="family-name" />
          </div>
        </div>

        <div class="field-group">
          <label class="field-label" for="signup-email">Email address</label>
          <input class="field-input" type="email" id="signup-email" placeholder="you@email.com" required autocomplete="email" />
          <span class="field-error" id="signup-email-err">Enter a valid email address.</span>
        </div>

        <div class="field-group">
          <label class="field-label" for="signup-password">Password</label>
          <div class="field-password-wrap">
            <input class="field-input" type="password" id="signup-password" placeholder="Min. 8 characters" required autocomplete="new-password" />
            <button type="button" class="password-toggle" onclick="togglePass('signup-password', this)" aria-label="Toggle password">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.3"/></svg>
            </button>
          </div>
          <span class="field-error" id="signup-pass-err">Password must be at least 8 characters.</span>
        </div>

        <div class="field-group">
          <label class="field-label" for="signup-role">What best describes you?</label>
          <select class="field-input" id="signup-role" required style="cursor:pointer;appearance:none;background-image:url(\\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%234A4858' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\\");background-repeat:no-repeat;background-position:right 14px center;">
            <option value="" disabled selected>Select your role</option>
            <option value="student">Student</option>
            <option value="fresher">Fresher / Recent graduate</option>
            <option value="professional">Working professional</option>
            <option value="job-seeker">Job seeker</option>
          </select>
        </div>

        <button type="submit" class="btn-submit" id="signupBtn">
          <span class="btn-text">Create account — free</span>
          <div class="btn-spinner"></div>
        </button>

        <div class="or-divider">
          <div class="or-line"></div>
          <span class="or-text">or continue with</span>
          <div class="or-line"></div>
        </div>

        <button type="button" class="btn-google" onclick="handleGoogle()">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M15.68 8.18c0-.57-.05-1.12-.14-1.64H8v3.1h4.3a3.67 3.67 0 01-1.6 2.41v2h2.58c1.51-1.39 2.38-3.44 2.38-5.87z" fill="#4285F4"/>
            <path d="M8 16c2.16 0 3.97-.72 5.29-1.94l-2.58-2a4.8 4.8 0 01-7.14-2.52H.96v2.06A8 8 0 008 16z" fill="#34A853"/>
            <path d="M3.57 9.54A4.8 4.8 0 013.32 8c0-.54.09-1.05.25-1.54V4.4H.96A8 8 0 000 8c0 1.29.31 2.51.96 3.6l2.61-2.06z" fill="#FBBC05"/>
            <path d="M8 3.18c1.22 0 2.3.42 3.16 1.24l2.37-2.37A8 8 0 00.96 4.4L3.57 6.46A4.8 4.8 0 018 3.18z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p class="terms-note">By creating an account you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.</p>
      </form>

      <div class="switch-note">
        Already have an account? <a href="#" class="switch-link" onclick="switchTab('login');return false;">Sign in</a>
      </div>
    </div>

  </div>
</div>`

/**
 * Ported from the original static prototype (see Landing.jsx for the
 * same rationale). Login/signup handlers below are still local-only demo
 * stubs (setTimeout + fake success state) — wire them to
 * src/lib/supabase.js signIn/signUp once you're ready to swap them in.
 */
export default function Auth() {
  const rootRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    function onClick(e) {
      const link = e.target.closest('[data-route]')
      if (!link) return
      e.preventDefault()
      navigate(link.getAttribute('data-route'))
    }
    root.addEventListener('click', onClick)
    return () => root.removeEventListener('click', onClick)
  }, [navigate])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let cancelled = false
    const timers = []
    function trackedSleep(ms) {
      return new Promise((resolve) => {
        const id = setTimeout(resolve, ms)
        timers.push(id)
      })
    }


// ── TAB SWITCH ──
function switchTab(tab) {
  root.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  root.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
  root.querySelector('#tab-' + tab).classList.add('active');
  root.querySelector('#panel-' + tab).classList.add('active');
}

// ── PASSWORD TOGGLE ──
function togglePass(id, btn) {
  const input = root.querySelector('#' + id);
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.style.color = input.type === 'text' ? 'var(--accent-light)' : 'var(--text-dim)';
}

// ── GOOGLE ──
function handleGoogle() {
  // Wire to Supabase OAuth in production
  console.log('Google OAuth');
}

// ── LOGIN ──
function handleLogin(e) {
  e.preventDefault();
  const btn = root.querySelector('#loginBtn');
  btn.classList.add('loading');
  setTimeout(() => {
    btn.classList.remove('loading');
    root.querySelector('#panel-login').style.display = 'none';
    root.querySelector('.auth-tabs').style.display = 'none';
    root.querySelector('#successState').classList.add('show');
    setTimeout(() => { /* window.location.href = '/dashboard' */ }, 1500);
  }, 1400);
}

// ── SIGNUP ──
function handleSignup(e) {
  e.preventDefault();
  const pass = root.querySelector('#signup-password').value;
  const errEl = root.querySelector('#signup-pass-err');
  if (pass.length < 8) {
    root.querySelector('#signup-password').classList.add('error');
    errEl.classList.add('show');
    return;
  }
  root.querySelector('#signup-password').classList.remove('error');
  errEl.classList.remove('show');
  const btn = root.querySelector('#signupBtn');
  btn.classList.add('loading');
  setTimeout(() => {
    btn.classList.remove('loading');
    root.querySelector('#panel-signup').style.display = 'none';
    root.querySelector('.auth-tabs').style.display = 'none';
    root.querySelector('#successState').classList.add('show');
    setTimeout(() => { /* window.location.href = '/dashboard' */ }, 1500);
  }, 1600);
}

// ── LIVE PREVIEW ANIMATION ──
const msgs = [
  { role:'ai', text:'Walk me through a time you missed a deadline. What happened?', mood:'neutral', moodClass:'mood-neutral', bubbleClass:'bubble-ai' },
  { role:'user', text:'I think I maybe didn\'t communicate well enough with the team...', mood:null },
  { role:'ai', text:'"Maybe" isn\'t good enough. What specifically did you fail to do?', mood:'skeptical', moodClass:'mood-skeptical', bubbleClass:'bubble-skeptical' },
  { role:'user', text:'I owned the failure, ran a retro, and we shipped 3 days later with a new process that cut delays by 40%.', mood:null },
  { role:'ai', text:'That\'s a strong recovery. Tell me — whose idea was the new process?', mood:'impressed', moodClass:'mood-impressed', bubbleClass:'bubble-impressed' },
];

const msgsEl = root.querySelector('#previewMsgs');
const typingEl = root.querySelector('#previewTyping');
const moodEl = root.querySelector('#previewMood');
let running = false;

const sleep = trackedSleep;

async function runPreview() {
  if (running || cancelled) return;
  running = true;
  msgsEl.innerHTML = '';

  for (const m of msgs) {
    await sleep(m.role === 'ai' ? 700 : 1000);

    if (m.role === 'ai') {
      typingEl.classList.add('show');
      msgsEl.appendChild(typingEl);
      await sleep(1200);
      typingEl.classList.remove('show');
      if (m.mood) {
        moodEl.className = 'preview-mood ' + m.moodClass;
        moodEl.textContent = m.mood.charAt(0).toUpperCase() + m.mood.slice(1);
      }
    }

    const wrap = document.createElement('div');
    wrap.className = 'preview-msg';
    const isAI = m.role === 'ai';
    const bClass = m.bubbleClass || 'bubble-user';
    wrap.innerHTML = `
      <div class="pmsg-avatar ${isAI ? 'av-ai' : 'av-user'}">${isAI ? 'AI' : 'U'}</div>
      <div class="pmsg-bubble ${bClass}">${m.text}</div>`;
    msgsEl.appendChild(wrap);
    await sleep(30);
    wrap.classList.add('show');
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  await sleep(3000);
  running = false;
  runPreview();
}

const startTimer = setTimeout(runPreview, 800);
    timers.push(startTimer);


    // Inline onclick/onsubmit attributes in the markup above (switchTab,
    // togglePass, handleGoogle, handleLogin, handleSignup) resolve against
    // `window`, so expose these local functions there for the lifetime of
    // this component and clean them up on unmount.
    window.switchTab = switchTab
    window.togglePass = togglePass
    window.handleGoogle = handleGoogle
    window.handleLogin = handleLogin
    window.handleSignup = handleSignup

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      delete window.switchTab
      delete window.togglePass
      delete window.handleGoogle
      delete window.handleLogin
      delete window.handleSignup
    }
  }, [])

  return <div className="view-auth" ref={rootRef} dangerouslySetInnerHTML={{ __html: MARKUP }} />
}
