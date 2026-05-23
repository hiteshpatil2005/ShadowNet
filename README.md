# ShadowNet AI

**ShadowNet AI** is an attack surface management and threat intelligence platform for security analysts. It maps your organization’s exposed assets (domains, cloud storage, credentials), correlates risks, simulates attack paths, and helps you monitor and report—all from one web dashboard.

---

## What this project does

| Feature | What you get |
|---------|----------------|
| **Dashboard** | Risk score, alerts, asset counts, trends |
| **Digital footprint** | Subdomains, leaked credentials, cloud misconfigurations |
| **Exposure correlation** | Heatmap linking services and credential leaks |
| **Attack path simulation** | Step-by-step adversary scenarios + remediation checklist |
| **Infrastructure graph** | Visual map of assets and relationships |
| **Continuous monitoring** | Live-style alert feed + keyword rules |
| **Asset profile** | Deep view per asset (ports, CVE from NVD, RIPEstat network context) |
| **Reporting** | Downloadable security summaries |

Data is stored in **MongoDB Atlas** and served by a **Node.js API**; the UI is **React**.

**No Docker required.** You only need Node.js, npm, and a MongoDB Atlas account (free tier). Everything runs as two local processes: the API and the Vite dev server.

---

## How to use this project

Follow these steps in order the first time. After that, only **steps 5–6** are needed for daily use.

### Step 1 — Install Node.js (no Docker)

