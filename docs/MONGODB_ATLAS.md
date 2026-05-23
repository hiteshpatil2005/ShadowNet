# MongoDB Atlas setup for ShadowNet AI

ShadowNet uses **MongoDB Atlas** as the primary database. Follow these steps once; then use `npm run seed` and `npm run dev` as usual.

---

## 1. Create a free Atlas cluster

1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) and sign in.
2. Create an **M0 (Free)** cluster (any cloud region close to you is fine).
3. Wait until the cluster status is **Active** (a few minutes).

---

## 2. Create a database user

1. In Atlas, open your project → **Database Access** → **Add New Database User**.
2. Authentication: **Password**.
3. Username: e.g. `shadownet_app` (or any name you prefer).
4. Password: generate a strong password and **save it** (you need it for the connection string).
5. Database User Privileges: **Read and write to any database** (or restrict to database `shadownet` if you prefer).
6. Click **Add User**.

---

## 3. Allow network access (required)

Your PC must be allowed to connect to Atlas.

1. **Network Access** → **Add IP Address**.
2. For development on your own machine:
   - Click **Add Current IP Address**, or
   - Use `0.0.0.0/0` (**Allow access from anywhere**) — convenient for dev only; **do not use in production**.
3. Confirm.

If you skip this step, you will see errors like `ECONNREFUSED`, `querySrv ECONNREFUSED`, or timeout when running `npm run seed` or starting the API.

---

## 4. Get the connection string

1. **Database** → **Connect** on your cluster.
2. Choose **Drivers** → **Node.js**.
3. Copy the connection string. It looks like:

```text
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

4. Edit it for ShadowNet:
   - Replace `<username>` and `<password>` with your database user (see below if the password has special characters).
   - Add the database name **`shadownet`** before the `?`:

```text
mongodb+srv://shadownet_app:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/shadownet?retryWrites=true&w=majority
```

### Password with special characters

If your password contains `@`, `#`, `/`, etc., **URL-encode** it in the URI, or change the password in Atlas to letters and numbers only.

Example: password `P@ss#word` → `P%40ss%23word` in the URI.

---

## 5. Put the URI in `server/.env`

```bash
cd server
copy .env.example .env
```

Set:

```env
MONGO_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/shadownet?retryWrites=true&w=majority
```

Do **not** commit `.env` to Git (it is in `.gitignore`).

---

## 6. Seed and run

```bash
cd server
npm install
npm run seed
npm run dev
```

In another terminal:

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173 and log in with:

- **Email:** `analyst@shadownet.ai`
- **Password:** `ShadowNet2026!`

---

## Verify in Atlas

After a successful seed:

1. Atlas → **Database** → **Browse Collections**.
2. Database **`shadownet`** should contain collections such as `users`, `digitalassets`, `exposureevents`, `attackpaths`, etc.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `querySrv ECONNREFUSED` | Network Access: add your IP or `0.0.0.0/0` for dev |
| `bad auth : Authentication failed` | Wrong username/password in `MONGO_URI`; check Database Access user |
| `MongoServerError: user is not allowed` | User lacks read/write on `shadownet` database |
| Seed works but app empty | Log in with seeded user `analyst@shadownet.ai`, not a new org with no data |
| Connection timeout | Firewall/VPN blocking outbound 27017; try another network |

