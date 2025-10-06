import notifier from 'node-notifier';
import { parse } from "node-html-parser";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const baseUrl = 'https://www.beergourmet.hu';
const fetchPath = '/keszletkisopres-giga-akcio';
const itemDataAttribute = 'data-wnd_product_item_data';
const resultsFileName = 'results.json';
const resultsFileFolderName = 'data';
const resultsFilePath = `${__dirname}/${resultsFileFolderName}/${resultsFileName}`;
const beerIconPath = `${__dirname}/assets/beer.png`;
const outOfStockText = 'Nincs raktáron';

const mapItems = (res) => {
        const attributes = res.attributes[itemDataAttribute];
        const parsedAttributes = JSON.parse(attributes);
        const isOutOfStock = res.innerText.includes(outOfStockText);

        return {
                id: parsedAttributes.id,
                name: parsedAttributes.name,
                price: parsedAttributes.price,
                url: `${baseUrl}${parsedAttributes.detail_url}`,
                outOfStock: isOutOfStock
        };
};

const writeResulsToFile = (results) => {
        console.log('Writing results to file...');
        fs.writeFileSync(resultsFilePath, JSON.stringify(results));
        console.log(`The ${resultsFileFolderName}/${resultsFileName} file has been updated with new results`);
};

const readResultsFromFile = () => {
        let resultsFromFile;

        if (fs.existsSync(resultsFilePath)) {
                const data = fs.readFileSync(resultsFilePath);
                resultsFromFile = JSON.parse(data);
        } else {
                console.log(`The ${resultsFileFolderName}/${resultsFileName} file is not exists, therefore creating it...`)
                fs.mkdirSync(resultsFileFolderName);
                fs.writeFileSync(resultsFilePath, JSON.stringify([]));
                console.log(`The ${resultsFileFolderName}/${resultsFileName} file has been created`);
                resultsFromFile = [];
        }

        return resultsFromFile;
};

const priceChangeCheck = (prevResults, prevResultsIds, currentResults, currentResultsIds) => {
        const stayedItemIds = prevResultsIds.filter(id => currentResultsIds.includes(id));
        
        if (!stayedItemIds.length) {
                return [];
        }

        const stayedPrevItems = prevResults.filter(prevItem => stayedItemIds.includes(prevItem.id));
        // return items with changed price
        return stayedPrevItems.filter(stayedPrevItem => 
                currentResults.find(currResult => stayedPrevItem.id === currResult.id && stayedPrevItem.price !== currResult.price)
        ).map(changedStayedPrevItem => {
                const oldPrice = changedStayedPrevItem.price;
                const newPrice = currentResults.find(item => item.id === changedStayedPrevItem.id).price;
                // the price will be oldPrice
                delete changedStayedPrevItem.price;

                return {
                        ...changedStayedPrevItem,
                        oldPrice,
                        newPrice
                };
        })
}

const outOfStockChangeCheck = (prevResults, prevResultsIds, currentResults, currentResultsIds) => {
        const stayedItemIds = prevResultsIds.filter(id => currentResultsIds.includes(id));

        if (!stayedItemIds.length) {
                return [];
        }

        const stayedPrevItems = prevResults.filter(prevItem => stayedItemIds.includes(prevItem.id));
        // return items with changed outOfStock value
        return stayedPrevItems.filter(stayedPrevItem => 
                currentResults.find(currResult => 
                        stayedPrevItem.id === currResult.id && 
                        stayedPrevItem.outOfStock !== currResult.outOfStock && 
                        currResult.outOfStock === true
                )
        ).map(changedStayedPrevItem => {
                return {
                        ...changedStayedPrevItem,
                        outOfStock: true
                };
        });

}

const showNotification = () => {
    notifier.notify(
        {
            title: 'BeerCheck Update 🍺',
            message: 'Új tételek — JSON frissítve!',
            icon: beerIconPath, // opcionális, pl. egy ikon
            wait: true       // true → kattintásra eseményt kapunk
        },
        function (err, response, metadata) {
            if (err) console.error(err);
        }
    );
};

const matchResults = (prevResults, currentResults) => {
        const prevResultsIds = prevResults.map(({id}) => id);
        const currentResultsIds = currentResults.map(({id}) => id);

        const removedItemIds = prevResultsIds.filter(id => !currentResultsIds.includes(id));
        const addedItemIds = currentResultsIds.filter(id => !prevResultsIds.includes(id));

        const diff = [...removedItemIds, ...addedItemIds];
        const itemsWithPriceChange = priceChangeCheck(prevResults, prevResultsIds, currentResults, currentResultsIds);
        const newOutOfStockItems = outOfStockChangeCheck(prevResults, prevResultsIds, currentResults, currentResultsIds);

        if (!(diff.length || itemsWithPriceChange.length || newOutOfStockItems.length)) {
                console.log('There is nothing new, finishing...');
                return;
        }

        const removedItems = removedItemIds.map(id => prevResults.find(item => item.id === id));
        const addedItems = addedItemIds.map(id => currentResults.find(item => item.id === id));

        removedItems.length && console.log('The following items are removed:', removedItems);
        addedItems.length && console.log('The following items are added:', addedItems);
        itemsWithPriceChange.length && console.log('The price of the following items has changed:', itemsWithPriceChange);
        newOutOfStockItems.length && console.log('The following items are out of stock now:', newOutOfStockItems);

        writeResulsToFile(currentResults);
        showNotification();
};

fetch(`${baseUrl}${fetchPath}`)
        .then(res => res.text())
        .then(html => {
                const root = parse(html);
                const results = root.querySelectorAll('.item > .item-wrapper > a')
                        .map(mapItems);
                
                const prevResults = readResultsFromFile()
                matchResults(prevResults, results);
        });
