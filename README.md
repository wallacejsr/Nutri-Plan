<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/51e103e4-fc95-40fc-ae86-ebb964f904f9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Keep Alive Supabase

This project exposes a maintenance endpoint for serverless deployments:

`GET /api/keepalive?token=KEEPALIVE_TOKEN`

Required server-side environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `KEEPALIVE_TOKEN`

The endpoint inserts one row into `keep_alive_logs` with:

- `executed_at`
- `source`
- `status`

Use this URL in cron-job.org after deploy:

`https://YOUR_DOMAIN/api/keepalive?token=YOUR_KEEPALIVE_TOKEN`

Local test with Vercel CLI:

`vercel dev`

Then request:

`http://localhost:3000/api/keepalive?token=YOUR_KEEPALIVE_TOKEN`
