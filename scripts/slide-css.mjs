// The Loopdown — slide stylesheet.
//
// Rendered through Chromium (see carousel.mjs), so this is real CSS: grid,
// backdrop-filter, blend modes, and crucially AUTOMATIC TEXT WRAPPING. The old
// SVG renderer needed every line hand-broken because resvg has no text metrics.
// Headlines still take explicit line arrays because there the break is a design
// decision, but body copy is now just prose.
export const css = (accent) => `
:root {
  --accent: ${accent};
  --ink: #F4F8FC;
  --ink-dim: #A9B9CB;
  --ink-faint: #5E6A7A;
  --line: rgba(255,255,255,.09);
  --panel: rgba(4,7,12,.72);
  --danger: #FF6B81;
  --good: #7EE787;
  --paper: #E8DEC8;
  --sans: -apple-system, 'SF Pro Display', 'Helvetica Neue', Inter, sans-serif;
  --mono: 'SF Mono', 'JetBrains Mono', Menlo, monospace;
}
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:1080px; height:1350px; }
body {
  font-family: var(--sans);
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
  background: #06080B;
}

/* ── ground: gradient, grid, spotlight, vignette, grain ─────────────────── */
.slide {
  position:relative; width:1080px; height:1350px; overflow:hidden;
  padding: 96px 80px 210px;   /* bottom clears the absolutely-placed footer */
  display:flex; flex-direction:column;
  background:
    radial-gradient(120% 90% at 14% 2%, color-mix(in srgb, var(--accent) 26%, transparent) 0%, transparent 58%),
    linear-gradient(155deg, #141B25 0%, #0D1219 52%, #06080B 100%);
}
.slide::before {           /* grid + vignette */
  content:''; position:absolute; inset:0; pointer-events:none;
  background:
    linear-gradient(to right, rgba(255,255,255,.045) 1px, transparent 1px) 0 0/44px 44px,
    linear-gradient(to bottom, rgba(255,255,255,.045) 1px, transparent 1px) 0 0/44px 44px,
    radial-gradient(78% 68% at 50% 45%, transparent 55%, rgba(0,0,0,.62) 100%);
}
.slide::after {            /* film grain */
  content:''; position:absolute; inset:0; pointer-events:none; opacity:.055;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/><feColorMatrix type='saturate' values='0'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>");
}
.rail {
  position:absolute; left:0; top:0; width:10px; height:100%;
  background:linear-gradient(to bottom, var(--accent), color-mix(in srgb, var(--accent) 45%, transparent) 45%, transparent 100%);
}
.content { position:relative; z-index:2; flex:1; display:flex; flex-direction:column; min-height:0; }

/* ── type ───────────────────────────────────────────────────────────────── */
.kicker {
  font-family:var(--mono); font-size:27px; letter-spacing:.28em;
  color:var(--accent); text-transform:uppercase; margin-bottom:52px;
}
.kicker::before { content:'// '; opacity:.65; }
h1 {
  font-size:88px; line-height:1.04; letter-spacing:-.035em; font-weight:800;
  text-wrap:balance;
}
h1.sm { font-size:68px; line-height:1.08; }
h1 .hi { color:var(--accent); }
h1 .glow { text-shadow:0 0 64px color-mix(in srgb, var(--accent) 45%, transparent); }
.body { font-size:40px; line-height:1.55; color:var(--ink-dim); max-width:880px; }
.body p + p { margin-top:30px; }
.body strong { color:var(--ink); font-weight:600; }
.lede { font-size:44px; line-height:1.45; }
.spacer { flex:1; }

/* ── glass panel ────────────────────────────────────────────────────────── */
.panel {
  position:relative; border-radius:22px; background:var(--panel);
  border:1px solid var(--line); backdrop-filter:blur(14px);
  box-shadow:0 24px 70px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.06);
}

/* ── code ───────────────────────────────────────────────────────────────── */
.code { padding:0 0 34px; overflow:hidden; }
.chrome {
  display:flex; align-items:center; gap:11px; padding:22px 28px 20px;
  border-bottom:1px solid var(--line); margin-bottom:26px;
}
.dot { width:15px; height:15px; border-radius:50%; }
.fname { font-family:var(--mono); font-size:23px; color:var(--ink-faint); margin-left:14px; }
pre { font-family:var(--mono); font-size:31px; line-height:1.52; padding:0 34px; white-space:pre; }
.t-comment{color:#5A6675} .t-string{color:#7EE787} .t-kw{color:#FF7B9C}
.t-num{color:#F0A868} .t-fn{color:#8AB4F8} .t-type{color:#C6A6FF}
.t-punct{color:#8B98A8} .t-word{color:#C9D4E0}

.callout {
  margin-top:34px; padding:30px 36px; border-radius:16px; font-size:32px; line-height:1.45;
  background:color-mix(in srgb, var(--danger) 11%, transparent);
  border:1px solid color-mix(in srgb, var(--danger) 42%, transparent);
  color:#FFAFBC;
}
.callout b { color:var(--danger); display:block; margin-bottom:8px; font-weight:700; }

/* ── fix cards ──────────────────────────────────────────────────────────── */
.fixes { display:flex; flex-direction:column; gap:22px; margin-top:14px; }
.fix { display:flex; align-items:center; gap:28px; padding:30px 34px; border-radius:18px;
       background:var(--panel); border:1px solid var(--line); border-left:5px solid var(--accent);
       box-shadow:0 16px 44px rgba(0,0,0,.36); }
.fix .n { font-family:var(--mono); font-size:29px; font-weight:700; color:var(--accent); }
.fix .tx { flex:1; }
.fix .tt { font-size:37px; font-weight:700; letter-spacing:-.01em; }
.fix .ss { font-family:var(--mono); font-size:26px; color:var(--ink-dim); margin-top:9px; }

/* ── figures ────────────────────────────────────────────────────────────── */
.fig { display:flex; justify-content:center; margin:10px 0; }
.fig svg { width:100%; height:auto; }
.caption { font-size:31px; line-height:1.5; color:var(--ink-faint); margin-top:26px; max-width:900px; }

/* ── character plate ────────────────────────────────────────────────────── */
.plate { position:relative; display:flex; flex-direction:column; align-items:center;
         margin-top:26px; }
.plate .art { width:470px; }
.plate .art svg { width:100%; height:auto; }
.plate .label { width:100%; border-top:1px solid color-mix(in srgb, var(--accent) 34%, transparent);
                margin-top:24px; padding-top:26px; display:flex; align-items:baseline; }
.plate .nm { font-size:38px; font-weight:800; letter-spacing:.08em; }
.plate .cls { font-family:var(--mono); font-size:24px; color:var(--ink-faint); margin-top:10px; }
.plate .ex { margin-left:auto; font-family:var(--mono); font-size:24px; color:var(--accent); }
.ticks { position:absolute; inset:-18px -26px; pointer-events:none; }
.ticks i { position:absolute; width:34px; height:34px; border:2.5px solid var(--accent); opacity:.6; }
.ticks i:nth-child(1){ top:0; left:0; border-right:0; border-bottom:0; }
.ticks i:nth-child(2){ top:0; right:0; border-left:0; border-bottom:0; }
.ticks i:nth-child(3){ bottom:0; left:0; border-right:0; border-top:0; }
.ticks i:nth-child(4){ bottom:0; right:0; border-left:0; border-top:0; }

/* ── cover: type column left, cast art bleeding off the right ───────────── */
.ghost {
  position:absolute; right:36px; top:330px; z-index:1;
  font-size:300px; font-weight:800; letter-spacing:-.06em; line-height:1;
  color:var(--accent); opacity:.06;
}
.cover-art { position:absolute; right:-100px; bottom:-20px; width:520px; z-index:1; opacity:.28; }
.cover-art svg { width:100%; height:auto; }
.type-cover .body { max-width:560px; }
.type-cover h1 { max-width:760px; }

/* ── takeaway ───────────────────────────────────────────────────────────── */
.rule { width:92px; height:5px; border-radius:3px; background:var(--accent); margin-bottom:44px; }

/* ── footer ─────────────────────────────────────────────────────────────── */
footer {
  position:absolute; left:80px; right:80px; bottom:56px; z-index:3;
  border-top:1px solid var(--line); padding-top:28px;
  display:flex; align-items:center;
}
.brand { display:flex; align-items:center; gap:15px; }
.mark { width:26px; height:26px; border-radius:50%; border:3px solid var(--accent);
        display:grid; place-items:center; }
.mark i { width:9px; height:9px; border-radius:50%; background:var(--accent); }
.bname { font-family:var(--mono); font-size:27px; font-weight:600; }
.handle { font-family:var(--mono); font-size:23px; color:var(--ink-faint); margin-top:7px; }
.meta { margin-left:auto; text-align:right; }
.pg { font-family:var(--mono); font-size:29px; font-weight:700; color:var(--accent); }
.arrow { font-family:var(--mono); font-size:23px; color:var(--ink-faint); margin-top:7px; }
.progress { position:absolute; left:80px; right:80px; bottom:22px; height:3px;
            border-radius:2px; background:var(--line); overflow:hidden; z-index:3; }
.progress i { display:block; height:100%; background:var(--accent); border-radius:2px; }
`;
