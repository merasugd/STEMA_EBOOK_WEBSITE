const { readdirSync, writeFileSync } = require('fs');
const { join } = require('path');
let root = __dirname;
let files = readdirSync(root).filter(v => v.endsWith('.json') && v !== 'index.json');
writeFileSync(join(root, 'index.json'), JSON.stringify(files, null, 2));