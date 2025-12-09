const { readdirSync, writeFileSync } = require('fs');
const { join } = require('path');
let root = __dirname;
let files = readdirSync(root).filter(v => v.endsWith('.json') && v !== 'db.json');
writeFileSync(join(root, 'db.json'), JSON.stringify(files, null, 2));