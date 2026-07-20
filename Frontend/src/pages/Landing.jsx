import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './Landing.css'

const MARKUP = `<!-- ── NAV ── -->
<nav>
  <a href="#" class="nav-logo">
    <span class="nav-logo-dot"></span>
    Sentinel
  </a>
  <ul class="nav-links">
    <li><a href="#how-it-works">How it works</a></li>
    <li><a href="#mood-engine">Mood Engine</a></li>
    <li><a href="#report">Report</a></li>
  </ul>
  <div class="nav-cta">
    <a href="#" class="btn-ghost" data-route="/auth">Sign in</a>
    <a href="#" class="btn-primary" data-route="/auth">
      Start practicing
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7.5 4l3.5 3-3.5 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </a>
  </div>
</nav>

<!-- ── HERO ── -->
<section class="hero">
  <div class="hero-glow"></div>
  <div class="hero-glow-2"></div>

  <div class="hero-badge">
    <span class="hero-badge-dot"></span>
    AI Interview Simulator · Mood Engine Active
  </div>

  <!-- SIMULATION WINDOW -->
  <div class="sim-window" id="simWindow">
    <div class="sim-titlebar">
      <div class="sim-dots">
        <div class="sim-dot sim-dot-r"></div>
        <div class="sim-dot sim-dot-y"></div>
        <div class="sim-dot sim-dot-g"></div>
      </div>
      <div class="sim-title">sentinel://interview · behavioral · senior</div>
      <div class="sim-mood-badge neutral" id="moodBadge">Neutral</div>
    </div>

    <div class="sim-body" id="simBody">
      <!-- Messages injected by JS -->
    </div>

    <div class="sim-footer">
      <div class="sim-input" id="simInputDisplay">Type your response...</div>
      <div class="sim-send">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7.5 3l4.5 4-4.5 4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
    </div>
  </div>

  <!-- HERO TEXT -->
  <div class="hero-text">
    <h1 class="hero-headline">
      The interview sim<br/>that <em>actually fights back.</em>
    </h1>
    <p class="hero-sub">
      Most tools prepare you for polite questions. Sentinel prepares you for the real thing — an interviewer that reacts, challenges, and judges every answer you give.
    </p>
    <div class="hero-actions">
      <a href="#" class="btn-primary btn-large" data-route="/auth">
        Start a free session
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7.5 4l3.5 3-3.5 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>
      <a href="#how-it-works" class="btn-outline">See how it works</a>
    </div>
    <p class="hero-trust">Free to use · No card required · 10 interview types</p>
  </div>
</section>

<hr class="section-divider" />

<!-- ── HOW IT WORKS ── -->
<section id="how-it-works">
  <div class="section">
    <p class="section-label reveal">Process</p>
    <h2 class="section-title reveal">From setup to debrief<br/>in under 30 minutes.</h2>
    <p class="section-sub reveal">Pick your role, choose your pressure level, and walk into the hardest interview you've ever had.</p>

    <div class="steps-grid reveal">
      <div class="step-card">
        <div class="step-number">01</div>
        <div class="step-icon">🎯</div>
        <div class="step-title">Choose your scenario</div>
        <div class="step-desc">Select your role, interview type, style archetype, and difficulty. Startup casual to consulting high-pressure.</div>
      </div>
      <div class="step-card">
        <div class="step-number">02</div>
        <div class="step-icon">🤖</div>
        <div class="step-title">Face the interviewer</div>
        <div class="step-desc">Sentinel's AI maintains a hidden emotional state. It reacts to your answers. It challenges you when you're weak. You feel it.</div>
      </div>
      <div class="step-card">
        <div class="step-number">03</div>
        <div class="step-icon">📊</div>
        <div class="step-title">Get the brutal debrief</div>
        <div class="step-desc">See exactly when you lost the interviewer, what caused every mood shift, and what the ideal answer looked like.</div>
      </div>
      <div class="step-card">
        <div class="step-number">04</div>
        <div class="step-icon">📈</div>
        <div class="step-title">Track your progress</div>
        <div class="step-desc">Every session is saved. Watch your communication patterns improve, your STAR structure sharpen, your answers get direct.</div>
      </div>
    </div>
  </div>
</section>

<hr class="section-divider" />

<!-- ── MOOD ENGINE ── -->
<div class="mood-section" id="mood-engine">
  <div class="mood-inner">
    <div>
      <p class="section-label reveal">Mood Engine</p>
      <h2 class="section-title reveal">The interviewer has<br/>feelings. Use that.</h2>
      <p class="section-sub reveal">Every answer you give silently shifts the interviewer's internal state. You won't see a label — you'll feel the difference in how they respond.</p>

      <div class="mood-states reveal">
        <div class="mood-state-row">
          <div class="mood-indicator-dot" style="background:#56CF8A;box-shadow:0 0 8px #56CF8A"></div>
          <div class="mood-state-label">Impressed</div>
          <div class="mood-state-desc">Warm tone. Soft follow-ups. You're in control.</div>
          <div class="mood-arrow">→</div>
        </div>
        <div class="mood-state-row active">
          <div class="mood-indicator-dot" style="background:#CF9E56;box-shadow:0 0 8px #CF9E56"></div>
          <div class="mood-state-label">Neutral</div>
          <div class="mood-state-desc">Professional. Standard difficulty. Starting point.</div>
          <div class="mood-arrow">→</div>
        </div>
        <div class="mood-state-row">
          <div class="mood-indicator-dot" style="background:#CF7856;box-shadow:0 0 8px #CF7856"></div>
          <div class="mood-state-label">Skeptical</div>
          <div class="mood-state-desc">Probing questions. Needs more than your word.</div>
          <div class="mood-arrow">→</div>
        </div>
        <div class="mood-state-row">
          <div class="mood-indicator-dot" style="background:#A04040;box-shadow:0 0 8px #A04040"></div>
          <div class="mood-state-label">Losing Interest</div>
          <div class="mood-state-desc">Blunt. Short. They're mentally moving on.</div>
          <div class="mood-arrow">→</div>
        </div>
        <div class="mood-state-row">
          <div class="mood-indicator-dot" style="background:#CF5656;box-shadow:0 0 8px #CF5656"></div>
          <div class="mood-state-label">Hostile</div>
          <div class="mood-state-desc">Combative. May interrupt. Recover if you can.</div>
          <div class="mood-arrow">→</div>
        </div>
      </div>
    </div>

    <div class="reveal">
      <p class="section-label">Interview Types</p>
      <h3 style="font-size:22px;font-weight:700;letter-spacing:-0.02em;color:var(--text-primary);margin-bottom:8px;margin-top:12px;">10 scenarios.<br/>Every situation covered.</h3>
      <p style="font-size:14px;color:var(--text-muted);margin-bottom:0;line-height:1.7;">From your first HR call to the toughest performance review of your career.</p>
      <div class="types-grid">
        <div class="type-chip"><span class="type-chip-icon">🧑‍💼</span> HR Interview</div>
        <div class="type-chip"><span class="type-chip-icon">💻</span> Technical</div>
        <div class="type-chip"><span class="type-chip-icon">🧠</span> Behavioural</div>
        <div class="type-chip"><span class="type-chip-icon">📋</span> Performance Review</div>
        <div class="type-chip"><span class="type-chip-icon">💰</span> Salary Negotiation</div>
        <div class="type-chip"><span class="type-chip-icon">🚀</span> Promotion Talk</div>
        <div class="type-chip"><span class="type-chip-icon">😤</span> Difficult Manager</div>
        <div class="type-chip"><span class="type-chip-icon">🤝</span> Team Conflict</div>
        <div class="type-chip"><span class="type-chip-icon">📞</span> Client Meeting</div>
        <div class="type-chip"><span class="type-chip-icon">🚪</span> Exit Interview</div>
      </div>
    </div>
  </div>
</div>

<!-- ── REPORT SECTION ── -->
<section id="report">
  <div class="report-section">
    <p class="section-label reveal">Debrief Report</p>
    <h2 class="section-title reveal">See exactly where<br/>you lost them.</h2>
    <p class="section-sub reveal">Every session ends with a full breakdown — mood timeline, STAR analysis, language patterns, and ideal rewrites for every weak answer.</p>

    <div class="report-card reveal">
      <div class="report-header">
        <div>
          <div class="report-title">Session Report · Behavioral Interview · Senior SWE</div>
          <div class="report-meta" style="margin-top:4px;">12 turns · 18 minutes · Final mood: Skeptical</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="sim-mood-badge skeptical">Skeptical</div>
          <button class="btn-primary" style="padding:7px 14px;font-size:13px;opacity:0.5;cursor:default;">
            ↓ Download PDF
          </button>
        </div>
      </div>

      <div class="report-body">
        <!-- STAR -->
        <div class="report-block">
          <div class="report-block-title">STAR Analysis</div>
          <div class="star-row">
            <div class="star-label">Situation</div>
            <div class="star-bar-wrap"><div class="star-bar-fill" style="width:82%"></div></div>
            <div class="star-score">8.2</div>
          </div>
          <div class="star-row">
            <div class="star-label">Task</div>
            <div class="star-bar-wrap"><div class="star-bar-fill" style="width:74%"></div></div>
            <div class="star-score">7.4</div>
          </div>
          <div class="star-row">
            <div class="star-label">Action</div>
            <div class="star-bar-wrap"><div class="star-bar-fill" style="width:55%"></div></div>
            <div class="star-score">5.5</div>
          </div>
          <div class="star-row" style="margin-bottom:0">
            <div class="star-label">Result</div>
            <div class="star-bar-wrap"><div class="star-bar-fill" style="width:38%"></div></div>
            <div class="star-score" style="color:var(--mood-cold)">3.8</div>
          </div>
        </div>

        <!-- MOOD TIMELINE -->
        <div class="report-block">
          <div class="report-block-title">Mood Timeline</div>
          <div class="mood-timeline">
            <div class="timeline-bar" style="height:40%;background:#56CF8A;opacity:0.8" title="Turn 1-2: Impressed"></div>
            <div class="timeline-bar" style="height:50%;background:#56CF8A;opacity:0.8" title="Turn 3: Impressed"></div>
            <div class="timeline-bar" style="height:55%;background:#CF9E56" title="Turn 4: Neutral"></div>
            <div class="timeline-bar" style="height:60%;background:#CF9E56" title="Turn 5: Neutral"></div>
            <div class="timeline-bar" style="height:70%;background:#CF7856" title="Turn 6: Skeptical"></div>
            <div class="timeline-bar" style="height:80%;background:#CF7856" title="Turn 7: Skeptical"></div>
            <div class="timeline-bar" style="height:90%;background:#CF5656" title="Turn 8: Losing interest"></div>
            <div class="timeline-bar" style="height:100%;background:#CF5656" title="Turn 9: Hostile"></div>
            <div class="timeline-bar" style="height:85%;background:#CF7856" title="Turn 10: Skeptical"></div>
            <div class="timeline-bar" style="height:80%;background:#CF7856" title="Turn 11: Skeptical"></div>
            <div class="timeline-bar" style="height:75%;background:#CF9E56" title="Turn 12: Neutral"></div>
            <div class="timeline-bar" style="height:70%;background:#CF9E56" title="Turn 12: Neutral"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:8px;">
            <div style="font-size:11px;color:var(--text-dim);font-family:'JetBrains Mono',monospace">Turn 1</div>
            <div style="font-size:11px;color:var(--mood-cold);font-family:'JetBrains Mono',monospace">↑ Lost them here</div>
            <div style="font-size:11px;color:var(--text-dim);font-family:'JetBrains Mono',monospace">Turn 12</div>
          </div>
        </div>

        <!-- LANGUAGE PATTERNS -->
        <div class="report-block">
          <div class="report-block-title">Language Patterns</div>
          <div style="display:flex;flex-wrap:wrap;gap:2px">
            <div class="language-tag tag-warn">⚠ Excessive hedging</div>
            <div class="language-tag tag-warn">⚠ Filler dependency</div>
            <div class="language-tag tag-good">✓ Direct assertions</div>
            <div class="language-tag tag-warn">⚠ No quantified results</div>
            <div class="language-tag tag-good">✓ Structured opening</div>
          </div>
        </div>

        <!-- IDEAL REWRITE -->
        <div class="report-block">
          <div class="report-block-title">Ideal Answer — Turn 8</div>
          <div class="ideal-answer">
            "In Q3 last year, I led a migration that reduced our API latency by 40%. I identified the bottleneck, proposed a Redis caching layer to the team, implemented it over two sprints, and tracked the impact in Datadog. The result was a 40% drop in p95 latency and zero regressions."
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ── CTA ── -->
<section class="cta-section">
  <div class="cta-glow"></div>
  <h2>Ready to be<br/><em style="font-style:normal;background:linear-gradient(135deg,var(--accent),#A891FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">actually challenged?</em></h2>
  <p>Stop practicing with tools that go easy on you.<br/>Start preparing for the interview that actually matters.</p>
  <div class="hero-actions">
    <a href="#" class="btn-primary btn-large" data-route="/auth">
      Start your first session — free
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7.5 4l3.5 3-3.5 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </a>
  </div>
</section>

<!-- ── FOOTER ── -->
<footer>
  <div class="footer-logo">
    <span style="width:7px;height:7px;border-radius:50%;background:var(--accent);display:inline-block"></span>
    Sentinel
  </div>
  <div class="footer-copy">Built for VibeForge 1.0 · VYOMIQ</div>
  <div class="footer-links">
    <a href="#">Privacy</a>
    <a href="#">GitHub</a>
    <a href="#">Contact</a>
  </div>
</footer>`

