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
# Actions → Crawl and deploy → Run workflow
```

The local systemd timer is disabled — GitHub Actions handles crawling.

## Key constants

| Constant | Purpose |
|---|---|
| `fetchPath` | URL path to scrape — change this to target a different page |
| `itemDataAttribute` | HTML attribute name holding JSON product data |
| `outOfStockText` | Hungarian string used to detect out-of-stock state |

`data/snapshots/` is the sole source of truth — the latest snapshot is the current state, older ones are the history. `dashboard/index.html` is generated output committed to the repo and served via GitHub Pages.

## Local desktop notifications (`local-notify/`)

`local-notify/check-update.js` polls the GitHub API for new commits by `github-actions[bot]`. If a new commit is found, it sends a desktop notification (via `local-notify/notify.py`) that opens the dashboard on click.

Requires a GitHub fine-grained personal access token with `Contents: Read-only` on this repo. Copy `local-notify/.env.example` to `local-notify/.env` and fill in the token.

```bash
# Test manually
node ~/git/bgcheck/local-notify/check-update.js

# Test the notification directly
python3 ~/git/bgcheck/local-notify/notify.py ~/git/bgcheck/assets/beer.png https://matraimilan.github.io/bgcheck &
```

The local systemd timer (once set up) runs `check-update.js` every 30 minutes.
