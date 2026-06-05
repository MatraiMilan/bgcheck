# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the script

```bash
npm start        # fetch and diff beer listings
node index.js    # equivalent
node build.js    # regenerate dashboard/index.html from existing snapshots
```

There are no tests. The dashboard is hosted at https://matraimilan.github.io/bgcheck (auto-deployed via GitHub Actions to GitHub Pages).

## What this does

A Node.js ESM scraper (`index.js`) + static dashboard generator (`build.js`) for tracking beer prices on `beergourmet.hu`.

**Crawl flow (`index.js`):**
1. Fetches the clearance page and parses product items from `.item > .item-wrapper > a` via the `data-wnd_product_item_data` JSON attribute. Deduplicates by product ID (the page contains duplicates).
2. Reads the latest snapshot from `data/snapshots/` as previous state (empty array on first run).
3. Diffs previous vs. current: added/removed items, price changes, newly out-of-stock (Hungarian: *Nincs raktáron*).
4. If any diff: prunes snapshots older than 6 months, saves a timestamped snapshot to `data/snapshots/`, and rebuilds the dashboard.

**Dashboard flow (`build.js`):**
- Reads all `data/snapshots/*.json` files in chronological order and aggregates per-product price/availability history.
- Generates `dashboard/index.html` — a self-contained static file with Chart.js (CDN) sparklines per card and a click-through modal with full price history chart.
- Run standalone with `node build.js` to regenerate without crawling.

## Scheduling

Crawling runs automatically via **GitHub Actions** (`.github/workflows/crawl.yml`), hourly. On diff: commits new snapshot + rebuilt dashboard to `main`, then deploys `dashboard/` to GitHub Pages.

```bash
# Trigger manually via GitHub UI:
# Actions → Crawl → Run workflow
```

GitHub Actions handles crawling. The local `beercheck.timer` systemd timer runs `check-update.js` every 30 minutes for desktop notifications.

## Key constants

| Constant | Purpose |
|---|---|
| `fetchPath` | URL path to scrape — change this to target a different page |
| `itemDataAttribute` | HTML attribute name holding JSON product data |
| `outOfStockText` | Hungarian string used to detect out-of-stock state |

`data/snapshots/` is the sole source of truth — the latest snapshot is the current state, older ones are the history. `dashboard/index.html` is generated output committed to the repo and served via GitHub Pages.

## Local desktop notifications (`local-notify/`)

`local-notify/check-update.js` polls the GitHub API for new commits by `github-actions[bot]`. If a new commit is found, it sends a desktop notification (via `local-notify/notify.py`) that opens the dashboard on click.

The systemd unit files are stored in `local-notify/systemd/`. To install:

```bash
cp local-notify/systemd/beercheck.service ~/.config/systemd/user/
cp local-notify/systemd/beercheck.timer ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now beercheck.timer
```

```bash
# Test the notification directly (without crawl)
python3 ~/git/bgcheck/local-notify/notify.py ~/git/bgcheck/assets/beer.png https://matraimilan.github.io/bgcheck &
```

## Manual end-to-end test

1. Delete the latest snapshot and commit to force a diff on the next crawl:
   ```bash
   rm data/snapshots/$(ls -t data/snapshots/ | head -1)
   git add data/snapshots/
   git commit -m "chore: remove latest snapshot to trigger crawl"
   git push
   ```
2. Trigger the crawl manually: **Actions → Crawl → Run workflow**
3. Verify the crawl committed a new snapshot and the **Deploy** workflow started automatically after
4. Test the desktop notification locally:
   ```bash
   systemctl --user start beercheck.service
   ```
