# bgcheck

Hourly beer price tracker for [beergourmet.hu](https://www.beergourmet.hu) clearance deals. Scrapes product listings, diffs against the previous snapshot, and publishes a dashboard to GitHub Pages.

**Live dashboard:** https://matraimilan.github.io/bgcheck

## How it works

- **GitHub Actions** crawls the site every hour (`index.js`)
- If prices or availability changed, a new snapshot is saved and the dashboard is rebuilt (`build.js`)
- The workflow deploys `dashboard/` to **GitHub Pages**
- A local script (`local-notify/check-update.js`) watches for new commits and sends a desktop notification

## Local setup

```bash
npm install
node index.js    # run a crawl manually
node build.js    # rebuild dashboard from existing snapshots
```

### Desktop notifications

Run `node local-notify/check-update.js` — if there's a new commit from the bot, a desktop notification appears linking to the dashboard.
