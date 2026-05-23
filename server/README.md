# ShadowNet AI — Backend

Express API, MongoDB Atlas, threat intelligence adapters, and Gemini integration.

Full guide: **[../README.md](../README.md)**

## Quick commands

```bash
npm install
copy .env.example .env   # Atlas MONGO_URI — see ../docs/MONGODB_ATLAS.md
npm run seed
npm run dev              # http://localhost:5001
```

## TI adapters (no GreyNoise)

| Adapter | Env variable | Key required? |
|---------|--------------|---------------|
| NVD | `NVD_API_KEY` | No (optional for higher limits) |
| RIPEstat | — | No |

Routes: `/api/ti/cve/:id`, `/api/ti/ip/:ip`, `/api/ti/domain/:domain`, `/api/ti/status`
