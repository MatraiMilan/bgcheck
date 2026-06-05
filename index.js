import { parse } from "node-html-parser";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const baseUrl = 'https://www.beergourmet.hu';
const fetchPath = '/keszletkisopres-giga-akcio';
const itemDataAttribute = 'data-wnd_product_item_data';
const snapshotsDir = join(__dirname, 'data', 'snapshots');
const outOfStockText = 'Nincs raktáron';

const mapItems = (res, section = null) => {
        const attributes = res.attributes[itemDataAttribute];
        const parsedAttributes = JSON.parse(attributes);
        const isOutOfStock = res.innerText.includes(outOfStockText);
        const rawImage = parsedAttributes.image;
        const image = Array.isArray(rawImage) ? rawImage[0] : (rawImage || null);

        return {
                id: parsedAttributes.id,
                name: parsedAttributes.name,
                price: parsedAttributes.price,
                url: `${baseUrl}${parsedAttributes.detail_url}`,
                image,
                outOfStock: isOutOfStock,
                section
        };
};

const deduplicateById = (items) => {
        const seen = new Set();
        return items.filter(item => {
                if (seen.has(item.id)) return false;
                seen.add(item.id);
                return true;
        });
};

const scrapeResults = (html) => {
        const root = parse(html);
        const zones = root.querySelectorAll('[data-wnd_mvc_type="wnd.pc.ProductsZone"]');
        let currentSection = null;
        const allItems = [];

        zones.forEach(zone => {
                let node = zone;
                let heading = null;
                while (node.previousElementSibling) {
                        node = node.previousElementSibling;
                        const h = node.querySelector('h1,h2,h3');
                        if (h) { heading = h.innerText.trim(); break; }
                }
                if (heading && heading !== 'Kategóriák') currentSection = heading;
                zone.querySelectorAll('.item > .item-wrapper > a')
                        .forEach(el => allItems.push(mapItems(el, currentSection)));
        });

        return deduplicateById(allItems);
};

const readLatestSnapshot = () => {
        if (!fs.existsSync(snapshotsDir)) {
                fs.mkdirSync(snapshotsDir, { recursive: true });
                return [];
        }
        const files = fs.readdirSync(snapshotsDir).filter(f => f.endsWith('.json')).sort();
        if (!files.length) return [];
        return JSON.parse(fs.readFileSync(join(snapshotsDir, files.at(-1)))).products;
};

const writeSnapshotToFile = (results) => {
        const timestamp = new Date().toISOString();
        const filename = timestamp.replace(/[:.]/g, '-') + '.json';
        fs.writeFileSync(join(snapshotsDir, filename), JSON.stringify({ timestamp, products: results }));
        console.log(`Snapshot saved: data/snapshots/${filename}`);
};

const runBuild = () => {
        return import('./build.js').then(({ build }) => build()).catch(console.error);
};

const priceChangeCheck = (prevResults, prevResultsIds, currentResults, currentResultsIds) => {
        const stayedItemIds = prevResultsIds.filter(id => currentResultsIds.includes(id));
        if (!stayedItemIds.length) return [];
        const stayedPrevItems = prevResults.filter(prevItem => stayedItemIds.includes(prevItem.id));
        return stayedPrevItems
                .filter(prev => currentResults.find(curr => prev.id === curr.id && prev.price !== curr.price))
                .map(prev => {
                        const curr = currentResults.find(item => item.id === prev.id);
                        const { price: oldPrice, ...rest } = prev;
                        return { ...rest, oldPrice, newPrice: curr.price };
                });
};

const outOfStockChangeCheck = (prevResults, prevResultsIds, currentResults, currentResultsIds) => {
        const stayedItemIds = prevResultsIds.filter(id => currentResultsIds.includes(id));
        if (!stayedItemIds.length) return [];
        const stayedPrevItems = prevResults.filter(prevItem => stayedItemIds.includes(prevItem.id));
        return stayedPrevItems
                .filter(prev => currentResults.find(curr =>
                        prev.id === curr.id &&
                        prev.outOfStock !== curr.outOfStock &&
                        curr.outOfStock === true
                ))
                .map(prev => ({ ...prev, outOfStock: true }));
};

const pruneOldSnapshots = () => {
        if (!fs.existsSync(snapshotsDir)) return;
        const sixMonthsAgo = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000;
        fs.readdirSync(snapshotsDir)
                .filter(f => f.endsWith('.json'))
                .forEach(f => {
                        const filePath = join(snapshotsDir, f);
                        const lastModified = fs.statSync(filePath).mtimeMs;
                        if (lastModified < sixMonthsAgo) {
                                fs.unlinkSync(filePath);
                                console.log(`Pruned old snapshot: ${f}`);
                        }
                });
};

const matchResults = (prevResults, currentResults) => {
        const prevIds = prevResults.map(({ id }) => id);
        const currIds = currentResults.map(({ id }) => id);

        const removedIds = prevIds.filter(id => !currIds.includes(id));
        const addedIds = currIds.filter(id => !prevIds.includes(id));
        const itemsWithPriceChange = priceChangeCheck(prevResults, prevIds, currentResults, currIds);
        const newOutOfStockItems = outOfStockChangeCheck(prevResults, prevIds, currentResults, currIds);

        if (!(removedIds.length || addedIds.length || itemsWithPriceChange.length || newOutOfStockItems.length)) {
                console.log('No changes detected.');
                return;
        }

        if (removedIds.length) console.log('Removed:', removedIds.map(id => prevResults.find(i => i.id === id)));
        if (addedIds.length) console.log('Added:', addedIds.map(id => currentResults.find(i => i.id === id)));
        if (itemsWithPriceChange.length) console.log('Price changed:', itemsWithPriceChange);
        if (newOutOfStockItems.length) console.log('Out of stock:', newOutOfStockItems);

        pruneOldSnapshots();
        writeSnapshotToFile(currentResults);
        runBuild();
};

fetch(`${baseUrl}${fetchPath}`)
        .then(res => res.text())
        .then(html => {
                const results = scrapeResults(html);
                const prevResults = readLatestSnapshot();
                matchResults(prevResults, results);
        });
