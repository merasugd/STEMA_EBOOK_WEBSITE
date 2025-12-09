const { readdirSync, writeFileSync } = require('fs');
const { join } = require('path');
let root = __dirname;
let files = readdirSync(join(root, 'books')).filter(v => v.endsWith('.json'));
writeFileSync(join(root, 'db.json'), JSON.stringify(files, null, 2));