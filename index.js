const parse = require('node-html-parser').parse;
fs = require('fs');

const baseUrl = 'https://www.beergourmet.hu';
const fetchPath = '/masolat-keszletkisopres-es-akcio';
const itemDataAttribute = 'data-wnd_product_item_data';
const resultsFileName = 'results.json';
const resultsFileFolderName = 'data';
const resultsFilePath = `${__dirname}/${resultsFileFolderName}/${resultsFileName}`

const mapItems = (res) => {
        const attributes = res.attributes[itemDataAttribute];
        const parsedAttributes = JSON.parse(attributes);

        return {
                id: parsedAttributes.id,
                name: parsedAttributes.name,
                price: parsedAttributes.price,
                url: `${baseUrl}${parsedAttributes.detail_url}`
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

const matchResults = (prevResults, currentResults) => {
        const prevResultsIds = prevResults.map(({id}) => id);
        const currentResultsIds = currentResults.map(({id}) => id);

        const diff = prevResultsIds.filter(id => !currentResultsIds.includes(id))
                .concat(currentResultsIds.filter(id => !prevResultsIds.includes(id)));

        if (!diff.length) {
                console.log('There is nothing new, finishing...');
                return;
        }

        const removedItemIds = prevResultsIds.filter(id => diff.includes(id));
        const addedItemIds = currentResultsIds.filter(id => diff.includes(id));

        const removedItems = removedItemIds.map(id => prevResults.find(item => item.id === id));
        const addedItems = addedItemIds.map(id => currentResults.find(item => item.id === id));

        removedItems.length && console.log('The following items are removed:', removedItems);
        addedItems.length && console.log('The following items are added:', addedItems);

        writeResulsToFile(currentResults);
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
