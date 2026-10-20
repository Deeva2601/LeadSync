# LeadSync — Meta Lead Ads + React Native Real-Time PoC

A minimal but fully functional Proof of Concept showing how Meta Lead Ad form submissions can appear **live** in a React Native app — with zero manual refresh on the device.

---

## Architecture

```
Meta Lead Testing Tool
        │
        │  POST /webhook  (Facebook Graph event)
        ▼
┌───────────────────┐
│  Node.js Backend  │  (Express + Socket.io)
│  port 3001        │──── stores leads in memory
└────────┬──────────┘
         │  Socket.io  emit('new_lead')
         ▼
┌───────────────────┐
│  React Native App │  LeadsScreen
│  Android Emulator │  shows live animated list
└───────────────────┘
```

**Key design choice:** The backend is the single source of truth. The RN app opens one persistent WebSocket connection via Socket.io. When Meta fires a webhook, the server immediately fans it out to every connected socket — the device updates within ~100 ms of the form submission.

---

## Folder Structure

```
LeadSync/
├── backend/              ← Node.js server
│   ├── server.js         ← main entry, webhook + socket logic
│   ├── package.json
│   └── .env              ← VERIFY_TOKEN, PORT
└── LeadSyncApp/          ← React Native 0.74
    ├── App.tsx
    └── src/
        ├── screens/
        │   └── LeadsScreen.jsx   ← main UI, socket listener
        ├── components/
        │   ├── LeadCard.jsx      ← animated lead row
        │   ├── ConnectionBanner.jsx
        │   └── EmptyState.jsx
        ├── services/
        │   └── socketService.js  ← singleton socket wrapper
        └── utils/
            ├── config.js         ← SERVER_URL
            └── helpers.js        ← pure field helpers
```

---

## Prerequisites

- Node.js ≥ 18
- Java 17 (JDK)
- Android Studio + Android SDK (API 34)
- Android Emulator running (or physical device)
- [ngrok](https://ngrok.com/) for exposing the webhook publicly
- A Meta Developer account with a Facebook Page and a Lead Ad Form

---

## Setup & Run

### 1 — Start the backend

```bash
cd backend
npm install
npm start
```

The server starts on `http://localhost:3001`.

### 2 — Expose via ngrok

```bash
ngrok http 3001
```

Copy the **Forwarding** URL, e.g. `https://abc123.ngrok-free.app`.

### 3 — Configure Meta Webhook

1. Go to **Meta for Developers → Your App → Webhooks**.
2. Add a new subscription:
   - **Callback URL:** `https://abc123.ngrok-free.app/webhook`
   - **Verify Token:** `leadsync_verify_2024`
3. Subscribe to the `leadgen` field on your **Page**.

### 4 — Start the React Native app

```bash
cd LeadSyncApp
npm install          # if not done already
npx react-native run-android
```

> **Note:** `SERVER_URL` in `src/utils/config.js` is pre-set to `http://10.0.2.2:3001` which is the Android emulator's loopback to the host machine. Change to your LAN IP for a physical device.

### 5 — Submit a test lead

1. Go to **Meta for Developers → Lead Ads Testing Tool**.
2. Select your Page and Lead Form.
3. Click **Preview Form**, fill it in, and submit.
4. Watch the lead appear in the app instantly 🎉

---

## Local Testing (no Meta account needed)

Use the simulate endpoint to fire a fake lead:

```bash
curl -X POST http://localhost:3001/leads/simulate \
  -H "Content-Type: application/json" \
  -d '{"name":"Priya Sharma","email":"priya@example.com","phone":"9876543210"}'
```

---

## Assumptions

1. A single-screen PoC is sufficient — no navigation, authentication, or persistence layer.
2. Leads are kept in memory on the server; a restart clears them (fine for demo purposes).
3. The `socket.io-client` WebSocket approach is preferred over FCM push notifications because it has no setup cost and demonstrates the real-time flow more clearly.
4. The Meta Lead Testing Tool sends the `field_data` array directly in the webhook payload; in production you would fetch it from the Graph API using the `leadgen_id`.
5. `10.0.2.2` is used for the Android emulator host loopback address.

---

## Video Walkthrough (Loom)

> *(Add your Loom link here)*

---

## License

MIT
