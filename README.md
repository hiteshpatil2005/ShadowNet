# 🛡️ ShadowNet AI — Real-Time Threat Intelligence Platform

**ShadowNet AI** is a full-stack cybersecurity OSINT and threat intelligence platform. It discovers your organization's exposed assets, investigates IPs/domains/CVEs through live threat intelligence APIs, correlates risks using AI, simulates attack paths powered by Gemini, and generates executive security reports — all from one dark-themed web dashboard.

> ⚠️ **This platform uses only real, live data. No fake or demo data is ever shown.**  
> If you see "No data available", run an investigation first from the Investigate bar.

---

## ✨ Features

| Page | What it does |
|------|-------------|
| **Dashboard** | Live risk score, asset counts, alert distribution charts, threat radar |
| **Digital Footprint** | Discovered assets: subdomains, IPs, services, cloud exposures |
| **Investigate** | Search any IP, domain, or CVE — pulls from VirusTotal, AbuseIPDB, AlienVault OTX, etc. |
| **Exposure Correlation** | AI engine cross-correlates assets + credentials + TI data into risk correlations |
| **Attack Path Simulation** | Gemini AI generates realistic attack paths from your real discovered assets |
| **Infrastructure Graph** | Visual network map of all assets and their relationships |
| **Continuous Monitoring** | Live alert feed + scheduled scanning of your target domains |
| **Asset Profile** | Deep per-asset view: ports, CVEs, VirusTotal detections, WHOIS |
| **Leaked Credentials** | Breached emails and credentials linked to your organization |
| **Reporting** | Gemini AI generates a full executive security posture report from all your data |

---

## 🚀 Quick Setup (For Friends)

### Prerequisites

