const express = require('express');
const session = require('express-session');
const path    = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const APP_PIN        = process.env.APP_PIN        || 'change-me';
const SESSION_SECRET = process.env.SESSION_SECRET || 'little-lake-house-dev-secret';

/* ── Middleware ─────────────────────────────────────────────────────────── */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }  // 24 h
}));

/* ── Static assets (photos used by both pages) ──────────────────────────── */
app.use('/Pics', express.static(path.join(__dirname, 'Pics')));

/* ── Public: rental website ─────────────────────────────────────────────── */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'website.html'));
});

/* ── Login page ─────────────────────────────────────────────────────────── */
app.get('/login', (req, res) => {
  if (req.session.authenticated) return res.redirect('/app');
  res.send(loginPage());
});

app.post('/login', (req, res) => {
  if (req.body.pin === APP_PIN) {
    req.session.authenticated = true;
    res.redirect('/app');
  } else {
    res.send(loginPage('Incorrect PIN — please try again.'));
  }
});

/* ── Auth guard ─────────────────────────────────────────────────────────── */
function requireAuth(req, res, next) {
  if (req.session.authenticated) return next();
  res.redirect('/login');
}

/* ── Protected: property manager app ───────────────────────────────────── */
app.get('/app', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

/* ── Start ──────────────────────────────────────────────────────────────── */
app.listen(PORT, () => console.log(`Little Lake House running on port ${PORT}`));

/* ── Login page HTML ────────────────────────────────────────────────────── */
function loginPage(error = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Little Lake House — Manager Login</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(160deg, #0f2942 0%, #1a6b8a 60%, #22c55e 100%);
    }
    .card {
      background: #fff;
      border-radius: 18px;
      padding: 48px 40px 40px;
      width: 100%; max-width: 380px;
      box-shadow: 0 20px 60px rgba(0,0,0,.3);
      text-align: center;
    }
    .icon { font-size: 48px; margin-bottom: 12px; }
    h1 { font-size: 22px; font-weight: 800; color: #0f2942; margin-bottom: 4px; }
    p  { font-size: 14px; color: #64748b; margin-bottom: 28px; }
    label { display: block; text-align: left; font-size: 12px; font-weight: 600;
            color: #374151; margin-bottom: 6px; letter-spacing: .05em; }
    input[type="password"] {
      width: 100%; padding: 12px 16px;
      border: 2px solid #e2e8f0; border-radius: 10px;
      font-size: 18px; letter-spacing: .2em; text-align: center;
      outline: none; transition: border-color .2s;
      margin-bottom: 8px;
    }
    input[type="password"]:focus { border-color: #1a6b8a; }
    .error { font-size: 13px; color: #dc2626; margin-bottom: 16px; min-height: 20px; }
    button {
      width: 100%; padding: 13px;
      background: #1a6b8a; color: #fff;
      border: none; border-radius: 10px;
      font-size: 15px; font-weight: 700;
      cursor: pointer; transition: background .2s;
    }
    button:hover { background: #155e75; }
    .back { margin-top: 20px; font-size: 13px; color: #64748b; }
    .back a { color: #1a6b8a; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🏠</div>
    <h1>Little Lake House</h1>
    <p>Property Manager — Enter your PIN to continue</p>
    <form method="POST" action="/login">
      <label for="pin">PIN</label>
      <input type="password" id="pin" name="pin" inputmode="numeric"
             placeholder="••••" maxlength="8" autofocus required/>
      <div class="error">${error}</div>
      <button type="submit">Unlock</button>
    </form>
    <div class="back"><a href="/">← Back to rental site</a></div>
  </div>
</body>
</html>`;
}
