const express        = require('express');
const { Pool }       = require('pg');
const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt            = require('jsonwebtoken');
const path           = require('path');
const session        = require('express-session');

const app  = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const ALLOWED_DOMAIN = 'capecreative.co';
const JWT_SECRET     = process.env.JWT_SECRET;
const APP_URL        = process.env.APP_URL || 'http://localhost:3000';

// ── Middleware ────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(session({ secret: JWT_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// ── Google OAuth ──────────────────────────────────────────
passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  APP_URL + '/auth/google/callback',
}, (_at, _rt, profile, done) => {
  const email = profile.emails?.[0]?.value || '';
  if (!email.endsWith('@' + ALLOWED_DOMAIN))
    return done(null, false, { message: 'Unauthorized domain' });
  done(null, { email, name: profile.displayName });
}));
passport.serializeUser((u, done) => done(null, u));
passport.deserializeUser((u, done) => done(null, u));

app.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));
app.get('/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/?auth=failed' }),
  (req, res) => {
    const token = jwt.sign(req.user, JWT_SECRET, { expiresIn: '30d' });
    res.redirect('/?token=' + token);
  }
);

// ── Auth middleware ───────────────────────────────────────
function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ── API routes ────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/projects', requireAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, source, file_type, name, created_at, size FROM projects ORDER BY created_at DESC'
    );
    res.json(rows.map(r => ({
      id: r.id, source: r.source, fileType: r.file_type,
      name: r.name, createdAt: r.created_at, size: r.size, data: ''
    })));
  } catch (err) {
    console.error('GET /api/projects error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/projects', requireAuth, async (req, res) => {
  try {
    const { source, fileType, name, createdAt, size, data } = req.body;
    await pool.query(
      'INSERT INTO projects (source, file_type, name, created_at, size, data) VALUES ($1,$2,$3,$4,$5,$6)',
      [source, fileType, name, createdAt, size, data]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/projects error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/projects/:id/data', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT data FROM projects WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ data: rows[0].data });
  } catch (err) {
    console.error('GET /api/projects/:id/data error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/projects/:id error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Static files ──────────────────────────────────────────
app.use(express.static(path.join(__dirname)));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(process.env.PORT || 3000, () => console.log('Design Sandbox running on port', process.env.PORT || 3000));
