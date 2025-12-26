const { readdirSync, writeFileSync, readFileSync } = require('fs');
const { join } = require('path');
let root = __dirname;
let files = readdirSync(join(root, 'books')).filter(v => v.endsWith('.json')).map(v => join(root, 'books', v)).map(v => { return { path: v, data: JSON.parse(readFileSync(v)) }; });

for ( const book of files ) {
    let path = book.path;
    let data = book.data;

    if(data.sharedBy === 'RJ Felipe') {
        data.availability = 'Not Available Anymore / Returned to Owner'
    }

    writeFileSync(path, JSON.stringify(data, null, 1))
}