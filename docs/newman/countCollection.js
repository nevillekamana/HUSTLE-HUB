const fs = require('fs');
const colPath = process.argv[2] || 'docs/postman/HustleHub.part2.postman_collection.json';
const c = JSON.parse(fs.readFileSync(colPath,'utf8'));
const folders = c.item.map(i=>i.name);
let reqCount = 0;
function walk(it){ if(it.request) reqCount++; if(it.item) it.item.forEach(walk); }
if(Array.isArray(c.item)) c.item.forEach(it=>{ if(it.item) it.item.forEach(walk); else walk(it); });
console.log('folders:', folders.length);
folders.forEach((f,i)=>console.log((i+1)+'.',f));
console.log('requests:', reqCount);