- Install [Node.js 18+](https://nodejs.org/) — this is the only runtime you need
- Open the project folder in a terminal
- You do **not** need Docker Desktop or `docker compose`

### Step 2 — Set up MongoDB Atlas

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a **database user** (username + password).
3. Under **Network Access**, add your **current IP** (or `0.0.0.0/0` for dev only).
4. Copy the connection string and set the database name to **`shadownet`**.

Full walkthrough: **[docs/MONGODB_ATLAS.md](docs/MONGODB_ATLAS.md)**

### Step 3 — Configure the backend

```bash
cd server
npm install
copy .env.example .env
```

Edit `server/.env` (minimum required):

```env
PORT=5001
MONGO_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/shadownet?retryWrites=true&w=majority
JWT_SECRET=any-long-random-string
JWT_REFRESH_SECRET=another-long-random-string
```

Optional: add `GEMINI_API_KEY` and other TI keys (see [Free API keys](#free-api-keys-optional)).

### Step 4 — Load demo data

```bash
cd server
npm run seed
```

You should see `[SEED] ✅ Database seeded successfully!`

**Demo login** (use this after seeding):

| | |
|---|---|
| Email | `analyst@shadownet.ai` |
| Password | `ShadowNet2026!` |

### Step 5 — Start the API and the UI

**Terminal 1 — API:**

```bash
cd server
npm run dev
```

Wait for: `ShadowNet AI Backend running on port 5001`

**Terminal 2 — UI:**

```bash
cd client
npm install
npm run dev
```

**Windows:** you can run `.\scripts\run-dev.ps1` to open both in separate windows.

### Step 6 — Open the app and sign in

1. Browser: **http://localhost:5173**
2. Enter `analyst@shadownet.ai` / `ShadowNet2026!`
3. You land on the **Dashboard** with live data from Atlas

**Check the API:** http://localhost:5001/api/health → should return `"status":"ok"`

---

## Using the application (day-to-day)

### Sidebar pages

| Page | How to use it |
|------|----------------|
| **Dashboard** | Overview of risk, alerts, and stats. Use **Refresh** if you changed data. |
| **Digital Footprint** | Tabs: **Subdomains**, **Services & APIs**, **Leaked Credentials**, **Cloud**. Use search/filters. Click a row → **View profile** (or arrow) to open **Asset Profile**. |
| **Exposure Correlation** | Hover the heatmap where services meet credentials. Red/orange cells = high risk. Click to pivot to an asset. |
| **Attack Paths** | Pick **Scenario 1 / 2** at the top. Read stages and remediation checklist; tick tasks as you work them. **Generate new paths** calls the AI (needs `GEMINI_API_KEY`) or built-in fallbacks. |
| **Infrastructure Graph** | Drag nodes. **Click** a node for details → **Pivot to Profile File** for full asset view. **Reset Network Topology** restores layout. |
| **Continuous Monitoring** | Scroll the alert stream. **Acknowledge** or clear alerts. Add **monitoring rules** (keyword + type, e.g. domain `shadownet.ai`). |
| **Asset Profile** | Opens when you pivot from footprint/graph/search. Shows metadata, CVE info (from NVD if CVE in services), RIPEstat for IPs. Use the **notepad** to save analyst notes locally. |
| **Reporting** | Choose a template, toggle sections, **Generate report** → downloads a text report from current data. |

### Header (top bar)

- **Global search** — type domain, IP, or email; select a result to jump to **Asset Profile**
- **Alerts bell** — quick view of critical items

### Registering a new user

On the login screen, switch to **registration**: name, email, password, organization. That creates a **new** org with **empty** data unless you seed again or add assets via API. For exploring the demo, always use the seeded account above.

### What you type / provide

| What | Where | Example |
|------|--------|---------|
| Email & password | Login | `analyst@shadownet.ai` / `ShadowNet2026!` |
| New org signup | Register | Your company name, email, password (6+ chars) |
| Monitoring keyword | Monitoring → add rule | `admin@company.com`, `CVE-2024`, `mycompany.com` |
| Search | Header | `vpn.`, `203.0.113`, `admin@` |

Scanning external targets via API (`POST /api/assets/scan`) should only be used on domains you are authorized to test.

---

## Project structure

```text
ShadowNet/
├── client/          # React UI — npm install && npm run dev
├── server/          # Express API — npm install && npm run dev
├── docs/            # MongoDB Atlas guide
├── scripts/         # run-dev.ps1 (Windows, starts both apps)
└── README.md
```

Dependencies live only in `client/node_modules` and `server/node_modules`. Database is **cloud-only** via MongoDB Atlas (no local MongoDB container).

---

## Free API keys (optional)

All keys go in **`server/.env`**. The app runs without them using seed data and no-key sources.

### Works without any API key

| Source | Use |
|--------|-----|
| crt.sh | Certificates / subdomains |
| DNS enum | Subdomain discovery |
| OpenPhish / PhishTank | Phishing checks |
| abuse.ch | Threat feeds |
| NVD | CVE lookup (optional key for higher limits) |
| RIPEstat | IP/domain WHOIS & routing |

### Optional keys (free tiers)

| Service | Sign up | `.env` variable |
|---------|---------|-----------------|
| Google Gemini | https://aistudio.google.com/apikey | `GEMINI_API_KEY` |
| NVD (higher limits) | https://nvd.nist.gov/developers/request-an-api-key | `NVD_API_KEY` |
| AlienVault OTX | https://otx.alienvault.com/ → API Integration | `ALIENVAULT_OTX_KEY` |
| AbuseIPDB | https://www.abuseipdb.com/register → API | `ABUSEIPDB_API_KEY` |
| VirusTotal | https://www.virustotal.com/gui/join-us | `VIRUSTOTAL_API_KEY` |
| URLScan.io | https://urlscan.io/user/signup | `URLSCAN_API_KEY` |
| ViewDNS | https://viewdns.info/api/ | `VIEWDNS_API_KEY` |
| Criminal IP / ZoomEye / Hybrid Analysis | Vendor sites | See `server/.env.example` |

Restart the API after changing `.env`.

---

## API reference (for developers)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server status |
| POST | `/api/auth/login` | `{ "email", "password" }` |
| GET | `/api/dashboard/overview` | Stats (requires Bearer token) |
| GET | `/api/ti/cve/:cveId` | NVD CVE lookup |
| GET | `/api/ti/ip/:ip` | IP enrichment (AbuseIPDB, RIPEstat, etc.) |
| GET | `/api/ti/status` | Enabled threat intel adapters |

---

## Troubleshooting

| Problem | What to do |
|---------|------------|
| Blank dashboard / errors in UI | Is `npm run dev` running in **server** on port **5001**? Check http://localhost:5001/api/health |
| MongoDB connection failed | Atlas → **Network Access** → add your IP. Check `MONGO_URI` user, password, and `/shadownet` in the URI → [Atlas guide](docs/MONGODB_ATLAS.md) |
| Seed fails | Fix MongoDB first, then `cd server && npm run seed` |
| Login works but no assets | Run `npm run seed` and log in as `analyst@shadownet.ai` |
| Attack paths empty | Click **Generate new paths** or re-run seed |
| Session expired | Log in again (tokens expire after 15 minutes) |

---

## Technology stack

React 19 · Vite 7 · Tailwind CSS 4 · Express · MongoDB Atlas · JWT · Google Gemini (optional) · Threat intel adapters (NVD, RIPEstat, VirusTotal, AbuseIPDB, crt.sh, and others)

---

## Security notes

- Never commit `server/.env` to Git.
- Demo data uses fictional `shadownet.ai` assets—do not scan real third-party systems without permission.
- Use strong `JWT_SECRET` values in production.

---

## More documentation

- [MongoDB Atlas setup](docs/MONGODB_ATLAS.md)
- [Backend quick reference](server/README.md)
- [Frontend quick reference](client/README.md)
