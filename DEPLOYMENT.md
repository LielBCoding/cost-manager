# Deployment to Render.com

The four services are deployed as **four separate Render Web Services**, all from
this one repository (each points to a different sub-folder). They all share the
same MongoDB Atlas database.

## One-time setup
1. Create a free account at https://render.com and sign in with GitHub (LielBCoding).
2. Authorize Render to access the `cost-manager` repository.

## Create each Web Service (repeat 4 times)
For **each** service below, click **New + → Web Service**, pick the `cost-manager`
repo, and fill in:

| Service | Root Directory | Name (suggested) |
|---------|----------------|------------------|
| Logs (admin) | `a-logs-service` | `logs-service` |
| Users | `b-users-service` | `users-service` |
| Costs | `c-costs-service` | `costs-service` |
| About (admin) | `d-about-service` | `about-service` |

Common settings for all four:
* **Runtime:** Node
* **Build Command:** `npm install`
* **Start Command:** `npm start`
* **Instance type:** Free

### Environment variables (add to EVERY service)
| Key | Value |
|-----|-------|
| `MONGODB_URI` | the MongoDB Atlas connection string (same for all four) |
| `DB_NAME` | `cost_manager` |

> Do **not** set `PORT` — Render injects its own `PORT` (10000) and the code reads it.

## After deploy
Each service gets a public URL like `https://logs-service-xxxx.onrender.com`.
Open the base URL in a browser: it should show `Hello from the ... service`.
These four URLs go into the submission form (a = logs, b = users, c = costs, d = about).

> Note: free Render services sleep after inactivity; the first request after a
> pause may take ~30–60 seconds to wake up. That is normal.
