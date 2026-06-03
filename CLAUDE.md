# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the script

```bash
npm start        # fetch and diff beer listings
node index.js    # equivalent
beercheck        # shell alias defined in ~/.bashrc
```

There are no tests and no build step.

## What this does

A Node.js ESM script (`index.js`) that scrapes the clearance sale page of `beergourmet.hu`, compares the current listings against the last known state (`data/results.json`), and fires a desktop notification if anything changed.

Each run:
1. Fetches the page and parses product items from `.item > .item-wrapper > a` elements using the `data-wnd_product_item_data` JSON attribute.
2. Reads `data/results.json` (creates it on first run).
3. Diffs previous vs. current: detects added items, removed items, price changes, and items that newly went out-of-stock (Hungarian: *Nincs raktáron*).
4. If there is any diff, overwrites `data/results.json` with current results and sends a desktop notification via `node-notifier`.
5. If nothing changed, exits silently.

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

`data/results.json` is gitignored and acts as the persistent previous-state snapshot between runs.