- [Node.js 18+](https://nodejs.org/) — download and install
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account
- A free [Google AI Studio](https://aistudio.google.com) account (for Gemini AI features)

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-username/ShadowNet.git
cd ShadowNet
```

---

### Step 2 — Set up MongoDB Atlas (Free)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → **Sign up free**
2. Create a **free M0 cluster** (any region)
3. Under **Database Access** → Add a database user (set a username + password)
4. Under **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`)
5. Under **Database** → **Connect** → **Drivers** → copy the connection string

The connection string looks like:
```
mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxxx.mongodb.net/?retryWrites=true&w=majority
```

Change `?retryWrites` to `/shadownet?retryWrites` to set the database name.

---

### Step 3 — Get your Gemini API Key (Free)

> Gemini powers AI Attack Path Simulation, Exposure Correlation analysis, and Executive Reports.

**Step-by-step:**

1. Go to **[aistudio.google.com/apikey](https://aistudio.google.com/apikey)**
2. Sign in with your **Google account**
3. Click **"Create API key"**
4. Select **"Create API key in new project"** (or choose an existing project)
5. Copy the key — it starts with `AIza...`

> 💡 **Free tier limits** (no credit card needed):
> - `gemini-1.5-flash` → **1,500 requests/day**, 15 requests/minute
> - Quota resets daily at **midnight UTC (5:30 AM IST)**
> - If you hit the limit, wait for reset or add billing in Google Cloud Console

---

### Step 4 — Get other free API keys (optional but recommended)

All keys go in `server/.env`. The more keys you add, the richer the threat intelligence data.

| Service | Sign up link | `.env` variable | Free tier |
|---------|-------------|-----------------|-----------|
| **VirusTotal** ⭐ | [virustotal.com/gui/join-us](https://www.virustotal.com/gui/join-us) | `VIRUSTOTAL_API_KEY` | 500 req/day |
| **AbuseIPDB** ⭐ | [abuseipdb.com/register](https://www.abuseipdb.com/register) | `ABUSEIPDB_API_KEY` | 1000 req/day |
| **AlienVault OTX** | [otx.alienvault.com](https://otx.alienvault.com) → API | `ALIENVAULT_OTX_KEY` | Unlimited |
| **URLScan.io** | [urlscan.io/user/signup](https://urlscan.io/user/signup) | `URLSCAN_API_KEY` | 1000 req/day |
| **ViewDNS** | [viewdns.info/api](https://viewdns.info/api/) | `VIEWDNS_API_KEY` | 250 req/day |
| **Criminal IP** | [criminalip.io](https://www.criminalip.io) | `CRIMINALIP_API_KEY` | 100 req/day |
| **ZoomEye** | [zoomeye.org](https://www.zoomeye.org) | `ZOOMEYE_API_KEY` | 10,000 results/month |
| **Hybrid Analysis** | [hybrid-analysis.com](https://hybrid-analysis.com) | `HYBRID_ANALYSIS_API_KEY` | Free |
| **NVD (CVEs)** | [nvd.nist.gov/developers/request-an-api-key](https://nvd.nist.gov/developers/request-an-api-key) | `NVD_API_KEY` | Higher rate limits |

> ⭐ = **Highly recommended** — VirusTotal and AbuseIPDB power most of the threat intelligence features.

---

### Step 5 — Configure the backend

```bash
cd server
npm install
```

Create `server/.env`:

```env
# ─── Core (REQUIRED) ───────────────────────────────────────────
PORT=5001
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxxx.mongodb.net/shadownet?retryWrites=true&w=majority
JWT_SECRET=replace-with-any-long-random-string-min-32-chars
JWT_REFRESH_SECRET=replace-with-another-long-random-string-min-32-chars

# ─── AI (Required for Attack Paths, Correlation AI, Reports) ───
GEMINI_API_KEY=AIzaSy...your-key-here

# ─── Threat Intelligence APIs (optional, more = richer data) ───
VIRUSTOTAL_API_KEY=
ABUSEIPDB_API_KEY=
ALIENVAULT_OTX_KEY=
URLSCAN_API_KEY=
VIEWDNS_API_KEY=
CRIMINALIP_API_KEY=
ZOOMEYE_API_KEY=
HYBRID_ANALYSIS_API_KEY=
NVD_API_KEY=
```

> **Never commit this file to Git.** It's already in `.gitignore`.

---

### Step 6 — Initialize the database

```bash
cd server
npm run seed
```

This creates the login account only — **no fake or demo data**.

**Login credentials:**

| Field | Value |
|-------|-------|
| Email | `analyst@shadownet.ai` |
| Password | `ShadowNet2026!` |

---

### Step 7 — Start both servers

**Terminal 1 — Backend API:**

```bash
cd server
npm run dev
```

Wait for: `🛡️ ShadowNet AI Backend running on port 5001`

**Terminal 2 — Frontend:**

```bash
cd client
npm install
npm run dev
```

**Windows shortcut:** Run `.\scripts\run-dev.ps1` to open both in separate terminal windows automatically.

---

### Step 8 — Open the app

1. Open **[http://localhost:5173](http://localhost:5173)** in your browser
2. Sign in with `analyst@shadownet.ai` / `ShadowNet2026!`
3. Check API health: **[http://localhost:5001/api/health](http://localhost:5001/api/health)** → should return `"status":"ok"`

---

## 📖 How to Use the Platform

### First time — collect real data

The dashboard starts empty. Here's the flow to get real threat intelligence data:

```
1. Investigate an IP/Domain     →   Header search bar → type any IP or domain
2. Run Correlation Analysis     →   Exposure Correlation page → "Run Analysis"
3. Generate Attack Paths        →   Attack Path Simulation → "Generate AI Paths"
4. Generate Executive Report    →   Reporting → "Generate AI Report"
```

### Page-by-page guide

#### 🔍 Investigate (Header search bar)
- Type any **IPv4 address** (e.g. `8.8.8.8`) or **domain** (e.g. `google.com`)
- ShadowNet queries all your configured APIs simultaneously
- Results are saved to your investigation history
- Press **Enter** or wait ~1 second after typing

#### 📊 Dashboard
- Shows live counts of assets, alerts, leaked credentials, correlations
- Charts auto-populate from your real data
- Click **Refresh** (sync icon) to reload latest data

#### 🌐 Digital Footprint
- View all discovered assets sorted by risk
- Tabs: Subdomains · Services · Leaked Credentials · Cloud Exposures
- Click any row → **View Profile** for full asset details

#### 🔗 Exposure Correlation
- Click **"Run Analysis"** to trigger the AI correlation engine
- Engine cross-correlates assets + credentials + TI investigations + VirusTotal detections
- Click **"AI Explain"** on any correlation card for Gemini's detailed analysis
- Use **Delete** buttons to remove false positives

#### 💥 Attack Path Simulation
- Click **"Generate AI Paths"** — Gemini analyzes your real assets and builds realistic attack scenarios
- Each path shows: Entry Point → MITRE ATT&CK stages → Target → Probability
- Click **"AI Narrative"** for a full written security analysis
- Click **"Generate Threat Personas"** to see predicted attacker profiles

#### 🕸️ Infrastructure Graph
- Auto-built from your discovered assets and their relationships
- **Hover** a node to see VirusTotal detection count
- **Filter** by risk level using the dropdown
- **Legend** at bottom explains all connection types

#### 📋 Reporting
- Click **"Generate AI Report"** — requires both Gemini API key AND real data
- Generates: Executive Summary · Key Findings · Immediate Actions · Compliance Gaps
- **Export PDF** via browser print dialog

#### 📡 Continuous Monitoring
- Add domains/IPs under **Continuous scan targets**
- Click **"Run scan now"** to immediately scan all targets
- New assets and alerts appear automatically in Digital Footprint

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| **Port 5001 in use** | Run `npm run fresh` in `server/` instead of `npm run dev` |
| **Blank dashboard / 401 errors** | Check `npm run dev` is running in `server/` on port 5001 |
| **MongoDB connection failed** | Atlas → Network Access → add your IP. Check username, password, and `/shadownet` in the URI |
| **Seed fails** | Fix MongoDB connection first, then retry `npm run seed` |
| **"No data available" everywhere** | Expected! Investigate an IP/domain first using the header search bar |
| **Gemini report returns 500** | Quota may be exhausted — resets at midnight UTC (5:30 AM IST). Try `gemini-1.5-flash` model |
| **Correlation analysis returns 400** | Need at least one investigation in the database first |
| **Session expired** | Log in again — access tokens expire after 15 minutes |
| **React DevTools warning** | Safe to ignore — install [React DevTools](https://react.dev/link/react-devtools) browser extension optionally |

### If you get `EADDRINUSE: address already in use :::5001`

```bash
cd server
npm run fresh    # kills whatever is on port 5001, then starts clean
```

---

## 📁 Project Structure

```
ShadowNet/
├── client/                  # React 19 + Vite 7 frontend
│   └── src/
│       ├── pages/           # All page components
│       ├── components/      # Shared UI components
│       ├── context/         # AppContext (global state)
│       └── services/        # API client (api.js)
│
├── server/                  # Node.js + Express backend
│   ├── routes/              # REST API routes
│   ├── models/              # Mongoose schemas
│   ├── services/            # geminiService, correlationEngine, TI adapters
│   ├── middleware/          # Auth, error handling
│   └── server.js            # Entry point
│
├── docs/                    # MongoDB Atlas setup guide
├── scripts/                 # run-dev.ps1 (Windows helper)
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, Tailwind CSS 4 |
| Backend | Node.js, Express 4 |
| Database | MongoDB Atlas (cloud, free M0 tier) |
| AI | Google Gemini 1.5 Flash |
| Threat Intel | VirusTotal · AbuseIPDB · AlienVault OTX · URLScan · ViewDNS · Criminal IP · ZoomEye · crt.sh · NVD · RIPEstat |
| Auth | JWT (access + refresh tokens) |
| Charts | Recharts |

---

## 🔑 Environment Variables Reference

```env
# REQUIRED
PORT=5001
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# AI (strongly recommended)
GEMINI_API_KEY=AIzaSy...

# Threat Intelligence
VIRUSTOTAL_API_KEY=
ABUSEIPDB_API_KEY=
ALIENVAULT_OTX_KEY=
URLSCAN_API_KEY=
VIEWDNS_API_KEY=
CRIMINALIP_API_KEY=
ZOOMEYE_API_KEY=
HYBRID_ANALYSIS_API_KEY=
NVD_API_KEY=
```

---

## 🔐 Security Notes

- **Never commit `server/.env` to Git** — already in `.gitignore`
- Only scan domains/IPs you **own or are authorized to test**
- Use strong, unique values for `JWT_SECRET` and `JWT_REFRESH_SECRET`
- MongoDB Atlas free tier has a 512MB storage limit — sufficient for development

---

## 📚 More Documentation

- [MongoDB Atlas Setup Guide](docs/MONGODB_ATLAS.md)
- [Google AI Studio — Get Gemini API Key](https://aistudio.google.com/apikey)
- [VirusTotal API Docs](https://docs.virustotal.com/)
- [AbuseIPDB API Docs](https://docs.abuseipdb.com/)
