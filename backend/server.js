// ─────────────────────────────────────────────────────────────────────────────
// LeadSync Backend  –  server.js
// Receives Meta Lead Ads webhooks, stores leads in memory,
// and pushes them to the React Native app over Socket.io in real-time.
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const httpServer = http.createServer(app);

// ── Socket.io setup ──────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: '*',          // React Native connects from device/emulator
    methods: ['GET', 'POST'],
  },
});

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── In-memory store (good enough for a PoC) ─────────────────────────────────
const leads = [];

// ── Config ───────────────────────────────────────────────────────────────────
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'leadsync_verify_2024';
const PORT        = process.env.PORT || 3001;

// ─────────────────────────────────────────────────────────────────────────────
// WEBHOOK – GET  (Meta verification handshake)
// Meta sends a GET request with hub.challenge that we must echo back.
// ─────────────────────────────────────────────────────────────────────────────
app.get('/webhook', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('[Webhook] Verification request received');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Webhook] Token matched – returning challenge');
    res.status(200).send(challenge);
  } else {
    console.warn('[Webhook] Token mismatch – rejecting');
    res.sendStatus(403);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// WEBHOOK – POST  (Meta lead event)
// Meta sends a POST every time a user submits the lead form.
// ─────────────────────────────────────────────────────────────────────────────
app.post('/webhook', (req, res) => {
  const body = req.body;

  // Meta always sends object: "page" for page subscriptions
  if (body.object !== 'page') {
    return res.sendStatus(404);
  }

  body.entry.forEach((entry) => {
    entry.changes.forEach((change) => {
      if (change.field !== 'leadgen') return;

      const raw = change.value;

      // Build a clean lead object
      const lead = {
        id:          uuidv4(),
        leadgenId:   raw.leadgen_id,
        formId:      raw.form_id,
        pageId:      raw.page_id,
        adId:        raw.ad_id   || null,
        adgroupId:   raw.adgroup_id || null,
        createdAt:   new Date().toISOString(),
        // field_data comes via the Graph API fetch in production;
        // for the PoC the Lead Testing Tool sends it directly in the webhook
        fields:      raw.field_data || [],
      };

      leads.unshift(lead);   // newest first
      console.log('[Lead Received]', JSON.stringify(lead, null, 2));

      // ── Real-time push ────────────────────────────────────────────────────
      io.emit('new_lead', lead);
    });
  });

  // Acknowledge immediately (Meta expects 200 within 5 s)
  res.sendStatus(200);
});

// ─────────────────────────────────────────────────────────────────────────────
// REST – GET /leads
// The app fetches existing leads on mount so the list isn't empty on cold start.
// ─────────────────────────────────────────────────────────────────────────────
app.get('/leads', (req, res) => {
  res.json({ leads });
});

// ─────────────────────────────────────────────────────────────────────────────
// REST – POST /leads/simulate  (dev helper – bypass Meta webhook for local test)
// curl -X POST http://localhost:3001/leads/simulate \
//   -H "Content-Type: application/json" \
//   -d '{"name":"Test User","email":"test@example.com","phone":"9999999999"}'
// ─────────────────────────────────────────────────────────────────────────────
app.post('/leads/simulate', (req, res) => {
  const { name, email, phone } = req.body;

  const lead = {
    id:        uuidv4(),
    leadgenId: `sim_${Date.now()}`,
    formId:    'simulated_form',
    pageId:    'simulated_page',
    adId:      null,
    adgroupId: null,
    createdAt: new Date().toISOString(),
    fields: [
      { name: 'full_name',    values: [name  || 'Test User'] },
      { name: 'email',        values: [email || 'test@example.com'] },
      { name: 'phone_number', values: [phone || '9999999999'] },
    ],
  };

  leads.unshift(lead);
  console.log('[Simulated Lead]', JSON.stringify(lead, null, 2));
  io.emit('new_lead', lead);

  res.status(201).json({ message: 'Lead created', lead });
});

// ─────────────────────────────────────────────────────────────────────────────
// REST – DELETE /leads  (clear all for demo purposes)
// ─────────────────────────────────────────────────────────────────────────────
app.delete('/leads', (req, res) => {
  leads.length = 0;
  io.emit('leads_cleared');
  res.json({ message: 'All leads cleared' });
});

// ─────────────────────────────────────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', leadsCount: leads.length, uptime: process.uptime() });
});

// ─────────────────────────────────────────────────────────────────────────────
// Socket.io connection lifecycle
// ─────────────────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Send existing leads immediately so the app has data on open
  socket.emit('initial_leads', leads);

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`\n✅ LeadSync backend running on port ${PORT}`);
  console.log(`   Webhook URL : http://localhost:${PORT}/webhook`);
  console.log(`   Verify token: ${VERIFY_TOKEN}`);
  console.log(`   Simulate    : POST http://localhost:${PORT}/leads/simulate\n`);
});
