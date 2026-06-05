# bgcheck

Hourly beer price tracker for [beergourmet.hu](https://www.beergourmet.hu) clearance deals. Scrapes product listings, diffs against the previous snapshot, and publishes a dashboard to Netlify.

**Live dashboard:** https://bgcheck.netlify.app

## How it works

- **GitHub Actions** crawls the site every hour (`index.js`)
- If prices or availability changed, a new snapshot is saved and the dashboard is rebuilt (`build.js`)
- The commit triggers an automatic **Netlify** redeploy
- A local script (`local-notify/check-update.js`) watches for new commits and sends a desktop notification

## Local setup

```bash
npm install
node index.js    # run a crawl manually
node build.js    # rebuild dashboard from existing snapshots
```

### Desktop notifications

Copy `local-notify/.env.example` to `local-notify/.env` and add a GitHub fine-grained personal access token with `Contents: Read-only` on this repo:

```
BGCHECK_GITHUB_TOKEN=github_pat_your_token_here
```

Then run `node local-notify/check-update.js` — if there's a new commit from the bot, a desktop notification appears linking to the Netlify dashboard.