/**
 * Ported from the original static prototype. Markup/CSS/animations are
 * kept as-is (via innerHTML) rather than fully rewritten as JSX, since
 * the design is hand-tuned CSS/SVG that isn't worth re-authoring by hand
 * right now — this can be broken into smaller components incrementally.
 */
export default function Landing() {
  const rootRef = useRef(null)
  const navigate = useNavigate()

  // Delegated click handling for internal navigation (data-route="/auth" etc.)
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

  // Original hero conversation animation + scroll reveals
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


// ── SIMULATION CONVERSATION ──
const conversation = [
  {
    role: 'ai',
    mood: 'neutral',
    moodLabel: 'Neutral',
    text: "Tell me about a time you had to deal with a conflict inside your team. Walk me through it.",
    delay: 800
  },
  {
    role: 'user',
    text: "Um, yeah so there was this situation where I think maybe there was like a disagreement with a teammate about the code architecture? We kind of sorted it out eventually.",
    delay: 2200
  },
  {
    role: 'ai',
    mood: 'skeptical',
    moodLabel: 'Skeptical',
    text: "\"Eventually\" isn't very specific. What exactly did you do to resolve it, and what was the actual outcome?",
    delay: 1800
  },
  {
    role: 'user',
    text: "I led a structured design review where I documented both approaches with tradeoffs. We aligned on a microservices split that cut deployment time by 35% over the next quarter.",
    delay: 2400
  },
  {
    role: 'ai',
    mood: 'impressed',
    moodLabel: 'Impressed',
    text: "That's much more compelling. A 35% improvement is a real result. Tell me — whose idea was the microservices approach originally?",
    delay: 1600
  }
];

const simBody = root.querySelector('#simBody');
const moodBadge = root.querySelector('#moodBadge');
let currentIndex = 0;
let isRunning = false;

function createTypingIndicator() {
  const wrap = document.createElement('div');
  wrap.className = 'sim-typing';
  wrap.id = 'typingIndicator';
  wrap.innerHTML = `
    <div class="sim-avatar avatar-ai">AI</div>
    <div class="typing-dots">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>`;
  return wrap;
}

function createMessage(turn) {
  const wrap = document.createElement('div');
  wrap.className = 'sim-msg';

  const isAI = turn.role === 'ai';
  const bubbleClass = isAI
    ? (turn.mood === 'skeptical' ? 'skeptical-bubble' : turn.mood === 'impressed' ? 'impressed-bubble' : 'ai-bubble')
    : '';

  wrap.innerHTML = `
    <div class="sim-avatar ${isAI ? 'avatar-ai' : 'avatar-user'}">${isAI ? 'AI' : 'You'}</div>
    <div class="sim-bubble ${bubbleClass}">${turn.text}</div>`;
  return wrap;
}

function updateMood(mood, label) {
  moodBadge.className = `sim-mood-badge ${mood}`;
  moodBadge.textContent = label;
}

const sleep = trackedSleep;

async function playConversation() {
  if (isRunning || cancelled) return;
  isRunning = true;
  simBody.innerHTML = '';

  for (let i = 0; i < conversation.length; i++) {
    const turn = conversation[i];
    await sleep(turn.delay);

    if (turn.role === 'ai') {
      // show typing
      const typing = createTypingIndicator();
      simBody.appendChild(typing);
      simBody.scrollTop = simBody.scrollHeight;
      await sleep(10);
      typing.classList.add('visible');
      await sleep(1400);

      // update mood before showing message
      if (turn.mood) updateMood(turn.mood, turn.moodLabel);

      typing.remove();
    }

    const msg = createMessage(turn);
    simBody.appendChild(msg);
    simBody.scrollTop = simBody.scrollHeight;
    await sleep(30);
    msg.classList.add('visible');
  }

  // loop after pause
  await sleep(3500);
  isRunning = false;
  playConversation();
}

// ── INTERSECTION OBSERVER FOR REVEALS ──
const reveals = root.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

reveals.forEach(el => observer.observe(el));

// ── START ──
const startTimer = setTimeout(playConversation, 600);
    timers.push(startTimer);


    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      observer.disconnect()
    }
  }, [])

  return <div className="view-landing" ref={rootRef} dangerouslySetInnerHTML={{ __html: MARKUP }} />
}
