# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the script

```bash
npm start        # fetch and diff beer listings
node index.js    # equivalent
beercheck        # shell alias defined in ~/.bashrc
node build.js    # regenerate dashboard/index.html from existing snapshots
```

There are no tests. Open `dashboard/index.html` directly in a browser, or use the `beerresult` shell alias (defined in `~/.bashrc` as `~/git/bgcheck/open-dashboard.sh`).

## What this does

A Node.js ESM scraper (`index.js`) + static dashboard generator (`build.js`) for tracking beer prices on `beergourmet.hu`.

**Crawl flow (`index.js`):**
1. Fetches the clearance page and parses product items from `.item > .item-wrapper > a` via the `data-wnd_product_item_data` JSON attribute. Deduplicates by product ID (the page contains duplicates).
2. Reads the latest snapshot from `data/snapshots/` as previous state (empty array on first run).
3. Diffs previous vs. current: added/removed items, price changes, newly out-of-stock (Hungarian: *Nincs raktáron*).
4. If any diff: saves a timestamped snapshot to `data/snapshots/`, sends a clickable desktop notification via `notify.py`, and rebuilds the dashboard.

**Dashboard flow (`build.js`):**
- Reads all `data/snapshots/*.json` files in chronological order and aggregates per-product price/availability history.
- Generates `dashboard/index.html` — a self-contained static file with Chart.js (CDN) sparklines per card and a click-through modal with full price history chart.
- Run standalone with `node build.js` to regenerate without crawling.

## Scheduling

The script runs automatically via a **systemd user timer** (not cron), configured in `~/.config/systemd/user/beercheck.timer` and `beercheck.service`. It fires 1 minute after boot, then every hour. `Persistent=true` means missed runs are caught up after the machine wakes.

The service invokes the shell alias `beercheck` (defined in `~/.bashrc` as `node ~/git/bgcheck/index.js`) by launching an interactive bash session.

```bash
systemctl --user status beercheck.timer     # check schedule
journalctl --user -u beercheck.service      # view run logs
systemctl --user restart beercheck.timer    # restart timer
```

## Key constants

| Constant | Purpose |
|---|---|
| `fetchPath` | URL path to scrape — change this to target a different page |
| `itemDataAttribute` | HTML attribute name holding JSON product data |
| `outOfStockText` | Hungarian string used to detect out-of-stock state |

`data/` and `dashboard/` are both gitignored. `data/snapshots/` is the sole source of truth — the latest snapshot is the current state, older ones are the history. `dashboard/index.html` is generated output — open it directly in a browser.

## Notifications

Desktop notifications are sent via `notify.py` (Python + `gi.repository.Notify`), which is required because `notify-send --action` is not supported by the Ubuntu GNOME notification server. Clicking the notification runs `open-dashboard.sh`, which opens `dashboard/index.html` with the system default browser via `xdg-open`.

The `notify.py` process is spawned detached from Node.js (`detached: true` + `proc.unref()`) and exits automatically after 60 seconds if not interacted with.

```bash
# Test the notification manually
python3 ~/git/bgcheck/notify.py ~/git/bgcheck/assets/beer.png ~/git/bgcheck/open-dashboard.sh &
```
